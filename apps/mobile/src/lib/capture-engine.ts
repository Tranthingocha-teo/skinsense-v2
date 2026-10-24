import { Asset } from 'expo-asset';
import { loadTensorflowModel, type TfliteModel } from 'react-native-fast-tflite';
import { Images, type Image, type PixelFormat, type RawPixelData } from 'react-native-nitro-image';
import type { CameraController, Photo } from 'react-native-vision-camera';
import { createImageFaceDetector, type ImageFaceDetector } from 'react-native-vision-camera-face-detector';

import {
  ANALYSIS_MAX_SIDE,
  boundingBox,
  captureIssues,
  faceFraming,
  meanLuma,
  partitionSkinPixels,
  readZones,
  sharpness,
  type BoundingBox,
  type CaptureIssue,
  type Landmark,
  type ZoneReadings,
} from '@skinsense/domain';

// Native capture engine (ADR 0001): a vision-camera Photo → nitro Image → ML Kit
// face box (the same detector the live guide runs) → 1.5× square crop →
// MediaPipe face_landmark.tflite (192², 468 points in crop pixels, mapped back to
// full-image normalised coords) + selfie_multiclass_256x256.tflite, the segmenter
// web uses, so both masks mean face-skin (class 3 by argmax). Pixels come straight
// from nitro-image's bitmaps; no JPEG round trip (ticket 18's three decodes are gone).
const LANDMARK_INPUT = 192;
const MASK_INPUT = 256;
const LANDMARK_COUNT = 468;
const CROP_SCALE = 1.5; // MediaPipe's face-mesh graph pads the detector box the same way
const MASK_CLASSES = 6; // bg, hair, body-skin, face-skin, clothes, other
const FACE_SKIN_CLASS = 3;
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

export type Engine = { landmarker: TfliteModel; segmenter: TfliteModel; faceDetector: ImageFaceDetector };
export type LiveFace = { box: BoundingBox; yawAngle: number }; // box: view-normalised 0..1
export type Still = {
  image: ArrayBuffer; // JPEG ≤2MB, the raw unmirrored frame (web's mirror rule: screens mirror in style)
  previewUri: string;
  brightness: number;
  awbLocked: boolean;
  readings: ZoneReadings | null;
  issues: CaptureIssue[];
};

// fast-tflite 3's Android loader is `URL(path).readBytes()`: fine for Metro's
// http URL in dev, but a release build resolves the require() to the bare
// resource name `assets_models_face_landmark`, which is not a URL. expo-asset
// copies the embedded raw resource to the cache and hands back a file:// URL.
async function loadModel(module: number): Promise<TfliteModel> {
  const { localUri } = await Asset.fromModule(module).downloadAsync();
  return loadTensorflowModel({ url: localUri! }, []);
}

let engine: Promise<Engine> | undefined;

export function loadEngine(): Promise<Engine> {
  // ponytail: CPU delegate; the emulator has no GPU and 'android-gpu' needs the
  // config plugin's GPU libraries — measure on a phone before switching.
  return (engine ??= (async () => {
    const landmarker = await loadModel(require('../../assets/models/face_landmark.tflite'));
    const segmenter = await loadModel(require('../../assets/models/selfie_multiclass_256x256.tflite'));
    return { landmarker, segmenter, faceDetector: createImageFaceDetector({ performanceMode: 'accurate' }) };
  })().catch((err) => {
    engine = undefined; // a failed load (e.g. Metro unreachable) must not poison every later call
    throw err;
  }));
}

// Channel offsets of r, g, b and the stride per nitro-image pixel format.
const LAYOUT: Record<PixelFormat, [number, number, number, number]> = {
  RGBA: [0, 1, 2, 4],
  RGBX: [0, 1, 2, 4],
  BGRA: [2, 1, 0, 4],
  BGRX: [2, 1, 0, 4],
  ARGB: [1, 2, 3, 4],
  XRGB: [1, 2, 3, 4],
  ABGR: [3, 2, 1, 4],
  XBGR: [3, 2, 1, 4],
  RGB: [0, 1, 2, 3],
  BGR: [2, 1, 0, 3],
  unknown: [0, 1, 2, 4],
};

// Any nitro-image layout → the RGBA byte layout domain reads (canvas getImageData order).
export function toRgba({ buffer, width, height, pixelFormat }: RawPixelData): Uint8Array {
  const [r, g, b, stride] = LAYOUT[pixelFormat];
  const src = new Uint8Array(buffer);
  const count = width * height;
  const rgba = new Uint8Array(count * 4);
  for (let i = 0; i < count; i++) {
    rgba[i * 4] = src[i * stride + r];
    rgba[i * 4 + 1] = src[i * stride + g];
    rgba[i * 4 + 2] = src[i * stride + b];
    rgba[i * 4 + 3] = 255;
  }
  return rgba;
}

// RGBA bytes → the models' float32 RGB input in [0,1].
function toInput(rgba: Uint8Array): ArrayBuffer {
  const count = rgba.length / 4;
  const input = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    input[i * 3] = rgba[i * 4] / 255;
    input[i * 3 + 1] = rgba[i * 4 + 1] / 255;
    input[i * 3 + 2] = rgba[i * 4 + 2] / 255;
  }
  return input.buffer;
}

async function rgbaOf(image: Image, width: number, height: number): Promise<Uint8Array> {
  const resized = image.width === width && image.height === height ? image : await image.resizeAsync(width, height);
  return toRgba(await resized.toRawPixelDataAsync());
}

// Best effort, recorded on the Photo either way. ponytail: the lock is never
// released — the session ends with the screen, and a retake in the same light
// is exactly what the lock is for.
async function lockWhiteBalance(controller: CameraController | undefined): Promise<boolean> {
  try {
    await controller?.lockCurrentWhiteBalance();
    return controller !== undefined;
  } catch {
    return false;
  }
}

async function jpegUnder(image: Image, maxBytes: number): Promise<ArrayBuffer> {
  for (let quality = 0.92; ; quality -= 0.1) {
    const { buffer } = await image.toEncodedImageDataAsync('jpg', quality);
    if (buffer.byteLength <= maxBytes || quality <= 0.4) return buffer;
  }
}

async function detectLandmarks(engine: Engine, image: Image, uri: string): Promise<Landmark[] | null> {
  const [face] = engine.faceDetector.detectFaces(uri);
  if (!face) return null;
  // Square crop around ML Kit's box, clamped to the image (shrinks if it would spill).
  const { bounds } = face;
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  let side = Math.round(Math.max(bounds.width, bounds.height) * CROP_SCALE);
  side = Math.min(side, image.width, image.height);
  const originX = Math.round(Math.min(Math.max(cx - side / 2, 0), image.width - side));
  const originY = Math.round(Math.min(Math.max(cy - side / 2, 0), image.height - side));

  const crop = await image.cropAsync(originX, originY, originX + side, originY + side);
  const rgba = await rgbaOf(crop, LANDMARK_INPUT, LANDMARK_INPUT);
  const outputs = engine.landmarker.runSync([toInput(rgba)]).map((b) => new Float32Array(b));
  const mesh = outputs.find((o) => o.length === LANDMARK_COUNT * 3)!;
  const landmarks: Landmark[] = [];
  for (let i = 0; i < LANDMARK_COUNT; i++) {
    landmarks.push({
      x: (originX + (mesh[i * 3] / LANDMARK_INPUT) * side) / image.width,
      y: (originY + (mesh[i * 3 + 1] / LANDMARK_INPUT) * side) / image.height,
      z: ((mesh[i * 3 + 2] / LANDMARK_INPUT) * side) / image.width,
    });
  }
  return landmarks;
}

async function segmentFaceSkin(engine: Engine, image: Image, width: number, height: number): Promise<Uint8Array> {
  // ponytail: squashed to 256×256, no letterbox — face-skin counts matched web's
  // segmenter to 0.2 % on the portrait (ticket 18); letterbox if a phone frame shows otherwise.
  const rgba = await rgbaOf(image, MASK_INPUT, MASK_INPUT);
  const [maskOut] = engine.segmenter.runSync([toInput(rgba)]);
  const confidences = new Float32Array(maskOut);
  const classMask = new Uint8Array(MASK_INPUT * MASK_INPUT);
  for (let i = 0; i < classMask.length; i++) {
    let best = 0;
    for (let c = 1; c < MASK_CLASSES; c++) {
      if (confidences[i * MASK_CLASSES + c] > confidences[i * MASK_CLASSES + best]) best = c;
    }
    classMask[i] = best;
  }
  const skinMask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    const my = Math.floor((y / height) * MASK_INPUT);
    for (let x = 0; x < width; x++) {
      const mx = Math.floor((x / width) * MASK_INPUT);
      skinMask[y * width + x] = classMask[my * MASK_INPUT + mx] === FACE_SKIN_CLASS ? 1 : 0;
    }
  }
  return skinMask;
}

// Shutter: lock AWB, take the photo, analyse an uncompressed ≤640px copy
// (landmarks → face-skin mask → per-zone readings + quality signals), then
// JPEG-compress the full frame to ≤2MB for upload. Same steps as web's captureStill.
export async function captureStill(
  engine: Engine,
  controller: CameraController | undefined,
  takePhoto: () => Promise<Photo>,
): Promise<Still> {
  const awbLocked = await lockWhiteBalance(controller);
  const photo = await takePhoto();
  let image = await photo.toImageAsync();
  if (photo.isMirrored) image = await image.mirrorHorizontallyAsync();
  return analyseImage(engine, image, awbLocked);
}

async function analyseImage(engine: Engine, image: Image, awbLocked: boolean): Promise<Still> {
  const previewUri = `file://${await image.saveToTemporaryFileAsync('jpg', 0.92)}`;
  const scale = Math.min(1, ANALYSIS_MAX_SIDE / Math.max(image.width, image.height));
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);
  const rgba = await rgbaOf(image, width, height);
  const landmarks = await detectLandmarks(engine, image, previewUri);
  const jpeg = await jpegUnder(image, MAX_UPLOAD_BYTES);
  if (!landmarks) {
    return { image: jpeg, previewUri, brightness: meanLuma(rgba), awbLocked, readings: null, issues: ['noFace'] };
  }
  const skinMask = await segmentFaceSkin(engine, image, width, height);
  const readings = readZones(partitionSkinPixels({ width, height, landmarks, skinMask }, rgba));
  const brightness = meanLuma(rgba, skinMask);
  const issues = captureIssues({
    brightness,
    framing: faceFraming(landmarks),
    sharpness: sharpness(rgba, width, height, boundingBox(landmarks)),
  });
  return { image: jpeg, previewUri, brightness, awbLocked, readings, issues };
}

// Landmarks aren't retained (ADR 0001): mark-spots re-runs the landmarker on
// the stored JPEG (a file:// URI from photos.loadPhoto), the same crop → mesh →
// full-image normalised path capture used.
export async function detectImage(
  engine: Engine,
  uri: string,
): Promise<{ width: number; height: number; landmarks: Landmark[] | null }> {
  const image = await Images.loadFromFileAsync(uri.replace(/^file:\/\//, ''));
  return { width: image.width, height: image.height, landmarks: await detectLandmarks(engine, image, uri) };
}

// Live-guide badge: ML Kit's box stands in for the landmark bounding box the
// QUALITY cut-offs were rated on (it is a little taller — forehead/hair top),
// yaw comes from ML Kit's head-pose angle; the still's review re-checks with
// the real landmarks. Brightness is measured on a 64x48 preview snapshot.
export function liveIssues(face: LiveFace | null, brightness: number): CaptureIssue[] {
  if (!face) return captureIssues({ brightness, framing: null });
  const { minX, maxX, minY, maxY } = face.box;
  return captureIssues({
    brightness,
    framing: {
      faceWidth: maxX - minX,
      centerOffset: Math.hypot((minX + maxX) / 2 - 0.5, (minY + maxY) / 2 - 0.5),
      yaw: Math.abs(Math.sin((face.yawAngle * Math.PI) / 180)),
    },
  });
}

const SAMPLE = { width: 64, height: 48 };

export async function sampleBrightness(snapshot: Image, box: BoundingBox | null): Promise<number> {
  const rgba = await rgbaOf(snapshot, SAMPLE.width, SAMPLE.height);
  if (!box) return meanLuma(rgba);
  const mask = new Uint8Array(SAMPLE.width * SAMPLE.height);
  for (let y = 0; y < SAMPLE.height; y++) {
    for (let x = 0; x < SAMPLE.width; x++) {
      const nx = (x + 0.5) / SAMPLE.width;
      const ny = (y + 0.5) / SAMPLE.height;
      if (nx >= box.minX && nx <= box.maxX && ny >= box.minY && ny <= box.maxY) mask[y * SAMPLE.width + x] = 1;
    }
  }
  return meanLuma(rgba, mask);
}

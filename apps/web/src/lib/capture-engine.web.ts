import { FaceLandmarker, FilesetResolver, ImageSegmenter } from "@mediapipe/tasks-vision";
import {
  ANALYSIS_MAX_SIDE,
  boundingBox,
  captureIssues,
  faceFraming,
  meanLuma,
  partitionSkinPixels,
  readZones,
  sharpness,
  type CaptureIssue,
  type Landmark,
  type ZoneReadings,
} from "@skinsense/domain";

// Web capture engine (ADR 0001): getUserMedia + @mediapipe/tasks-vision, producing
// domain's FaceCapture. Same pinned version, model URLs and delegate as mpbench,
// the pipeline production-readiness ticket 07 verified (mask == input resolution).
const TASKS_VISION_VERSION = "0.10.21";
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`;
const FACE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const SEGMENTER_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite";
const FACE_SKIN_CLASS = 3; // selfie_multiclass_256x256: 0 bg, 1 hair, 2 body-skin, 3 face-skin, 4 clothes, 5 other
const LANDMARK_COUNT = 468; // drop FaceLandmarker's 10 iris points (ADR 0001)
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const SAMPLE_SIZE = { width: 64, height: 48 };

export type Engine = { landmarker: FaceLandmarker; segmenter: ImageSegmenter };
export type Still = {
  image: Blob;
  previewUrl: string;
  brightness: number;
  awbLocked: boolean;
  readings: ZoneReadings | null;
  issues: CaptureIssue[];
};

let engine: Promise<Engine> | undefined;

export function loadEngine(): Promise<Engine> {
  return (engine ??= createEngine());
}

async function createEngine(): Promise<Engine> {
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);
  const [landmarker, segmenter] = await Promise.all([
    FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate: "GPU" },
      runningMode: "VIDEO",
      numFaces: 1,
    }),
    ImageSegmenter.createFromOptions(vision, {
      baseOptions: { modelAssetPath: SEGMENTER_MODEL_URL, delegate: "GPU" },
      runningMode: "IMAGE",
      outputCategoryMask: true,
      outputConfidenceMasks: false,
    }),
  ]);
  return { landmarker, segmenter };
}

export async function startCamera(video: HTMLVideoElement): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
  });
  video.srcObject = stream;
  await video.play();
  return stream;
}

// VIDEO mode requires strictly increasing timestamps; a still captured between
// two preview samples must not step backwards.
let lastTimestamp = 0;
function detect(engine: Engine, source: HTMLVideoElement | HTMLCanvasElement, timestamp: number): Landmark[] | null {
  lastTimestamp = Math.max(timestamp, lastTimestamp + 1);
  const face = engine.landmarker.detectForVideo(source, lastTimestamp).faceLandmarks[0];
  return face ? face.slice(0, LANDMARK_COUNT).map(({ x, y, z }) => ({ x, y, z })) : null;
}

function draw(source: CanvasImageSource, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d", { willReadFrequently: true })!.drawImage(source, 0, 0, width, height);
  return canvas;
}

function pixels(canvas: HTMLCanvasElement) {
  return canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
}

// One live-guide sample: landmarks for the overlay plus the badge's issues.
// Brightness is measured inside the face box of a 64x48 copy — cheap, and close
// to the skin-mask luma the still records.
export function sampleFrame(
  engine: Engine,
  video: HTMLVideoElement,
  timestamp: number,
): { landmarks: Landmark[] | null; issues: CaptureIssue[] } {
  const landmarks = detect(engine, video, timestamp);
  const framing = landmarks ? faceFraming(landmarks) : null;
  const rgba = pixels(draw(video, SAMPLE_SIZE.width, SAMPLE_SIZE.height));
  let faceMask: Uint8Array | undefined;
  if (landmarks) {
    const box = boundingBox(landmarks);
    faceMask = new Uint8Array(SAMPLE_SIZE.width * SAMPLE_SIZE.height);
    for (let y = 0; y < SAMPLE_SIZE.height; y++) {
      for (let x = 0; x < SAMPLE_SIZE.width; x++) {
        const nx = (x + 0.5) / SAMPLE_SIZE.width;
        const ny = (y + 0.5) / SAMPLE_SIZE.height;
        if (nx >= box.minX && nx <= box.maxX && ny >= box.minY && ny <= box.maxY) faceMask[y * SAMPLE_SIZE.width + x] = 1;
      }
    }
  }
  return { landmarks, issues: captureIssues({ brightness: meanLuma(rgba, faceMask), framing }) };
}

// Best effort (docs/research/redness-index.md): only some Android Chrome builds
// expose whiteBalanceMode; the result is recorded on the Photo either way.
async function lockWhiteBalance(track: MediaStreamTrack | undefined): Promise<boolean> {
  const capabilities = track?.getCapabilities?.() as { whiteBalanceMode?: string[] } | undefined;
  if (!capabilities?.whiteBalanceMode?.includes("manual")) return false;
  try {
    await track!.applyConstraints({ advanced: [{ whiteBalanceMode: "manual" } as MediaTrackConstraintSet] });
    return true;
  } catch {
    return false;
  }
}

function segmentFaceSkin(engine: Engine, canvas: HTMLCanvasElement): Uint8Array {
  const result = engine.segmenter.segment(canvas);
  const mask = result.categoryMask!;
  if (mask.width !== canvas.width || mask.height !== canvas.height) {
    result.close();
    throw new Error(`segmenter mask ${mask.width}x${mask.height} does not match input ${canvas.width}x${canvas.height}`);
  }
  const classes = mask.getAsUint8Array();
  const skin = new Uint8Array(classes.length);
  for (let i = 0; i < classes.length; i++) skin[i] = classes[i] === FACE_SKIN_CLASS ? 1 : 0;
  result.close();
  return skin;
}

async function toJpegUnder(canvas: HTMLCanvasElement, maxBytes: number): Promise<Blob> {
  for (let quality = 0.92; ; quality -= 0.1) {
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", quality),
    );
    if (blob.size <= maxBytes || quality <= 0.4) return blob;
  }
}

// Shutter: lock AWB, grab the full frame, analyse an uncompressed ≤640px copy
// (landmarks → face-skin mask → per-zone readings + quality signals), then
// JPEG-compress the full frame to ≤2MB for upload.
export async function captureStill(engine: Engine, video: HTMLVideoElement, stream: MediaStream): Promise<Still> {
  const awbLocked = await lockWhiteBalance(stream.getVideoTracks()[0]);
  const full = draw(video, video.videoWidth, video.videoHeight);
  const scale = Math.min(1, ANALYSIS_MAX_SIDE / Math.max(full.width, full.height));
  const analysis = scale < 1 ? draw(full, Math.round(full.width * scale), Math.round(full.height * scale)) : full;
  const { width, height } = analysis;
  const rgba = pixels(analysis);
  const landmarks = detect(engine, analysis, performance.now());
  const image = await toJpegUnder(full, MAX_UPLOAD_BYTES);
  const previewUrl = URL.createObjectURL(image);
  if (!landmarks) {
    return { image, previewUrl, brightness: meanLuma(rgba), awbLocked, readings: null, issues: ["noFace"] };
  }
  const skinMask = segmentFaceSkin(engine, analysis);
  const readings = readZones(partitionSkinPixels({ width, height, landmarks, skinMask }, rgba));
  const brightness = meanLuma(rgba, skinMask);
  const issues = captureIssues({
    brightness,
    framing: faceFraming(landmarks),
    sharpness: sharpness(rgba, width, height, boundingBox(landmarks)),
  });
  return { image, previewUrl, brightness, awbLocked, readings, issues };
}

// Landmarks of a stored photo (mark-spots): the raw, unmirrored JPEG is analysed
// at the same ≤640px size as at capture, so zone assignment agrees with the
// readings saved then. Returns the image's own pixel size for the tap overlay.
export function detectImage(
  engine: Engine,
  image: HTMLImageElement,
): { width: number; height: number; landmarks: Landmark[] | null } {
  const { naturalWidth: width, naturalHeight: height } = image;
  const scale = Math.min(1, ANALYSIS_MAX_SIDE / Math.max(width, height));
  const landmarks = detect(engine, draw(image, Math.round(width * scale), Math.round(height * scale)), performance.now());
  return { width, height, landmarks };
}

export type PipelineMetrics = Record<
  "library" | "faceModel" | "segmenter" | "engine" | "landmarks" | "segmentation" | "zones" | "landmarkCount" | "mask",
  string
>;

// Demo metrics table (story 34): the capture analysis run on a still, each stage
// timed in this browser. Model load reads ~0 ms if the page already loaded the engine.
export async function measurePipeline(image: HTMLImageElement): Promise<PipelineMetrics | null> {
  const ms = (since: number) => `${Math.round(performance.now() - since)} ms`;
  let start = performance.now();
  const engine = await loadEngine();
  const engineTime = ms(start);
  const scale = Math.min(1, ANALYSIS_MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
  const analysis = draw(image, Math.round(image.naturalWidth * scale), Math.round(image.naturalHeight * scale));
  const { width, height } = analysis;
  const rgba = pixels(analysis);
  start = performance.now();
  const landmarks = detect(engine, analysis, start);
  const landmarkTime = ms(start);
  if (!landmarks) return null;
  start = performance.now();
  const skinMask = segmentFaceSkin(engine, analysis); // throws unless mask size == analysis size
  const segmentationTime = ms(start);
  start = performance.now();
  readZones(partitionSkinPixels({ width, height, landmarks, skinMask }, rgba));
  return {
    library: `MediaPipe Tasks Vision ${TASKS_VISION_VERSION}`,
    faceModel: FACE_MODEL_URL.split("/").pop()!,
    segmenter: SEGMENTER_MODEL_URL.split("/").pop()!,
    engine: engineTime,
    landmarks: landmarkTime,
    segmentation: segmentationTime,
    zones: ms(start),
    landmarkCount: String(landmarks.length),
    mask: `${width} × ${height}`,
  };
}

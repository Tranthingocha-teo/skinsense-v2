import { liveIssues, toRgba } from './capture-engine';

jest.mock('react-native-fast-tflite', () => ({ loadTensorflowModel: jest.fn() }));
jest.mock('react-native-nitro-image', () => ({ Images: {} }));
jest.mock('react-native-vision-camera-face-detector', () => ({ createImageFaceDetector: jest.fn() }));

describe('toRgba', () => {
  it('reorders any nitro-image channel layout into RGBA', () => {
    const px = { width: 1, height: 1 };
    const rgba = (buffer: number[], pixelFormat: string) =>
      Array.from(toRgba({ ...px, buffer: Uint8Array.from(buffer).buffer, pixelFormat: pixelFormat as never }));
    expect(rgba([10, 20, 30, 40], 'RGBA')).toEqual([10, 20, 30, 255]);
    expect(rgba([30, 20, 10, 40], 'BGRA')).toEqual([10, 20, 30, 255]);
    expect(rgba([40, 10, 20, 30], 'ARGB')).toEqual([10, 20, 30, 255]);
    expect(rgba([10, 20, 30], 'RGB')).toEqual([10, 20, 30, 255]);
  });
});

describe('liveIssues', () => {
  it('rates the ML Kit box like the landmark box and turns head pose into the yaw cut-off', () => {
    const centred = { box: { minX: 0.25, maxX: 0.75, minY: 0.2, maxY: 0.8 }, yawAngle: 0 };
    expect(liveIssues(centred, 120)).toEqual([]);
    expect(liveIssues({ ...centred, yawAngle: 30 }, 120)).toEqual(['turned']);
    expect(liveIssues({ box: { minX: 0.4, maxX: 0.6, minY: 0.4, maxY: 0.6 }, yawAngle: 0 }, 120)).toEqual(['far']);
    expect(liveIssues(null, 20)).toEqual(['noFace', 'dark']);
  });
});

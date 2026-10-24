import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Linking from 'expo-linking';

import '@/i18n';
import * as engine from '@/lib/capture-engine';
import * as photos from '@/lib/photos';
import { Capture } from './capture';

// Factories, not automocks: the real modules load native camera/tflite bindings.
jest.mock('@/lib/capture-engine', () => ({
  loadEngine: jest.fn(),
  captureStill: jest.fn(),
  liveIssues: jest.fn(() => ['noFace']),
  sampleBrightness: jest.fn(),
}));
jest.mock('@/lib/photos', () => ({ latestPhotoUrl: jest.fn(), savePhoto: jest.fn() }));
jest.mock('expo-linking', () => ({ openSettings: jest.fn(async () => {}) }));
const mockPermission = { hasPermission: true, requestPermission: jest.fn() };
jest.mock('react-native-vision-camera', () => ({
  CommonResolutions: { FHD_4_3: { width: 1440, height: 1920 } },
  useCameraPermission: () => mockPermission,
  usePhotoOutput: () => ({ capturePhoto: jest.fn() }),
}));
// The camera starts once, as soon as it mounts; the test drives face detections through `mockCamera`.
const mockCamera: { onFacesDetected?: (faces: unknown[]) => void } = {};
jest.mock('react-native-vision-camera-face-detector', () => {
  const { useEffect } = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    Camera: ({ onStarted, onFacesDetected }: { onStarted: () => void; onFacesDetected: (faces: unknown[]) => void }) => {
      mockCamera.onFacesDetected = onFacesDetected;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      useEffect(() => onStarted(), []);
      return <View testID="camera" />;
    },
  };
});
jest.mock('expo-image', () => ({ Image: () => null }));

const mockedEngine = engine as jest.Mocked<typeof engine>;
const mockedPhotos = photos as jest.Mocked<typeof photos>;

const reading = { redness: 1.5, unevenness: 0.4, pixelCount: 1200 };
const readings = { forehead: reading, leftCheek: reading, rightCheek: reading, nose: reading, chin: { redness: 0, unevenness: 0, pixelCount: 0 } };

function still(overrides: Partial<engine.Still>): engine.Still {
  return { image: new ArrayBuffer(8), previewUri: 'file:///still.jpg', brightness: 120, awbLocked: false, readings, issues: [], ...overrides };
}

async function renderCapture() {
  await render(<Capture />);
  const shutter = await screen.findByLabelText('Take photo');
  expect(shutter).toBeEnabled();
  return shutter;
}

async function renderReview(issues: engine.Still['issues'] = ['dark']) {
  mockedEngine.captureStill.mockResolvedValue(still({ issues, brightness: 40, awbLocked: true }));
  await fireEvent.press(await renderCapture());
  return screen.findByRole('alert');
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPermission.hasPermission = true;
  mockedEngine.loadEngine.mockResolvedValue({} as engine.Engine);
  mockedPhotos.latestPhotoUrl.mockResolvedValue(null);
  mockedPhotos.savePhoto.mockResolvedValue('photo-id');
});

describe('Capture', () => {
  it('keeps the shutter disabled until the engine is ready', async () => {
    let ready!: (engine: engine.Engine) => void;
    mockedEngine.loadEngine.mockReturnValue(new Promise((resolve) => (ready = resolve)));
    await render(<Capture />);
    expect(screen.getByLabelText('Opening camera…')).toBeDisabled();
    await act(async () => ready({} as engine.Engine));
    expect(await screen.findByLabelText('Take photo')).toBeEnabled();
    expect(screen.getByRole('status')).toHaveTextContent('Bring your face into the frame');
    expect(screen.getByText(/Keep the same distance/)).toBeTruthy();
  });

  it('shows the low-light badge while the frames are too dark', async () => {
    mockedEngine.liveIssues.mockReturnValue(['dark']);
    await renderCapture();
    // The viewfinder (the camera's parent) sizes the guide and the face box.
    await act(async () => screen.getByTestId('camera').parent!.props.onLayout({ nativeEvent: { layout: { width: 350, height: 467 } } }));
    await act(async () => mockCamera.onFacesDetected!([]));
    expect(screen.getByRole('status')).toHaveTextContent('Too dark');
  });

  it('lists the quality issues with Retake and Save anyway', async () => {
    const warning = await renderReview(['dark', 'turned']);
    expect(warning).toHaveTextContent(/This photo may give misleading readings:/);
    expect(warning).toHaveTextContent(/Too dark/);
    expect(warning).toHaveTextContent(/Face the camera/);
    expect(screen.getByText('Retake')).toBeTruthy();
    expect(screen.getByText('Save anyway')).toBeTruthy();
    expect(screen.queryByText('Save')).toBeNull();
  });

  it('a failed save shows the error inline and keeps the same still for retry', async () => {
    mockedPhotos.savePhoto.mockRejectedValueOnce(new Error('offline'));
    await renderReview();
    await fireEvent.press(screen.getByText('Save anyway'));
    await screen.findByText('Saving failed. Please try again.');
    await fireEvent.press(screen.getByText('Save anyway'));
    await screen.findByText('Saved');
    expect(mockedPhotos.savePhoto).toHaveBeenCalledTimes(2);
    expect(mockedEngine.captureStill).toHaveBeenCalledTimes(1);
  });

  it('saves the readings on request and shows the per-zone table', async () => {
    await renderReview();
    await fireEvent.press(screen.getByText('Save anyway'));
    await screen.findByText('Saved');
    expect(mockedPhotos.savePhoto).toHaveBeenCalledWith({ image: expect.any(ArrayBuffer), brightness: 40, awbLocked: true, readings });
    expect(screen.getByText(/Not a medical diagnosis/)).toBeTruthy();
    expect(screen.getByTestId('zone-chin')).toHaveTextContent('Chin——');
    expect(screen.getByTestId('zone-nose')).toHaveTextContent('Nose1.50.4');
    expect(screen.getByText('Take another')).toBeTruthy();
    expect(screen.getByText('Mark spots')).toBeTruthy();
    expect(screen.getByText('Done')).toBeTruthy();
  });

  it('a capture without a face can only be retaken', async () => {
    mockedEngine.captureStill.mockResolvedValue(still({ readings: null, issues: ['noFace'] }));
    await fireEvent.press(await renderCapture());

    await screen.findByText(/Bring your face into the frame/);
    expect(screen.queryByText(/^Save/)).toBeNull();
    await fireEvent.press(screen.getByText('Retake'));
    expect(await screen.findByLabelText('Take photo')).toBeEnabled();
    expect(mockedPhotos.savePhoto).not.toHaveBeenCalled();
  });

  it('camera denied: explains photos stay private, asks again, then opens Settings', async () => {
    mockPermission.hasPermission = false;
    mockPermission.requestPermission.mockResolvedValue(false);
    await render(<Capture />);
    const card = await screen.findByRole('alert');
    expect(card).toHaveTextContent(/Photos stay in your private storage/);
    expect(screen.getByLabelText('Take photo')).toBeDisabled();
    await fireEvent.press(screen.getByText('Allow camera access'));
    expect(mockPermission.requestPermission).toHaveBeenCalledTimes(2);
    expect(Linking.openSettings).toHaveBeenCalled();
  });
});

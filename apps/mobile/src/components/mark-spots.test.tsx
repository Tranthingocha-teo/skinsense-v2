import { ZONE_INDICES, type Landmark } from '@skinsense/domain';
import { fireEvent, render, screen } from '@testing-library/react-native';

import '@/i18n';
import * as engine from '@/lib/capture-engine';
import * as photos from '@/lib/photos';
import { MarkSpots } from './mark-spots';

// Factories, not automocks: the real modules load native tflite/file-system bindings.
jest.mock('@/lib/capture-engine', () => ({ loadEngine: jest.fn(), detectImage: jest.fn() }));
jest.mock('@/lib/photos', () => ({ loadPhoto: jest.fn(), loadSpots: jest.fn(), saveSpots: jest.fn() }));
jest.mock('expo-image', () => ({ Image: () => null }));

const mockedEngine = engine as jest.Mocked<typeof engine>;
const mockedPhotos = photos as jest.Mocked<typeof photos>;

// Synthetic face (same as web's test): every landmark at the centre except a nose
// ring (r 0.1 around 0.5,0.5) and a forehead ring (r 0.05 around 0.5,0.2), so the
// landmark box is x 0.4–0.6, y 0.15–0.6 and a tap at image (0.52, 0.5) is a nose spot.
function landmarks(): Landmark[] {
  const all: Landmark[] = Array.from({ length: 468 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
  const ring = (indices: number[], cx: number, cy: number, r: number) =>
    indices.forEach((index, i) => {
      const a = (2 * Math.PI * i) / indices.length;
      all[index] = { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), z: 0 };
    });
  ring(ZONE_INDICES.nose, 0.5, 0.5, 0.1);
  ring(ZONE_INDICES.forehead, 0.5, 0.2, 0.05);
  return all;
}

// The photo is 480×640 shown mirrored in a 300×400 box (scale 0.625, no crop):
// visual x = (1 − image x) · 480 · 0.625.
const tapAt = (imageX: number, imageY: number) => ({ nativeEvent: { locationX: (1 - imageX) * 300, locationY: imageY * 400 } });

async function renderMarkSpots() {
  await render(<MarkSpots photoId="photo-1" />);
  fireEvent(screen.getByTestId('photo'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 400 } } });
  return screen.findByLabelText('Tap the photo to mark a spot');
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedEngine.loadEngine.mockResolvedValue({} as engine.Engine);
  mockedEngine.detectImage.mockResolvedValue({ width: 480, height: 640, landmarks: landmarks() });
  mockedPhotos.loadPhoto.mockResolvedValue('file:///cache/photo-1.jpg');
  mockedPhotos.loadSpots.mockResolvedValue([]);
  mockedPhotos.saveSpots.mockResolvedValue(undefined);
});

describe('MarkSpots', () => {
  it('marks a tapped spot, counts it per zone, and saves it face-relative', async () => {
    const canvas = await renderMarkSpots();
    expect(screen.getByText('No spots yet — tap the photo to add')).toBeTruthy();

    await fireEvent.press(canvas, tapAt(0.52, 0.5));
    expect(screen.getByText('1 spot marked — tap the photo to add')).toBeTruthy();
    expect(screen.getByText('Nose 1')).toBeTruthy();

    await fireEvent.press(canvas, tapAt(0.9, 0.9)); // outside every zone
    expect(screen.getByText(/Tap on skin inside the face zones/)).toBeTruthy();
    expect(screen.getAllByLabelText('Remove spot')).toHaveLength(1);

    await fireEvent.press(screen.getByText('Save'));
    await screen.findByText('Saved');
    expect(mockedPhotos.saveSpots).toHaveBeenCalledTimes(1);
    const [photoId, saved] = mockedPhotos.saveSpots.mock.calls[0];
    expect(photoId).toBe('photo-1');
    expect(saved).toHaveLength(1);
    expect(saved[0].zone).toBe('nose');
    expect(saved[0].x).toBeCloseTo((0.52 - 0.4) / 0.2, 2);
    expect(saved[0].y).toBeCloseTo((0.5 - 0.15) / 0.45, 2);
  });

  it('shows stored spots on the photo and removes one on tap', async () => {
    mockedPhotos.loadSpots.mockResolvedValue([{ x: 0.6, y: (0.5 - 0.15) / 0.45, zone: 'nose' }]);
    await renderMarkSpots();
    await screen.findByText('1 spot marked — tap the photo to add');

    await fireEvent.press(screen.getByLabelText('Remove spot'));
    expect(screen.getByText('No spots yet — tap the photo to add')).toBeTruthy();
    expect(screen.queryByText(/Nose/)).toBeNull();
  });

  it('shows a failed save above the save button and saves on retry', async () => {
    mockedPhotos.saveSpots.mockRejectedValueOnce(new Error('network'));
    const canvas = await renderMarkSpots();
    await fireEvent.press(canvas, tapAt(0.52, 0.5));

    await fireEvent.press(screen.getByText('Save'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Saving failed. Please try again.');
    expect(screen.getByText('Nose 1')).toBeTruthy();

    await fireEvent.press(screen.getByText('Save'));
    await screen.findByText('Saved');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(mockedPhotos.saveSpots).toHaveBeenCalledTimes(2);
  });

  it('cannot mark a photo with no detectable face', async () => {
    mockedEngine.detectImage.mockResolvedValue({ width: 480, height: 640, landmarks: null });
    await render(<MarkSpots photoId="photo-1" />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/No face found/);
    expect(screen.queryByText('Save')).toBeNull();
    expect(screen.queryByLabelText('Tap the photo to mark a spot')).toBeNull();
  });
});

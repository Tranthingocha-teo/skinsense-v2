import { localDay } from '@skinsense/domain';
import { fireEvent, render, screen } from '@testing-library/react-native';

import '@/i18n';
import * as trends from '@/lib/trends';
import { Trends } from './trends';

// Factory, not automock: the real module loads the supabase client at import time.
jest.mock('@/lib/trends', () => ({ loadTrends: jest.fn(), signedPhotoUrls: jest.fn() }));
jest.mock('expo-image', () => ({ Image: () => null }));

const mocked = trends as jest.Mocked<typeof trends>;

const DAY = 86_400_000;
const at = (daysAgo: number) => new Date(Date.now() - daysAgo * DAY).toISOString();

afterEach(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  // Mid-month, so every photo day of the range sits in the calendar's opening month.
  jest.useFakeTimers({ advanceTimers: true, now: new Date(2026, 8, 15, 12) });
  jest.clearAllMocks();
  mocked.signedPhotoUrls.mockResolvedValue(['https://x/before', 'https://x/after']);
  mocked.loadTrends.mockResolvedValue({
    photos: [
      { id: 'p1', taken_at: at(2), storage_path: 'u/p1.jpg' },
      { id: 'p2', taken_at: at(0), storage_path: 'u/p2.jpg' },
    ],
    readings: [
      { photo_id: 'p1', zone: 'forehead', redness: 2.4 },
      { photo_id: 'p2', zone: 'forehead', redness: 0.9 },
      { photo_id: 'p1', zone: 'nose', redness: 1.0 },
      { photo_id: 'p2', zone: 'nose', redness: 1.05 },
    ],
    spots: [
      { photo_id: 'p1', zone: 'forehead' },
      { photo_id: 'p2', zone: 'forehead' },
      { photo_id: 'p2', zone: 'forehead' },
    ],
    entries: [
      { night: localDay(new Date(Date.now() - 2 * DAY)), completed_labels: ['a', 'b', 'c'], item_count: 4 },
      { night: localDay(new Date()), completed_labels: ['a'], item_count: 4 },
    ],
  });
});

describe('Trends', () => {
  it("shows the selected zone's redness series, spot count, routine % and the before/after slider", async () => {
    await render(<Trends />);
    expect(await screen.findByLabelText('Redness index for Forehead, 2 days with data')).toBeTruthy();
    expect(screen.getByText('↓ trending down')).toBeTruthy();
    expect(screen.getByText('Latest: 0.9')).toBeTruthy();
    expect(screen.getByText('2 / Forehead')).toBeTruthy(); // spots on the latest photo
    expect(screen.getByText('33%')).toBeTruthy(); // 75%, an unticked night (0%), 25%
    expect(screen.getByLabelText('Drag to compare')).toBeTruthy();
    expect(mocked.signedPhotoUrls).toHaveBeenCalledWith(['u/p1.jpg', 'u/p2.jpg']);
  });

  it('switches zone and window', async () => {
    await render(<Trends />);
    await screen.findByLabelText(/Forehead/);
    await fireEvent.press(screen.getByRole('radio', { name: 'Nose' }));
    expect(screen.getByRole('radio', { name: 'Nose' })).toBeChecked();
    expect(screen.getByLabelText('Redness index for Nose, 2 days with data')).toBeTruthy();
    expect(screen.getByText('→ steady')).toBeTruthy();
    expect(screen.getByText('0 / Nose')).toBeTruthy(); // no nose spots

    await fireEvent.press(screen.getByRole('radio', { name: '30 days' }));
    expect(screen.getByRole('radio', { name: '30 days' })).toBeChecked();
    expect(mocked.loadTrends).toHaveBeenCalledTimes(2);
    expect(await screen.findByLabelText('Redness index for Nose, 2 days with data')).toBeTruthy();
  });

  it('explains when fewer than two photos exist', async () => {
    mocked.loadTrends.mockResolvedValue({ photos: [], readings: [], spots: [], entries: [] });
    await render(<Trends />);
    expect(await screen.findByText('No photos in this window yet')).toBeTruthy();
    expect(screen.getByText('Needs at least 2 photos in this window')).toBeTruthy();
    expect(screen.getByText('—')).toBeTruthy();
    expect(screen.queryByLabelText('Drag to compare')).toBeNull();
  });

  it('compares two chosen dates, enabling only days with photos', async () => {
    const photos = [5, 3, 2, 0].map((ago, i) => ({ id: `p${i}`, taken_at: at(ago), storage_path: `u/p${i}.jpg` }));
    mocked.loadTrends.mockResolvedValue({ photos, readings: [], spots: [], entries: [] });
    const day = (ago: number) => new Date(2026, 8, 15 - ago).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' });
    await render(<Trends />);

    // Not picking: the first and last photo.
    await fireEvent.press(await screen.findByRole('button', { name: 'Choose 2 dates' }));
    expect(mocked.signedPhotoUrls).toHaveBeenLastCalledWith(['u/p0.jpg', 'u/p3.jpg']);
    expect(screen.getByRole('button', { name: /^Before/ })).toHaveTextContent(/Sep 10/);
    expect(screen.getByRole('button', { name: /^After/ })).toHaveTextContent(/Sep 15/);
    expect(screen.getByRole('button', { name: day(4) })).toBeDisabled(); // no photo that night
    expect(screen.getByRole('button', { name: `${day(0)}, today` })).toBeEnabled();

    await fireEvent.press(screen.getByRole('button', { name: day(3) }));
    await fireEvent.press(screen.getByRole('button', { name: day(2) }));
    expect(screen.getByRole('button', { name: /^Before/ })).toHaveTextContent(/Sep 12/);
    expect(screen.getByRole('button', { name: /^After/ })).toHaveTextContent(/Sep 13/);
    await fireEvent.press(screen.getByRole('button', { name: 'Compare' }));

    expect(screen.queryByRole('button', { name: 'Compare' })).toBeNull();
    expect(mocked.signedPhotoUrls).toHaveBeenLastCalledWith(['u/p1.jpg', 'u/p2.jpg']);
    expect(await screen.findByText('Sep 12')).toBeTruthy();
    expect(screen.getByText('Sep 13')).toBeTruthy();
  });

  it('shows an error with a retry when loading fails', async () => {
    mocked.loadTrends.mockRejectedValueOnce(new Error('offline'));
    await render(<Trends />);
    expect(await screen.findByText(/Couldn't load your data/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByLabelText(/Forehead/)).toBeTruthy();
  });
});

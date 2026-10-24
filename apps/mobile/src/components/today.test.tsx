import { localDay, windowDays } from '@skinsense/domain';
import { fireEvent, render, screen } from '@testing-library/react-native';

import '@/i18n';
import * as routine from '@/lib/routine';
import * as trends from '@/lib/trends';
import { Today } from './today';

// Factories, not automocks: the real modules load the supabase client at import time.
jest.mock('@/lib/trends', () => ({ loadTrends: jest.fn(), signedPhotoUrls: jest.fn() }));
jest.mock('@/lib/routine', () => ({ loadRoutine: jest.fn(), saveEntry: jest.fn() }));
jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

const mockedTrends = trends as jest.Mocked<typeof trends>;
const mockedRoutine = routine as jest.Mocked<typeof routine>;

const DAY = 86_400_000;
const at = (daysAgo: number) => new Date(Date.now() - daysAgo * DAY).toISOString();
const night = (daysAgo: number) => localDay(new Date(Date.now() - daysAgo * DAY));

beforeEach(() => {
  jest.clearAllMocks();
  mockedRoutine.loadRoutine.mockResolvedValue({ items: [{ id: 'i1', label: 'Cleanser', position: 0 }], entry: null });
  mockedTrends.loadTrends.mockResolvedValue({
    photos: [
      { id: 'p1', taken_at: at(2), storage_path: 'u/p1.jpg' },
      { id: 'p2', taken_at: at(1), storage_path: 'u/p2.jpg' },
    ],
    readings: [
      { photo_id: 'p1', zone: 'forehead', redness: 2.4 },
      { photo_id: 'p2', zone: 'forehead', redness: 0.9 },
      { photo_id: 'p1', zone: 'nose', redness: 1.0 },
      { photo_id: 'p2', zone: 'nose', redness: 1.05 },
    ],
    spots: [
      { photo_id: 'p2', zone: 'forehead' },
      { photo_id: 'p2', zone: 'nose' },
      { photo_id: 'p2', zone: 'chin' },
    ],
    entries: [
      { night: night(1), completed_labels: ['Cleanser'], item_count: 1 },
      { night: night(3), completed_labels: ['Cleanser'], item_count: 1 },
    ],
  });
});

describe('Today', () => {
  it("shows tonight's capture state, the last photo, both streaks, zone directions and tonight's routine", async () => {
    await render(<Today />);
    expect(await screen.findByText('No photo tonight yet')).toBeTruthy();
    expect(mockedTrends.loadTrends).toHaveBeenCalledWith(windowDays(90, localDay(new Date()))[0]);
    expect(screen.getByText("Take tonight's photo")).toBeTruthy();
    expect(screen.getByText(/^Last: .+ · 3 spots marked$/)).toBeTruthy();
    expect(screen.getByText('Mark spots →')).toBeTruthy();
    expect(screen.getByText('2 nights')).toBeTruthy(); // captures yesterday and the day before
    expect(screen.getByText('1 night')).toBeTruthy(); // routine ticked yesterday, not two nights ago
    expect(screen.getByText('Redness index, last 7 days')).toBeTruthy();
    expect(screen.getByText('↓ trending down')).toBeTruthy(); // forehead
    expect(screen.getByText('→ steady')).toBeTruthy(); // nose
    expect(await screen.findByText('Edit routine')).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Cleanser' })).toBeTruthy();
  });

  it('switches the call to action once tonight has a photo', async () => {
    mockedTrends.loadTrends.mockResolvedValue({
      photos: [{ id: 'p3', taken_at: new Date().toISOString(), storage_path: 'u/p3.jpg' }],
      readings: [],
      spots: [],
      entries: [],
    });
    await render(<Today />);
    expect(await screen.findByText("Tonight's photo is saved")).toBeTruthy();
    expect(screen.getByText('Take another photo')).toBeTruthy();
    expect(screen.getByText('1 night')).toBeTruthy();
  });

  it('tells a brand-new user there are no photos yet, with streaks at 0 and an unticked routine', async () => {
    mockedTrends.loadTrends.mockResolvedValue({ photos: [], readings: [], spots: [], entries: [] });
    await render(<Today />);
    expect(await screen.findByText('No photos yet. Take your first one to start the diary.')).toBeTruthy();
    expect(screen.getByText("Take tonight's photo")).toBeTruthy();
    expect(screen.queryByText('Mark spots →')).toBeNull();
    expect(screen.getAllByText('0 nights')).toHaveLength(2);
    expect(screen.queryByText('Redness index, last 7 days')).toBeNull();
    expect(await screen.findByRole('checkbox', { name: 'Cleanser' })).not.toBeChecked();
  });

  it('shows the date, title and skeleton blocks while loading', async () => {
    mockedTrends.loadTrends.mockReturnValue(new Promise(() => {}));
    await render(<Today />);
    expect(await screen.findByText('Loading…')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Today' })).toBeTruthy();
    expect(screen.queryByText('Capture streak')).toBeNull();
  });

  it('shows an error with a retry when loading fails', async () => {
    mockedTrends.loadTrends.mockRejectedValueOnce(new Error('offline'));
    await render(<Today />);
    expect(await screen.findByText(/Couldn't load your data/)).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Today' })).toBeTruthy();
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByText('No photo tonight yet')).toBeTruthy();
  });
});

import { fireEvent, render, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import { Text } from 'react-native';

import '@/i18n';
import * as history from '@/lib/history';
import { PhotoHistory } from './photo-history';

// Factory, not automock: the real module loads the supabase client at import time.
jest.mock('@/lib/history', () => ({ loadHistory: jest.fn() }));
jest.mock('expo-image', () => ({ Image: () => null }));

const mocked = history as jest.Mocked<typeof history>;

const year = new Date().getFullYear();
const at = (y: number, month: number, day: number) => new Date(y, month - 1, day, 12).toISOString();
const TILE = /, \d+ spots?$/;

beforeEach(() => {
  jest.clearAllMocks();
  mocked.loadHistory.mockResolvedValue([
    { id: 'p1', taken_at: at(year, 9, 13), spotCount: 3, url: 'https://x/p1', note: null, tags: ['Thiếu ngủ'] },
    { id: 'p2', taken_at: at(year, 9, 12), spotCount: 1, url: 'https://x/p2', note: 'Slept late', tags: [] },
    { id: 'p0', taken_at: at(year - 1, 12, 30), spotCount: 0, url: 'https://x/p0', note: null, tags: ['thiếu ngủ', 'Serum mới'] },
  ]);
});

const tiles = () => screen.getAllByLabelText(TILE).map((tile) => tile.props.accessibilityLabel);

describe('PhotoHistory', () => {
  it('groups Photos by month, newest first, each tile with its date and spot count', async () => {
    await render(<PhotoHistory />);
    expect(screen.getByRole('heading', { name: 'Photo history' })).toBeTruthy();
    expect(await screen.findByRole('heading', { name: 'September' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: `December ${year - 1}` })).toBeTruthy();
    expect(screen.getByText('2 photos')).toBeTruthy();
    expect(screen.getByText('1 photo')).toBeTruthy();
    expect(screen.getAllByLabelText(TILE).map((tile) => tile.props.accessibilityLabel)).toEqual(['Sep 13, 3 spots', 'Sep 12, 1 spot', 'Dec 30, 0 spots']);
  });

  it('opens Photo detail from a tile', async () => {
    const router = renderRouter(
      { history: PhotoHistory, 'photos/[photoId]': () => <Text>Photo screen</Text> },
      { initialUrl: '/history' },
    );
    await router;
    await fireEvent.press(await screen.findByLabelText('Sep 13, 3 spots'));
    expect(await screen.findByText('Photo screen')).toBeTruthy();
    expect(router.getPathname()).toBe('/photos/p1');
  });

  it('filters by one Tag or by having a Note, and back to all', async () => {
    await render(<PhotoHistory />);
    expect(await screen.findByRole('button', { name: 'All', selected: true })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Serum mới' })).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Thiếu ngủ' }));
    expect(screen.getByRole('button', { name: 'Thiếu ngủ', selected: true })).toBeTruthy();
    expect(tiles()).toEqual(['Sep 13, 3 spots', 'Dec 30, 0 spots']);

    await fireEvent.press(screen.getByRole('button', { name: 'Has a note' }));
    expect(tiles()).toEqual(['Sep 12, 1 spot']);
    expect(screen.queryByRole('heading', { name: `December ${year - 1}` })).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'All' }));
    expect(tiles()).toHaveLength(3);
  });

  it('says so when no Photo matches the filter', async () => {
    mocked.loadHistory.mockResolvedValue([{ id: 'p1', taken_at: at(year, 9, 13), spotCount: 3, url: 'https://x/p1', note: null, tags: [] }]);
    await render(<PhotoHistory />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Has a note' }));
    expect(screen.getByText('No photos match this filter.')).toBeTruthy();
    expect(screen.queryAllByLabelText(TILE)).toHaveLength(0);
  });

  it('tells a user without photos to take the first one', async () => {
    mocked.loadHistory.mockResolvedValue([]);
    await render(<PhotoHistory />);
    expect(await screen.findByText('No photos yet. Take your first one to start the diary.')).toBeTruthy();
    expect(screen.getByRole('button', { name: "Take tonight's photo" })).toBeTruthy();
    expect(screen.queryAllByLabelText(TILE)).toHaveLength(0);
  });

  it('shows a spinner while loading', async () => {
    mocked.loadHistory.mockReturnValue(new Promise(() => {}));
    await render(<PhotoHistory />);
    expect(screen.getByLabelText('Loading…')).toBeTruthy();
    expect(screen.queryAllByLabelText(TILE)).toHaveLength(0);
  });

  it('shows an error with a retry when loading fails', async () => {
    mocked.loadHistory.mockRejectedValueOnce(new Error('offline'));
    await render(<PhotoHistory />);
    expect(await screen.findByText(/Couldn't load your data/)).toBeTruthy();
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByLabelText('Sep 13, 3 spots')).toBeTruthy();
  });
});

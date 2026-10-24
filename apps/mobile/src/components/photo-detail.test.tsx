import { PortalHost } from '@rn-primitives/portal';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import { Text } from 'react-native';

import '@/i18n';
import * as history from '@/lib/history';
import { PhotoDetail } from './photo-detail';

// Factory, not automock: the real module loads the supabase client at import time.
jest.mock('@/lib/history', () => ({ loadPhotoDetail: jest.fn(), deletePhoto: jest.fn(), saveNote: jest.fn(), addTag: jest.fn(), removeTag: jest.fn() }));
jest.mock('expo-image', () => ({ Image: () => null }));

const mocked = history as jest.Mocked<typeof history>;

const PHOTO = {
  id: 'p1',
  taken_at: new Date(new Date().getFullYear(), 8, 13, 12, 0).toISOString(),
  storage_path: 'u/p1.jpg',
  spotCount: 3,
  url: 'https://x/p1',
  note: 'Slept late',
  tags: [{ id: 't1', label: 'Thiếu ngủ' }],
  readings: [
    { zone: 'forehead' as const, redness: 1.2 },
    { zone: 'nose' as const, redness: 2.14 },
    { zone: 'chin' as const, redness: 0.4 },
  ],
};

const Screen = () => (
  <>
    <PhotoDetail photoId="p1" />
    <PortalHost />
  </>
);

// With a router: the screens Photo detail navigates to. Not async: returning the thenable result
// from an async function would resolve it to the render result and lose getPathname.
function renderInRouter() {
  return renderRouter(
    { 'photos/[photoId]': Screen, history: () => <Text>History screen</Text>, 'spots/[photoId]': () => <Text>Spots screen</Text> },
    { initialUrl: '/photos/p1' },
  );
}

async function openDialog() {
  await fireEvent.press(await screen.findByText('Delete photo'));
  await screen.findByText('Delete this photo?');
}

beforeEach(() => {
  jest.clearAllMocks();
  mocked.loadPhotoDetail.mockResolvedValue(PHOTO);
});

describe('PhotoDetail', () => {
  it("shows the photo's date and time, spot count and the reddest zone's reading", async () => {
    await render(<Screen />);
    expect(await screen.findByRole('heading', { name: /^Sep 13, / })).toBeTruthy();
    expect(mocked.loadPhotoDetail).toHaveBeenCalledWith('p1');
    expect(screen.getByText('3 spots')).toBeTruthy();
    expect(screen.getByText('Nose · redness')).toBeTruthy();
    expect(screen.getByText('2.1')).toBeTruthy();
  });

  it('opens spot marking for this photo', async () => {
    const router = renderInRouter();
    await router; // RNTL 14 renders asynchronously
    await fireEvent.press(await screen.findByText('Mark spots'));
    expect(await screen.findByText('Spots screen')).toBeTruthy();
    expect(router.getPathname()).toBe('/spots/p1');
  });

  it('asks before deleting, listing what goes with the photo, and cancel closes without deleting', async () => {
    await render(<Screen />);
    await openDialog();
    expect(screen.getByText('Deletes the photo, spots, readings, note and tags from the night of Sep 13. This cannot be undone.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Cancel'));
    await waitFor(() => expect(screen.queryByText('Delete this photo?')).toBeNull());
    expect(mocked.deletePhoto).not.toHaveBeenCalled();
  });

  it('shows progress with cancel disabled while deleting, then returns to the history', async () => {
    let finish!: () => void;
    mocked.deletePhoto.mockReturnValue(new Promise((resolve) => (finish = () => resolve())));
    const router = renderInRouter();
    await router; // RNTL 14 renders asynchronously
    await openDialog();
    await fireEvent.press(screen.getAllByText('Delete photo')[1]);
    expect(await screen.findByText('Deleting…')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(mocked.deletePhoto).toHaveBeenCalledWith(PHOTO);
    finish();
    expect(await screen.findByText('History screen')).toBeTruthy();
    expect(router.getPathname()).toBe('/history');
  });

  it('keeps the dialog open with the error when deletion fails', async () => {
    mocked.deletePhoto.mockRejectedValue(new Error('boom'));
    await render(<Screen />);
    await openDialog();
    await fireEvent.press(screen.getAllByText('Delete photo')[1]);
    expect(await screen.findByRole('alert')).toHaveTextContent('Deletion failed. The photo is still here; try again later.');
    expect(screen.getByText('Delete this photo?')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).not.toBeDisabled();
  });

  it('saves an edited Note when the field loses focus, and says so', async () => {
    mocked.saveNote.mockResolvedValue();
    await render(<Screen />);
    const note = await screen.findByLabelText('Note');
    expect(note.props.value).toBe('Slept late');
    await fireEvent(note, 'blur');
    expect(mocked.saveNote).not.toHaveBeenCalled(); // unchanged
    await fireEvent.changeText(note, 'Slept late, new serum');
    await fireEvent(note, 'blur');
    expect(mocked.saveNote).toHaveBeenCalledWith('p1', 'Slept late, new serum');
    expect(await screen.findByText('Saved')).toBeTruthy();
  });

  it('shows an inline error and does not save a Note over 500 characters', async () => {
    await render(<Screen />);
    const note = await screen.findByLabelText('Note');
    await fireEvent.changeText(note, 'a'.repeat(501));
    await fireEvent(note, 'blur');
    expect(screen.getByRole('alert')).toHaveTextContent('Keep the note to 500 characters.');
    expect(mocked.saveNote).not.toHaveBeenCalled();
  });

  it('shows an error when the Note fails to save', async () => {
    mocked.saveNote.mockRejectedValue(new Error('offline'));
    await render(<Screen />);
    const note = await screen.findByLabelText('Note');
    await fireEvent.changeText(note, '');
    await fireEvent(note, 'blur');
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't save the note. Try again later.");
  });

  it('adds a Tag from the keyboard and removes one from its 44px target', async () => {
    mocked.addTag.mockResolvedValue({ id: 't2', label: 'Serum mới' });
    mocked.removeTag.mockResolvedValue();
    await render(<Screen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Add tag' }));
    const input = screen.getByLabelText('New tag');
    await fireEvent.changeText(input, ' Serum mới ');
    await fireEvent(input, 'submitEditing');
    expect(mocked.addTag).toHaveBeenCalledWith('p1', ' Serum mới ');
    expect(await screen.findByRole('button', { name: 'Remove tag Serum mới' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add tag' })).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Remove tag Thiếu ngủ' }));
    expect(mocked.removeTag).toHaveBeenCalledWith('t1');
    await waitFor(() => expect(screen.queryByText('Thiếu ngủ')).toBeNull());
  });

  it.each([
    ['   ', 'Type a tag name.'],
    ['a'.repeat(25), 'Keep tags to 24 characters.'],
    ['thiếu NGỦ', 'This photo already has that tag.'],
  ])('rejects the Tag %j inline without saving', async (label, message) => {
    await render(<Screen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Add tag' }));
    const input = screen.getByLabelText('New tag');
    await fireEvent.changeText(input, label);
    await fireEvent(input, 'submitEditing');
    expect(screen.getByRole('alert')).toHaveTextContent(message);
    expect(mocked.addTag).not.toHaveBeenCalled();
  });

  it('shows an error when a Tag fails to save', async () => {
    mocked.addTag.mockRejectedValue(new Error('offline'));
    await render(<Screen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Add tag' }));
    const input = screen.getByLabelText('New tag');
    await fireEvent.changeText(input, 'Serum mới');
    await fireEvent(input, 'submitEditing');
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't save the tags. Try again later.");
    expect(screen.getByLabelText('New tag').props.value).toBe('Serum mới');
  });

  it('shows an error with a retry when the photo fails to load', async () => {
    mocked.loadPhotoDetail.mockRejectedValueOnce(new Error('offline'));
    await render(<Screen />);
    expect(await screen.findByText(/Couldn't load your data/)).toBeTruthy();
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByText('Nose · redness')).toBeTruthy();
  });
});

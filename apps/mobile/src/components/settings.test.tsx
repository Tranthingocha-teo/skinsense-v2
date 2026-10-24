import AsyncStorage from '@react-native-async-storage/async-storage';
import { PortalHost } from '@rn-primitives/portal';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import { Text } from 'react-native';

import i18n from '@/i18n';
import { supabase } from '@/lib/supabase';
import { Settings } from './settings';

jest.mock('@/lib/auth', () => ({
  useSession: () => ({ user: { email: 'e2e@skinsense.test', user_metadata: { full_name: 'Test User' } } }),
}));
jest.mock('@/lib/supabase', () => ({ supabase: { auth: { signOut: jest.fn() }, functions: { invoke: jest.fn() } } }));
const mocked = supabase as unknown as { auth: { signOut: jest.Mock }; functions: { invoke: jest.Mock } };

beforeEach(() => jest.clearAllMocks());
afterEach(() => i18n.changeLanguage('en'));

async function renderSettings() {
  await render(
    <>
      <Settings />
      <PortalHost />
    </>,
  );
}

async function openDialog() {
  await fireEvent.press(screen.getByText('Delete account'));
  await screen.findByText('Delete account?');
  await fireEvent.press(screen.getAllByText('Delete account')[1]);
}

describe('Settings', () => {
  it('shows the Google name and email, the language, privacy, sign out and delete rows, and remembers the chosen language', async () => {
    await renderSettings();
    expect(screen.getByText('Test User')).toBeTruthy();
    expect(screen.getByText('e2e@skinsense.test')).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'English' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Feedback' })).toBeTruthy();
    expect(screen.getByText('Privacy policy')).toBeTruthy();
    expect(screen.getByText('Biometric lock')).toBeTruthy();
    expect(screen.getByText('Export data (.zip)')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy();
    expect(screen.getByText('Delete account')).toBeTruthy();

    await fireEvent.press(screen.getByRole('radio', { name: 'Tiếng Việt' }));
    expect(await screen.findByText('Cài đặt')).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Tiếng Việt' })).toBeChecked();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('language', 'vi');
  });

  it('opens the photo history from the Data group', async () => {
    const router = renderRouter(
      {
        index: () => (
          <>
            <Settings />
            <PortalHost />
          </>
        ),
        history: () => <Text>History screen</Text>,
      },
      { initialUrl: '/' },
    );
    await router; // RNTL 14 renders asynchronously
    expect(screen.getByText('Data')).toBeTruthy();
    await fireEvent.press(screen.getByText('Photo history'));
    expect(await screen.findByText('History screen')).toBeTruthy();
    expect(router.getPathname()).toBe('/history');
  });

  it('shows the saved reminder in its group and opens the reminder screen', async () => {
    await AsyncStorage.setItem('reminder', JSON.stringify({ on: true, hour: 21, minute: 30, days: [1, 3] }));
    const router = renderRouter(
      {
        index: () => <Settings />,
        reminder: () => <Text>Reminder screen</Text>,
      },
      { initialUrl: '/' },
    );
    await router;
    expect(screen.getByText('Reminders & security')).toBeTruthy();
    expect(await screen.findByText('21:30 · Mon, Wed')).toBeTruthy();
    await fireEvent.press(screen.getByText('Evening routine reminder'));
    expect(await screen.findByText('Reminder screen')).toBeTruthy();
    expect(router.getPathname()).toBe('/reminder');
  });

  it('signs out', async () => {
    await renderSettings();
    await fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));
    expect(mocked.auth.signOut).toHaveBeenCalled();
  });

  it('asks before deleting and cancel closes without deleting', async () => {
    await renderSettings();
    await fireEvent.press(screen.getByText('Delete account'));
    expect(await screen.findByText('Delete account?')).toBeTruthy();
    expect(screen.getByText('Permanently deletes every photo, spot, reading and routine. This cannot be undone.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Cancel'));
    await waitFor(() => expect(screen.queryByText('Delete account?')).toBeNull());
    expect(mocked.functions.invoke).not.toHaveBeenCalled();
  });

  it('shows progress with cancel disabled while deleting, then clears the local session', async () => {
    let finish!: (result: { error: null }) => void;
    mocked.functions.invoke.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    await renderSettings();
    await openDialog();
    expect(await screen.findByText('Deleting…')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDisabled();
    finish({ error: null });
    await waitFor(() => expect(mocked.auth.signOut).toHaveBeenCalledWith({ scope: 'local' }));
  });

  it('keeps the dialog open with the error when deletion fails', async () => {
    mocked.functions.invoke.mockResolvedValue({ error: new Error('boom') });
    await renderSettings();
    await openDialog();
    expect(await screen.findByRole('alert')).toHaveTextContent('Deletion failed. Try again later. Your account has not been deleted.');
    expect(screen.getByText('Delete account?')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).not.toBeDisabled();
    expect(mocked.auth.signOut).not.toHaveBeenCalled();
  });
});

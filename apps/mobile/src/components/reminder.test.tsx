import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';

import '@/i18n';
import { Reminder } from './reminder';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
// The native time dialog stands in as a button that picks 07:05.
jest.mock('@expo/ui/community/datetime-picker', () => {
  const { createElement } = jest.requireActual('react');
  const { Pressable, Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ onValueChange }: { onValueChange: (e: object, d: Date) => void }) =>
      createElement(Pressable, { onPress: () => onValueChange({}, new Date(2026, 8, 15, 7, 5)) }, createElement(Text, null, 'Pick 07:05')),
  };
});
const mocked = Notifications as jest.Mocked<typeof Notifications>;
const permission = (status: string) => ({ status }) as unknown as Notifications.NotificationPermissionsStatus;
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];
const scheduled = () => mocked.scheduleNotificationAsync.mock.calls.map(([request]) => request.trigger);
const toggle = () => screen.getByRole('switch', { name: 'Remind every night' });

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  mocked.getPermissionsAsync.mockResolvedValue(permission('undetermined'));
  mocked.requestPermissionsAsync.mockResolvedValue(permission('granted'));
});

describe('Reminder', () => {
  it('turning on asks for notifications and schedules every night at 21:30 with the preview; turning off cancels', async () => {
    await render(<Reminder />);
    expect(screen.getByRole('heading', { name: 'Routine reminder' })).toBeTruthy();
    expect(toggle()).not.toBeChecked();
    expect(screen.getByText("Tonight's routine")).toBeTruthy();
    expect(screen.getByText('Take a photo and tick your routine before bed.')).toBeTruthy();
    expect(screen.getAllByText('21:30')).toHaveLength(2); // time card + preview

    await fireEvent.press(toggle());
    await waitFor(() => expect(mocked.scheduleNotificationAsync).toHaveBeenCalledTimes(7));
    expect(mocked.requestPermissionsAsync).toHaveBeenCalled();
    expect(scheduled().map((trigger) => (trigger as { weekday: number }).weekday).sort()).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(scheduled()[0]).toMatchObject({ type: 'weekly', hour: 21, minute: 30 });
    expect(toggle()).toBeChecked();
    expect(JSON.parse((await AsyncStorage.getItem('reminder'))!)).toMatchObject({ on: true, hour: 21, minute: 30 });

    jest.clearAllMocks();
    await fireEvent.press(toggle());
    await waitFor(() => expect(mocked.cancelAllScheduledNotificationsAsync).toHaveBeenCalled());
    expect(mocked.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(toggle()).not.toBeChecked();
  });

  it('changing the time or the days reschedules', async () => {
    await AsyncStorage.setItem('reminder', JSON.stringify({ on: true, hour: 22, minute: 0, days: EVERY_DAY }));
    mocked.getPermissionsAsync.mockResolvedValue(permission('granted'));
    await render(<Reminder />);
    await screen.findAllByText('22:00');

    await fireEvent.press(screen.getByText('Tap to change the time'));
    await fireEvent.press(screen.getByText('Pick 07:05'));
    await waitFor(() => expect(mocked.scheduleNotificationAsync).toHaveBeenCalledTimes(7));
    expect(mocked.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    expect(scheduled()[0]).toMatchObject({ hour: 7, minute: 5 });
    expect(screen.getAllByText('07:05')).toHaveLength(2);

    jest.clearAllMocks();
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Sun' }));
    await waitFor(() => expect(mocked.scheduleNotificationAsync).toHaveBeenCalledTimes(6));
    expect(scheduled().map((trigger) => (trigger as { weekday: number }).weekday)).not.toContain(1);
    expect(screen.getByRole('checkbox', { name: 'Sun' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Mon' })).toBeChecked();
  });

  it('denied: says so, greys out the time and days, and opens the notification settings', async () => {
    await AsyncStorage.setItem('reminder', JSON.stringify({ on: true, hour: 21, minute: 30, days: EVERY_DAY }));
    mocked.getPermissionsAsync.mockResolvedValue(permission('denied'));
    const sendIntent = jest.spyOn(Linking, 'sendIntent').mockResolvedValue();
    await render(<Reminder />);

    expect(await screen.findByText('Notifications are off for SkinSense')).toBeTruthy();
    expect(screen.getByText('Turn them back on in Android settings to get reminded at 21:30.')).toBeTruthy();
    expect(toggle()).not.toBeChecked();
    expect(screen.getByRole('button', { name: /Tap to change the time/ })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'Mon' })).toBeDisabled();

    await fireEvent.press(screen.getByRole('button', { name: 'Open notification settings' }));
    expect(sendIntent).toHaveBeenCalledWith('android.settings.APP_NOTIFICATION_SETTINGS', expect.any(Array));
  });
});

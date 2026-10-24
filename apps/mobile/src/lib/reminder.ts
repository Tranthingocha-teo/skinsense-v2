import AsyncStorage from '@react-native-async-storage/async-storage';
import { nextReminderTriggers } from '@skinsense/domain';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';

// Reminder (CONTEXT.md): kept on the device only, in AsyncStorage (spec: no table), and
// delivered as local notifications. Weekdays use Date.getDay (0 = Sunday).
export type ReminderSettings = { on: boolean; hour: number; minute: number; days: number[] };

const KEY = 'reminder';
const CHANNEL = 'reminder';
const DEFAULT: ReminderSettings = { on: false, hour: 21, minute: 30, days: [0, 1, 2, 3, 4, 5, 6] };
// Canvas order T2 … CN.
export const WEEK = [1, 2, 3, 4, 5, 6, 0];
const listeners = new Set<(r: ReminderSettings) => void>();

export const formatTime = ({ hour, minute }: { hour: number; minute: number }) =>
  `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

// The saved reminder (the default until one is saved), kept in sync across mounted screens.
export function useReminder() {
  const [reminder, setReminder] = useState(DEFAULT);
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((saved) => saved && setReminder(JSON.parse(saved)), () => {});
    listeners.add(setReminder);
    return () => void listeners.delete(setReminder);
  }, []);
  return reminder;
}

// 'granted' | 'denied' | 'undetermined'
export async function notificationPermission() {
  return (await Notifications.getPermissionsAsync()).status;
}

// Expo docs: on Android 13 the POST_NOTIFICATIONS prompt appears only once a channel exists.
export async function requestNotificationPermission(channelName: string) {
  await Notifications.setNotificationChannelAsync(CHANNEL, { name: channelName, importance: Notifications.AndroidImportance.DEFAULT });
  return (await Notifications.requestPermissionsAsync()).status;
}

// Saves, then replaces every scheduled notification (the reminder is the app's only one) with a
// weekly trigger per chosen weekday, taken from that weekday's next instant.
export async function saveReminder(reminder: ReminderSettings, content: { title: string; body: string }) {
  listeners.forEach((listener) => listener(reminder));
  await AsyncStorage.setItem(KEY, JSON.stringify(reminder));
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!reminder.on) return;
  for (const next of nextReminderTriggers(reminder, new Set(reminder.days), new Date())) {
    await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        channelId: CHANNEL,
        weekday: next.getDay() + 1, // expo: 1 = Sunday
        hour: next.getHours(),
        minute: next.getMinutes(),
      },
    });
  }
}

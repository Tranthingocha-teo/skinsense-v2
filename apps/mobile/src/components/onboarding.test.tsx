import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { Text } from 'react-native';

// Lives outside src/app: expo-router's require.context would bundle a test there as a route.
import '@/i18n';
import AppLayout from '@/app/(app)/_layout';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-quick-actions', () => ({ setItems: jest.fn(() => Promise.resolve()) }));
jest.mock('expo-quick-actions/router', () => ({ useQuickActionRouting: jest.fn() }));
const mockRequestPermission = jest.fn();
jest.mock('react-native-vision-camera', () => {
  const { useState } = jest.requireActual('react');
  return {
    useCameraPermission: () => {
      const [hasPermission, setHasPermission] = useState(false);
      const requestPermission = async () => {
        mockRequestPermission();
        setHasPermission(true);
        return true;
      };
      return { hasPermission, requestPermission };
    },
  };
});

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

async function renderApp() {
  const router = renderRouter({ _layout: AppLayout, index: () => <Text>Today screen</Text> }, { initialUrl: '/' });
  await router; // RNTL 14 renders asynchronously
}

const heading = (name: string) => screen.findByRole('heading', { name });

describe('Onboarding', () => {
  it('walks three steps, asks for the camera on the last one, then opens the app and remembers it', async () => {
    await renderApp();
    expect(await heading('A skin diary, one photo a night.')).toBeTruthy();
    expect(screen.queryByText('Today screen')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(await heading('Same place, same light.')).toBeTruthy();
    expect(screen.getByText('Good light')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(await heading('Private, and not a diagnosis.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull();
    expect(screen.getByText('Evening routine reminder · optional')).toBeTruthy();
    await fireEvent.press(screen.getAllByRole('button', { name: 'Allow' })[0]);
    expect(mockRequestPermission).toHaveBeenCalled();
    expect(await screen.findByText('Allowed')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Allow' }));
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    expect(await screen.findAllByText('Allowed')).toHaveLength(2);

    await fireEvent.press(screen.getByRole('button', { name: 'Get started' }));
    expect(await screen.findByText('Today screen')).toBeTruthy();
    expect(await AsyncStorage.getItem('onboarded')).not.toBeNull();
  });

  it('Skip ends onboarding and sets the flag', async () => {
    await renderApp();
    await heading('A skin diary, one photo a night.');
    await fireEvent.press(screen.getByRole('button', { name: 'Skip' }));
    expect(await screen.findByText('Today screen')).toBeTruthy();
    expect(await AsyncStorage.getItem('onboarded')).not.toBeNull();
  });

  it('goes straight to the app once the flag is set', async () => {
    await AsyncStorage.setItem('onboarded', '1');
    await renderApp();
    expect(await screen.findByText('Today screen')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'A skin diary, one photo a night.' })).toBeNull();
  });
});

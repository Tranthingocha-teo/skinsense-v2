import { fireEvent, render, screen } from '@testing-library/react-native';
import { openBrowserAsync } from 'expo-web-browser';

import '@/i18n';
import { About } from './about';

jest.mock('expo-constants', () => ({ expoConfig: { version: '1.0.0' } }));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn(), WebBrowserPresentationStyle: {} }));

describe('About', () => {
  it('shows the version from the app config', async () => {
    await render(<About />);
    expect(screen.getByRole('heading', { name: 'About' })).toBeTruthy();
    expect(screen.getByText('Version 1.0.0')).toBeTruthy();
  });

  it.each([
    ['Privacy policy', 'https://skinsense-v2.vercel.app/privacy'],
    ['Source code on GitHub', 'https://github.com/Tranthingocha-teo/skinsense-v2'],
  ])('%s opens in the browser', async (label, url) => {
    await render(<About />);
    await fireEvent.press(screen.getByText(label));
    expect(openBrowserAsync).toHaveBeenCalledWith(url, expect.anything());
  });

  it('shows the highlighted licenses, then every license on Show all', async () => {
    await render(<About />);
    expect(screen.getByText('MediaPipe (mô hình .tflite)')).toBeTruthy();
    expect(screen.getByText('Noto Serif Display, Manrope')).toBeTruthy();
    expect(screen.queryByText('react-native-vision-camera')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Show all' }));
    expect(screen.getByText('react-native-vision-camera')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Show all' })).toBeNull();
  });
});

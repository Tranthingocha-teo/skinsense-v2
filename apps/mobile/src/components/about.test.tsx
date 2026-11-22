import { fireEvent, render, screen } from '@testing-library/react-native';

import '@/i18n';
import { About } from './about';

jest.mock('expo-constants', () => ({ expoConfig: { version: '1.0.0' } }));

describe('About', () => {
  it('shows the version from the app config', async () => {
    await render(<About />);
    expect(screen.getByRole('heading', { name: 'About' })).toBeTruthy();
    expect(screen.getByText('Version 1.0.0')).toBeTruthy();
  });

  it.each(['Privacy policy', 'Source code on GitHub'])('%s opens natively in-app without launching a web browser', async (label) => {
    await render(<About />);
    await fireEvent.press(screen.getByText(label));
    expect(await screen.findByText('Đóng')).toBeTruthy();
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

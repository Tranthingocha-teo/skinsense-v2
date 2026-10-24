import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import '@/i18n';
import * as feedback from '@/lib/feedback';
import { Feedback } from './feedback';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
// Factory, not automock: the real module loads expo-constants/expo-device and the Supabase client.
jest.mock('@/lib/feedback', () => ({ sendFeedback: jest.fn(), deviceInfo: jest.fn() }));
const mocked = feedback as jest.Mocked<typeof feedback>;

beforeEach(() => {
  jest.clearAllMocks();
  mocked.deviceInfo.mockReturnValue({ appVersion: '1.0.0', deviceNote: 'Google Pixel 9, Android 16' });
});

const message = () => screen.getByLabelText('Message');
const send = () => screen.getByRole('button', { name: 'Send feedback' });

describe('Feedback', () => {
  it('shows the kinds, the message field, the opt-in note and the no-photos statement; send waits for a message', async () => {
    await render(<Feedback />);
    expect(screen.getByRole('heading', { name: 'Feedback' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Bug report' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Idea' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Attach app version and phone model' })).not.toBeChecked();
    expect(screen.getByText('Your photos and skin data are never attached.')).toBeTruthy();
    expect(send()).toBeDisabled();
    await fireEvent.changeText(message(), '   ');
    expect(send()).toBeDisabled();
  });

  it('refuses a message over 2000 characters', async () => {
    await render(<Feedback />);
    await fireEvent.changeText(message(), 'a'.repeat(2001));
    expect(screen.getByText('Keep it to 2000 characters.')).toBeTruthy();
    expect(send()).toBeDisabled();
  });

  it('sends the trimmed message without device info when not opted in, then shows the confirmation', async () => {
    mocked.sendFeedback.mockResolvedValue();
    await render(<Feedback />);
    await fireEvent.press(screen.getByRole('radio', { name: 'Idea' }));
    await fireEvent.changeText(message(), '  A weekly summary  ');
    await fireEvent.press(send());
    expect(await screen.findByText('Feedback sent')).toBeTruthy();
    expect(screen.getByText('Thank you. Your feedback holds only what you wrote and the device details you chose.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Done' })).toBeTruthy();
    expect(mocked.sendFeedback).toHaveBeenCalledWith({ kind: 'idea', message: 'A weekly summary', appVersion: null, deviceNote: null });
  });

  it('attaches the app version and phone model only when opted in', async () => {
    mocked.sendFeedback.mockResolvedValue();
    await render(<Feedback />);
    await fireEvent.changeText(message(), 'Chart is blank');
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Attach app version and phone model' }));
    expect(screen.getByRole('checkbox', { name: 'Attach app version and phone model' })).toBeChecked();
    await fireEvent.press(send());
    await waitFor(() => expect(screen.getByText('Feedback sent')).toBeTruthy());
    expect(mocked.sendFeedback).toHaveBeenCalledWith({ kind: 'bug', message: 'Chart is blank', appVersion: '1.0.0', deviceNote: 'Google Pixel 9, Android 16' });
  });

  it('shows the error inline and keeps the message when sending fails', async () => {
    mocked.sendFeedback.mockRejectedValue(new Error('boom'));
    await render(<Feedback />);
    await fireEvent.changeText(message(), 'Chart is blank');
    await fireEvent.press(send());
    expect(await screen.findByRole('alert')).toHaveTextContent('Sending failed. Please try again.');
    expect(message()).toHaveDisplayValue('Chart is blank');
    expect(send()).not.toBeDisabled();
    expect(screen.queryByText('Feedback sent')).toBeNull();
  });
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import {
  authenticateWithBiometrics,
  BIOMETRIC_STORAGE_KEY,
  getBiometricEnabled,
  isBiometricsAvailable,
  setBiometricEnabled,
} from './biometrics';

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  authenticateAsync: jest.fn(),
}));

describe('biometrics', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('checks hardware and enrollment availability', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);

    const res = await isBiometricsAvailable();
    expect(res).toEqual({ hasHardware: true, isEnrolled: true });
  });

  it('reads and writes biometric enabled state to AsyncStorage', async () => {
    expect(await getBiometricEnabled()).toBe(false);

    await setBiometricEnabled(true);
    expect(await AsyncStorage.getItem(BIOMETRIC_STORAGE_KEY)).toBe('true');
    expect(await getBiometricEnabled()).toBe(true);

    await setBiometricEnabled(false);
    expect(await getBiometricEnabled()).toBe(false);
  });

  it('authenticates with biometrics successfully', async () => {
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true });

    const ok = await authenticateWithBiometrics();
    expect(ok).toBe(true);
    expect(LocalAuthentication.authenticateAsync).toHaveBeenCalled();
  });

  it('returns false when authentication fails', async () => {
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: false });

    const ok = await authenticateWithBiometrics();
    expect(ok).toBe(false);
  });
});

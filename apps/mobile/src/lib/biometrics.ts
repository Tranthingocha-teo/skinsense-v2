import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect, useState } from 'react';

export const BIOMETRIC_STORAGE_KEY = 'skinsense_biometric_enabled';

export async function isBiometricsAvailable(): Promise<{ hasHardware: boolean; isEnrolled: boolean }> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return { hasHardware, isEnrolled };
  } catch {
    return { hasHardware: false, isEnrolled: false };
  }
}

export async function getBiometricEnabled(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(BIOMETRIC_STORAGE_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(BIOMETRIC_STORAGE_KEY, enabled ? 'true' : 'false');
}

export async function authenticateWithBiometrics(promptMessage = 'SkinSense biometric lock'): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use passcode',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}

export function useBiometricsSetting() {
  const [enabled, setEnabledState] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBiometricEnabled().then((val) => {
      setEnabledState(val);
      setLoading(false);
    });
  }, []);

  async function toggle(next: boolean) {
    if (next) {
      const { hasHardware, isEnrolled } = await isBiometricsAvailable();
      if (!hasHardware || !isEnrolled) {
        throw new Error('NOT_ENROLLED');
      }
      const success = await authenticateWithBiometrics('Xác thực vân tay/khuôn mặt để bật khóa');
      if (!success) return false;
    }
    await setBiometricEnabled(next);
    setEnabledState(next);
    return true;
  }

  return { enabled, loading, toggle };
}

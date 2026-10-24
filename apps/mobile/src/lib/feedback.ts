import type { FeedbackKind } from '@skinsense/domain';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

import { supabase } from './supabase';

// Same contract as apps/web/src/lib/feedback.ts; only the client and the device note differ.
export type FeedbackInput = { kind: FeedbackKind; message: string; appVersion: string | null; deviceNote: string | null };

export async function sendFeedback({ kind, message, appVersion, deviceNote }: FeedbackInput) {
  const { error } = await supabase
    .from('feedback')
    .insert({ kind, message, platform: 'android', app_version: appVersion, device_note: deviceNote });
  if (error) throw new Error(error.message);
}

export function deviceInfo() {
  return {
    appVersion: Constants.expoConfig?.version ?? null,
    deviceNote: `${Device.manufacturer} ${Device.modelName}, Android ${Device.osVersion}`,
  };
}

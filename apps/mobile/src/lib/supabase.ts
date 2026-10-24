import 'react-native-url-polyfill/auto';

import { createClient, processLock } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { supabaseEnv } from './env';
import { LargeSecureStore } from './large-secure-store';

const { url, anonKey } = supabaseEnv();

export const supabase = createClient(
  url,
  anonKey,
  {
    auth: {
      storage: new LargeSecureStore(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  },
);

// Refresh only while the app is in the foreground.
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});

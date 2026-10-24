import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

import { supabase } from './supabase';

// idToken from @react-native-google-signin (sign-in.tsx); nonce-less on native.
export function signInWithGoogleIdToken(idToken: string) {
  return supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
}

// undefined = still restoring from storage; null = signed out.
export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);
  return session;
}

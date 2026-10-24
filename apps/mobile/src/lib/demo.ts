import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEMO_PERSONA, generateDemo, localDay } from '@skinsense/domain';
import { useEffect, useState } from 'react';

const DEMO_ACTIVE_KEY = 'skinsense_demo_active';
const DEMO_STORED_KEY = 'skinsense_demo_data';

export type StoredDemoData = {
  items?: any[];
  entries: Record<string, any>;
  spots?: Record<string, any[]>;
  deleted?: string[];
  notes?: Record<string, string | null>;
  tags?: Record<string, any[]>;
};

let inMemoryDemoActive = false;
const listeners = new Set<(active: boolean) => void>();

function notify(active: boolean) {
  inMemoryDemoActive = active;
  listeners.forEach((l) => l(active));
}

export function useDemoActive() {
  const [active, setActive] = useState(inMemoryDemoActive);

  useEffect(() => {
    AsyncStorage.getItem(DEMO_ACTIVE_KEY).then((val) => {
      const isAct = val === 'true';
      inMemoryDemoActive = isAct;
      setActive(isAct);
    });
    const listener = (next: boolean) => setActive(next);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return active;
}

export async function setDemoActive(active: boolean): Promise<void> {
  await AsyncStorage.setItem(DEMO_ACTIVE_KEY, active ? 'true' : 'false');
  notify(active);
}

export async function resetDemoData(): Promise<void> {
  await AsyncStorage.multiRemove([
    DEMO_STORED_KEY,
    'skinsense_demo_photos',
    'skinsense_demo_readings',
    'skinsense_demo_spots',
  ]);
}

export function getMobileDemoData() {
  return generateDemo(DEMO_PERSONA, 90, localDay(new Date()), [
    'Tẩy trang',
    'Rửa mặt',
    'Serum trị mụn',
    'Kem dưỡng ẩm',
  ]);
}

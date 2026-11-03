import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMobileDemoData } from './demo';
import { supabase } from './supabase';

// Same contract as apps/web/src/lib/routine.ts; only the client differs.
export type RoutineItem = { id: string; label: string; position: number };
export type RoutineEntry = { night: string; completed_labels: string[]; item_count: number };

const ITEM_COLUMNS = 'id,label,position';

export function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function loadRoutine(night: string, defaults: string[]) {
  const isDemo = (await AsyncStorage.getItem('skinsense_demo_active')) === 'true';
  if (isDemo) {
    const demo = getMobileDemoData();
    const entry = demo.entries.find((e) => e.night === night) || null;
    return { items: demo.routineItems, entry };
  }

  try {
    const [items, entry, entryCount] = await Promise.all([
      supabase.from('routine_items').select(ITEM_COLUMNS).order('position'),
      supabase.from('routine_entries').select('night,completed_labels,item_count').eq('night', night).maybeSingle(),
      supabase.from('routine_entries').select('id', { count: 'exact', head: true }),
    ]);
    fail(items.error);
    fail(entry.error);
    fail(entryCount.error);
    let list = items.data as RoutineItem[];
    // ponytail: "no items and no entries" = new user (see the web copy for the
    // delete-everything corner). unique (user_id, label) dedupes concurrent seeds.
    if (list.length === 0 && entryCount.count === 0) {
      const seeded = await supabase
        .from('routine_items')
        .upsert(defaults.map((label, position) => ({ label, position })), {
          onConflict: 'user_id,label',
          ignoreDuplicates: true,
        });
      fail(seeded.error);
      const reread = await supabase.from('routine_items').select(ITEM_COLUMNS).order('position');
      fail(reread.error);
      list = reread.data as RoutineItem[];
    }
    return { items: list, entry: entry.data as RoutineEntry | null };
  } catch {
    // Graceful offline fallback: when supabase has no network or session, load demo routine
    const demo = getMobileDemoData();
    const entry = demo.entries.find((e) => e.night === night) || null;
    const defaultItems: RoutineItem[] = defaults.map((label, position) => ({
      id: `def-${position}`,
      label,
      position,
    }));
    return { items: demo.routineItems.length > 0 ? demo.routineItems : defaultItems, entry };
  }
}

export async function addItem(label: string, position: number): Promise<RoutineItem> {
  try {
    const { data, error } = await supabase
      .from('routine_items')
      .insert({ label, position })
      .select(ITEM_COLUMNS)
      .single();
    fail(error);
    return data as RoutineItem;
  } catch {
    return { id: `local-${Date.now()}`, label, position };
  }
}

export async function renameItem(id: string, label: string) {
  try {
    fail((await supabase.from('routine_items').update({ label }).eq('id', id)).error);
  } catch {}
}

export async function deleteItem(id: string) {
  try {
    fail((await supabase.from('routine_items').delete().eq('id', id)).error);
  } catch {}
}

export async function swapPositions(a: RoutineItem, b: RoutineItem) {
  try {
    fail((await supabase.from('routine_items').update({ position: b.position }).eq('id', a.id)).error);
    fail((await supabase.from('routine_items').update({ position: a.position }).eq('id', b.id)).error);
  } catch {}
}

// One row per (user, night); labels are a snapshot at tick time (ADR 0004).
export async function saveEntry(night: string, completedLabels: string[], itemCount: number) {
  const isDemo = (await AsyncStorage.getItem('skinsense_demo_active')) === 'true';
  if (isDemo) return;
  try {
    const { error } = await supabase
      .from('routine_entries')
      .upsert({ night, completed_labels: completedLabels, item_count: itemCount }, { onConflict: 'user_id,night' });
    fail(error);
  } catch {}
}

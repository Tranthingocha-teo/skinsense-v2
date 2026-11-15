import { createClient } from "@/lib/supabase/client";

export type RoutineItem = { id: string; label: string; position: number };
export type RoutineEntry = { night: string; completed_labels: string[]; item_count: number };

const ITEM_COLUMNS = "id,label,position";

export function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function loadRoutine(night: string, _defaults?: string[]) {
  const supabase = createClient();
  const [items, entry] = await Promise.all([
    supabase.from("routine_items").select(ITEM_COLUMNS).order("position"),
    supabase.from("routine_entries").select("night,completed_labels,item_count").eq("night", night).maybeSingle(),
  ]);
  fail(items.error);
  fail(entry.error);
  // Strict Multi-tenancy: của ai hiển thị cái đó, chứ không tự chèn mẫu. Nếu chưa có thì để trống.
  const list = (items.data || []) as RoutineItem[];
  return { items: list, entry: entry.data as RoutineEntry | null };
}

export async function addItem(label: string, position: number): Promise<RoutineItem> {
  const { data, error } = await createClient()
    .from("routine_items")
    .insert({ label, position })
    .select(ITEM_COLUMNS)
    .single();
  fail(error);
  return data as RoutineItem;
}

export async function renameItem(id: string, label: string) {
  fail((await createClient().from("routine_items").update({ label }).eq("id", id)).error);
}

export async function deleteItem(id: string) {
  fail((await createClient().from("routine_items").delete().eq("id", id)).error);
}

export async function swapPositions(a: RoutineItem, b: RoutineItem) {
  const supabase = createClient();
  fail((await supabase.from("routine_items").update({ position: b.position }).eq("id", a.id)).error);
  fail((await supabase.from("routine_items").update({ position: a.position }).eq("id", b.id)).error);
}

// One row per (user, night); labels are a snapshot at tick time (ADR 0004).
export async function saveEntry(night: string, completedLabels: string[], itemCount: number) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("routine_entries")
    .upsert(
      {
        ...(user?.id ? { user_id: user.id } : {}),
        night,
        completed_labels: completedLabels,
        item_count: itemCount,
      },
      { onConflict: "user_id,night" },
    );
  fail(error);
}

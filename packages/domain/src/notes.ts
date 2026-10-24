// Note and Tag on a Photo (spec "Schema"): both stored trimmed. Lengths are UTF-16, never below
// Postgres' char_length, so the DB checks cannot reject what passes here.
export const NOTE_MAX = 500;
export const TAG_MAX = 24;

const key = (label: string) => label.trim().toLowerCase();

// An empty Note is valid: saving it clears the Note.
export function noteError(note: string): "tooLong" | null {
  return note.trim().length > NOTE_MAX ? "tooLong" : null;
}

// `existing` are the Photo's current Tag labels; uniqueness ignores case.
export function tagError(label: string, existing: string[]): "empty" | "tooLong" | "duplicate" | null {
  const trimmed = label.trim();
  if (trimmed.length === 0) return "empty";
  if (trimmed.length > TAG_MAX) return "tooLong";
  return existing.some((e) => key(e) === key(trimmed)) ? "duplicate" : null;
}

export type HistoryFilter = "all" | "note" | { tag: string };

// The filter chips: each Tag once (case-insensitively), in order of first appearance, first spelling kept.
export function historyTags(photos: { tags: string[] }[]): string[] {
  const seen = new Map<string, string>();
  for (const label of photos.flatMap((p) => p.tags)) if (!seen.has(key(label))) seen.set(key(label), label);
  return [...seen.values()];
}

export function filterHistory<T extends { note: string | null; tags: string[] }>(photos: T[], filter: HistoryFilter): T[] {
  if (filter === "all") return photos;
  if (filter === "note") return photos.filter((p) => p.note);
  return photos.filter((p) => p.tags.some((t) => key(t) === key(filter.tag)));
}

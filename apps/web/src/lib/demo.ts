import { DEMO_PERSONA, generateDemo, localDay } from "@skinsense/domain";
import type { MarkSpotsApi } from "@/components/mark-spots";
import type { PhotoDetailApi } from "@/components/photo-detail";
import type { HistoryApi } from "@/components/photo-history";
import type { TodayApi } from "@/components/today";
import type { TrendsApi } from "@/components/trends";
import type { PhotoTag } from "@/lib/history";
import type { SpotRow } from "@/lib/photos";
import type { RoutineEntry, RoutineItem } from "@/lib/routine";

const KEY = "skinsense-demo";
const BEFORE = "/demo-photos/before.svg";
const AFTER = "/demo-photos/after.svg";
// A StyleGAN face from thispersondoesnotexist.com (no real person), cropped to 480×640: the SVGs have no detectable face.
export const PORTRAIT = "/demo-photos/portrait.jpg";

// Demo writes live only in this browser, layered over the generated data; they never reach Supabase.
type Stored = {
  items?: RoutineItem[];
  entries: Record<string, RoutineEntry>;
  spots?: Record<string, SpotRow[]>;
  deleted?: string[];
  notes?: Record<string, string | null>;
  tags?: Record<string, PhotoTag[]>;
};
const read = (): Stored => JSON.parse(localStorage.getItem(KEY) ?? "null") ?? { entries: {} };
function write(change: (stored: Stored) => void) {
  const stored = read();
  change(stored);
  localStorage.setItem(KEY, JSON.stringify(stored));
}

export const resetDemo = () => localStorage.removeItem(KEY);

// Generated in the browser, not frozen to JSON: the 90 nights must end on the
// visitor's local yesterday, with timestamps in their timezone.
export function demoApi(routineLabels: string[]) {
  const data = generateDemo(DEMO_PERSONA, 90, localDay(new Date()), routineLabels);
  const items = () => read().items ?? data.routineItems;
  const entries = () => {
    const stored = read().entries;
    return [...data.entries.filter((e) => !(e.night in stored)), ...Object.values(stored)];
  };
  const setItems = (next: RoutineItem[]) => write((s) => void (s.items = next));
  // A deleted Photo leaves every screen, as its Supabase row would.
  const livePhotos = () => data.photos.filter((p) => !read().deleted?.includes(p.id));
  const spotCount = (id: string) => (read().spots?.[id] ?? data.spots.filter((s) => s.photo_id === id)).length;
  const note = (id: string) => read().notes?.[id] ?? null;
  const tags = (id: string) => read().tags?.[id] ?? [];

  return {
    // Same filtering as the Supabase loadTrends: photos from firstDay, rows of those photos.
    async loadTrends(firstDay: string) {
      const [y, m, d] = firstDay.split("-").map(Number);
      const since = new Date(y, m - 1, d);
      const photos = livePhotos().filter((p) => new Date(p.taken_at) >= since);
      const ids = new Set(photos.map((p) => p.id));
      // A photo's saved marks replace its generated spots, as a Supabase save does.
      const saved = read().spots ?? {};
      return {
        photos,
        readings: data.readings.filter((r) => ids.has(r.photo_id)),
        spots: [
          ...data.spots.filter((s) => ids.has(s.photo_id) && !(s.photo_id in saved)),
          ...Object.entries(saved)
            .filter(([id]) => ids.has(id))
            .flatMap(([photo_id, rows]) => rows.map((r) => ({ photo_id, ...r }))),
        ],
        entries: entries().filter((e) => e.night >= firstDay),
      };
    },
    // Trends only asks for its window's [oldest, newest] photo.
    signedPhotoUrls: async () => [BEFORE, AFTER],
    loadPhoto: async () => PORTRAIT,
    // Generated spots sit at random points, not on this face, so the photo opens with only the visitor's marks.
    loadSpots: async (photoId: string) => read().spots?.[photoId] ?? [],
    saveSpots: async (photoId: string, spots: SpotRow[]) => write((s) => void ((s.spots ??= {})[photoId] = spots)),
    // No url: the tiles and the detail show the labelled photo placeholder. Generated Photos have no Note or Tags.
    loadHistory: async () =>
      livePhotos().map((p) => ({ id: p.id, taken_at: p.taken_at, spotCount: spotCount(p.id), note: note(p.id), tags: tags(p.id).map((t) => t.label) })),
    async loadPhotoDetail(id: string) {
      const photo = livePhotos().find((p) => p.id === id);
      if (!photo) throw new Error("not found");
      return { ...photo, spotCount: spotCount(id), note: note(id), tags: tags(id), readings: data.readings.filter((r) => r.photo_id === id) };
    },
    saveNote: async (id: string, text: string) => write((s) => void ((s.notes ??= {})[id] = text.trim() || null)),
    async addTag(id: string, label: string) {
      const tag = { id: crypto.randomUUID(), label: label.trim() };
      write((s) => void ((s.tags ??= {})[id] = [...(s.tags[id] ?? []), tag]));
      return tag;
    },
    removeTag: async (tagId: string) =>
      write((s) => void (s.tags = Object.fromEntries(Object.entries(s.tags ?? {}).map(([id, list]) => [id, list.filter((t) => t.id !== tagId)])))),
    deletePhoto: async ({ id }: { id: string }) => write((s) => void (s.deleted = [...(s.deleted ?? []), id])),
    routine: {
      loadRoutine: async (night: string) => ({ items: items(), entry: entries().find((e) => e.night === night) ?? null }),
      async addItem(label: string, position: number) {
        const item = { id: crypto.randomUUID(), label, position };
        setItems([...items(), item]);
        return item;
      },
      renameItem: async (id: string, label: string) => setItems(items().map((i) => (i.id === id ? { ...i, label } : i))),
      deleteItem: async (id: string) => setItems(items().filter((i) => i.id !== id)),
      swapPositions: async (a: RoutineItem, b: RoutineItem) =>
        setItems(
          items()
            .map((i) => (i.id === a.id ? { ...i, position: b.position } : i.id === b.id ? { ...i, position: a.position } : i))
            .sort((p, q) => p.position - q.position),
        ),
      saveEntry: async (night: string, completed_labels: string[], item_count: number) =>
        write((s) => void (s.entries[night] = { night, completed_labels, item_count })),
    },
  } satisfies TodayApi & TrendsApi & MarkSpotsApi & HistoryApi & PhotoDetailApi;
}

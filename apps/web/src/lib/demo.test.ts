import { beforeEach, expect, it, vi } from "vitest";
import { demoApi, resetDemo } from "./demo";

// Node 26's own global localStorage is undefined without --localstorage-file and shadows jsdom's.
beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
  });
});

it("keeps demo spot marks in this browser, in place of the photo's generated spots, until reset", async () => {
  const api = demoApi(["Cleanser"]);
  const photoId = (await api.loadTrends("2000-01-01")).spots[0].photo_id;
  const mark = { x: 0.5, y: 0.5, zone: "nose" as const };

  await api.saveSpots(photoId, [mark]);
  expect(await api.loadSpots(photoId)).toEqual([mark]);
  const spots = (await api.loadTrends("2000-01-01")).spots.filter((s) => s.photo_id === photoId);
  expect(spots).toEqual([{ photo_id: photoId, ...mark }]);

  resetDemo();
  expect(await api.loadSpots(photoId)).toEqual([]);
});

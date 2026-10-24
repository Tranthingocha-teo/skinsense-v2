import { ZONE_INDICES, type Landmark } from "@skinsense/domain";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import * as engine from "@/lib/capture-engine.web";
import * as photos from "@/lib/photos";
import { MarkSpots } from "./mark-spots";

vi.mock("@/lib/capture-engine.web");
vi.mock("@/lib/photos");

// Synthetic face: every landmark at the centre except a nose ring (r 0.1 around
// 0.5,0.5) and a forehead ring (r 0.05 around 0.5,0.2), so the landmark box is
// x 0.4–0.6, y 0.15–0.6 and a tap at image (0.52, 0.5) is a nose spot.
function landmarks(): Landmark[] {
  const all: Landmark[] = Array.from({ length: 468 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
  const ring = (indices: number[], cx: number, cy: number, r: number) =>
    indices.forEach((index, i) => {
      const a = (2 * Math.PI * i) / indices.length;
      all[index] = { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), z: 0 };
    });
  ring(ZONE_INDICES.nose, 0.5, 0.5, 0.1);
  ring(ZONE_INDICES.forehead, 0.5, 0.2, 0.05);
  return all;
}

// The photo is 480×640 shown mirrored in a 300×400 box (scale 0.625, no crop):
// visual x = (1 − image x) · 480 · 0.625.
const RECT = { left: 0, top: 0, width: 300, height: 400, right: 300, bottom: 400, x: 0, y: 0, toJSON: () => ({}) };
const tapAt = (imageX: number, imageY: number) => ({ clientX: (1 - imageX) * 300, clientY: imageY * 400 });

async function renderMarkSpots() {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <MarkSpots photoId="photo-1" api={photos} />
    </NextIntlClientProvider>,
  );
  const img = await screen.findByRole("presentation");
  fireEvent.load(img);
  const canvas = await screen.findByRole("img", { name: "Tap the photo to mark a spot" });
  vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue(RECT);
  return canvas;
}

beforeEach(() => {
  vi.clearAllMocks();
  URL.revokeObjectURL = vi.fn();
  vi.mocked(engine.loadEngine).mockResolvedValue({} as engine.Engine);
  vi.mocked(engine.detectImage).mockReturnValue({ width: 480, height: 640, landmarks: landmarks() });
  vi.mocked(photos.loadPhoto).mockResolvedValue("blob:photo");
  vi.mocked(photos.loadSpots).mockResolvedValue([]);
  vi.mocked(photos.saveSpots).mockResolvedValue(undefined);
});

describe("MarkSpots", () => {
  it("marks a tapped spot, counts it per zone, and saves it face-relative", async () => {
    const canvas = await renderMarkSpots();
    expect(screen.getByText("No spots yet — tap the photo to add")).toBeInTheDocument();

    fireEvent.click(canvas, tapAt(0.52, 0.5));
    expect(screen.getByText("1 spot marked — tap the photo to add")).toBeInTheDocument();
    expect(screen.getByRole("listitem")).toHaveTextContent("Nose 1");
    expect(screen.getAllByRole("button", { name: "Remove spot" })).toHaveLength(1);

    fireEvent.click(canvas, tapAt(0.9, 0.9)); // outside every zone
    expect(screen.getByRole("status")).toHaveTextContent("Tap on skin inside the face zones");
    expect(screen.getAllByRole("button", { name: "Remove spot" })).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("Saved");
    expect(photos.saveSpots).toHaveBeenCalledTimes(1);
    const [photoId, saved] = vi.mocked(photos.saveSpots).mock.calls[0];
    expect(photoId).toBe("photo-1");
    expect(saved).toHaveLength(1);
    expect(saved[0].zone).toBe("nose");
    expect(saved[0].x).toBeCloseTo((0.52 - 0.4) / 0.2, 2);
    expect(saved[0].y).toBeCloseTo((0.5 - 0.15) / 0.45, 2);
  });

  it("shows stored spots on the photo and removes one on tap", async () => {
    vi.mocked(photos.loadSpots).mockResolvedValue([{ x: 0.6, y: (0.5 - 0.15) / 0.45, zone: "nose" }]);
    await renderMarkSpots();
    await screen.findByText("1 spot marked — tap the photo to add");

    fireEvent.click(screen.getByRole("button", { name: "Remove spot" }));
    expect(screen.getByText("No spots yet — tap the photo to add")).toBeInTheDocument();
    expect(screen.queryByText(/Nose/)).not.toBeInTheDocument();
  });

  it("shows a failed save above the save button and saves on retry", async () => {
    vi.mocked(photos.saveSpots).mockRejectedValueOnce(new Error("network"));
    const canvas = await renderMarkSpots();
    fireEvent.click(canvas, tapAt(0.52, 0.5));

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Saving failed. Please try again.");
    expect(screen.getByRole("listitem")).toHaveTextContent("Nose 1");

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("Saved");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(photos.saveSpots).toHaveBeenCalledTimes(2);
  });

  it("cannot mark a photo with no detectable face", async () => {
    vi.mocked(engine.detectImage).mockReturnValue({ width: 480, height: 640, landmarks: null });
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <MarkSpots photoId="photo-1" api={photos} />
      </NextIntlClientProvider>,
    );
    fireEvent.load(await screen.findByRole("presentation"));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("No face found"));
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
  });
});

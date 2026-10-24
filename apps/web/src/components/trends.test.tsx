import { localDay } from "@skinsense/domain";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import * as trends from "@/lib/trends";
import { Trends } from "./trends";

vi.mock("@/lib/trends");

const DAY = 86_400_000;
const at = (daysAgo: number) => new Date(Date.now() - daysAgo * DAY).toISOString();

afterEach(() => {
  vi.useRealTimers();
});

beforeEach(() => {
  // Mid-month, so every photo day of the range sits in the calendar's opening month.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 8, 15, 12));
  // Desktop width: the date picker is the Dialog (useIsMobile reads matchMedia).
  window.matchMedia = () => ({ addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList;
  vi.clearAllMocks();
  vi.mocked(trends.signedPhotoUrls).mockResolvedValue(["blob:before", "blob:after"]);
  vi.mocked(trends.loadTrends).mockResolvedValue({
    photos: [
      { id: "p1", taken_at: at(2), storage_path: "u/p1.jpg" },
      { id: "p2", taken_at: at(0), storage_path: "u/p2.jpg" },
    ],
    readings: [
      { photo_id: "p1", zone: "forehead", redness: 2.4 },
      { photo_id: "p2", zone: "forehead", redness: 0.9 },
      { photo_id: "p1", zone: "nose", redness: 1.0 },
      { photo_id: "p2", zone: "nose", redness: 1.05 },
    ],
    spots: [
      { photo_id: "p1", zone: "forehead" },
      { photo_id: "p2", zone: "forehead" },
      { photo_id: "p2", zone: "forehead" },
    ],
    entries: [
      { night: localDay(new Date(Date.now() - 2 * DAY)), completed_labels: ["a", "b", "c"], item_count: 4 },
      { night: localDay(new Date()), completed_labels: ["a"], item_count: 4 },
    ],
  });
});

function renderTrends() {
  render(
    <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
      <Trends api={trends} />
    </NextIntlClientProvider>,
  );
}

describe("Trends", () => {
  it("shows the selected zone's redness series, spot count, routine % and the before/after slider", async () => {
    renderTrends();
    expect(await screen.findByRole("img", { name: "Redness index for Forehead, 2 days with data" })).toBeInTheDocument();
    expect(screen.getByText("↓ trending down")).toBeInTheDocument();
    // Rendered twice (chart header on desktop, under the chart at phone width); one is display:none.
    const latest = screen.getAllByText(/Latest:/);
    expect(latest).toHaveLength(2);
    expect(latest[0]).toHaveTextContent("Latest: 0.9");
    expect(screen.getByText("Spots").nextElementSibling).toHaveTextContent("2 / Forehead"); // spots on the latest photo
    expect(screen.getByText("33%")).toBeInTheDocument(); // 75%, an unticked night (0%), 25%
    expect(screen.getByRole("slider", { name: "Drag to compare" })).toBeInTheDocument();
    expect(vi.mocked(trends.signedPhotoUrls)).toHaveBeenCalledWith(["u/p1.jpg", "u/p2.jpg"]);
  });

  it("switches zone and window", async () => {
    renderTrends();
    await screen.findByRole("img", { name: /Forehead/ });
    fireEvent.click(screen.getByRole("radio", { name: "Nose" }));
    expect(screen.getByRole("radio", { name: "Nose" })).toBeChecked();
    expect(screen.getByRole("img", { name: "Redness index for Nose, 2 days with data" })).toBeInTheDocument();
    expect(screen.getByText("→ steady")).toBeInTheDocument();
    expect(screen.getByText("Spots").nextElementSibling).toHaveTextContent("0 / Nose"); // no nose spots

    fireEvent.click(screen.getByRole("radio", { name: "30 days" }));
    expect(screen.getByRole("radio", { name: "30 days" })).toBeChecked();
    expect(vi.mocked(trends.loadTrends)).toHaveBeenCalledTimes(2);
    expect(await screen.findByRole("img", { name: "Redness index for Nose, 2 days with data" })).toBeInTheDocument();
  });

  it("explains when fewer than two photos exist", async () => {
    vi.mocked(trends.loadTrends).mockResolvedValue({ photos: [], readings: [], spots: [], entries: [] });
    renderTrends();
    expect(await screen.findByText("No photos in this window yet")).toBeInTheDocument();
    expect(screen.getByText("Needs at least 2 photos in this window")).toBeInTheDocument();
    expect(screen.getByText("Spots").nextElementSibling).toHaveTextContent("—");
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  });

  it("compares two chosen dates, enabling only days with photos", async () => {
    const photos = [5, 3, 2, 0].map((ago, i) => ({ id: `p${i}`, taken_at: at(ago), storage_path: `u/p${i}.jpg` }));
    vi.mocked(trends.loadTrends).mockResolvedValue({ photos, readings: [], spots: [], entries: [] });
    const day = (ago: number) => new Date(2026, 8, 15 - ago).toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" });
    renderTrends();

    // Not picking: the first and last photo.
    fireEvent.click(await screen.findByRole("button", { name: "Choose 2 dates" }));
    expect(vi.mocked(trends.signedPhotoUrls)).toHaveBeenLastCalledWith(["u/p0.jpg", "u/p3.jpg"]);
    const dialog = await screen.findByRole("dialog", { name: "Choose 2 dates" });
    expect(within(dialog).getByRole("button", { name: /^Before/ })).toHaveTextContent("Sep 10");
    expect(within(dialog).getByRole("button", { name: /^After/ })).toHaveTextContent("Sep 15");
    expect(within(dialog).getByRole("button", { name: day(4) })).toBeDisabled(); // no photo that night
    expect(within(dialog).getByRole("button", { name: `${day(0)}, today` })).toBeEnabled();

    fireEvent.click(within(dialog).getByRole("button", { name: day(3) }));
    fireEvent.click(within(dialog).getByRole("button", { name: day(2) }));
    expect(within(dialog).getByRole("button", { name: /^Before/ })).toHaveTextContent("Sep 12");
    expect(within(dialog).getByRole("button", { name: /^After/ })).toHaveTextContent("Sep 13");
    fireEvent.click(within(dialog).getByRole("button", { name: "Compare" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(vi.mocked(trends.signedPhotoUrls)).toHaveBeenLastCalledWith(["u/p1.jpg", "u/p2.jpg"]);
    expect(screen.getByText("Sep 12")).toBeInTheDocument();
    expect(screen.getByText("Sep 13")).toBeInTheDocument();
  });

  it("keeps the automatic pair when the picker is cancelled", async () => {
    renderTrends();
    fireEvent.click(await screen.findByRole("button", { name: "Choose 2 dates" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /^After/ }));
    fireEvent.click(within(dialog).getByRole("button", { name: /Cancel/ }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(vi.mocked(trends.signedPhotoUrls)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(trends.signedPhotoUrls)).toHaveBeenCalledWith(["u/p1.jpg", "u/p2.jpg"]);
  });

  it("shows an error with a retry when loading fails", async () => {
    vi.mocked(trends.loadTrends).mockRejectedValueOnce(new Error("offline"));
    renderTrends();
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load your data");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("img", { name: /Forehead/ })).toBeInTheDocument();
  });
});

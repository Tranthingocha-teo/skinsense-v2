import { localDay, windowDays } from "@skinsense/domain";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import * as routine from "@/lib/routine";
import * as trends from "@/lib/trends";
import { Today } from "./today";

vi.mock("@/lib/trends");
vi.mock("@/lib/routine");
vi.mock("next/navigation", () => ({ usePathname: () => "/app" }));

const DAY = 86_400_000;
const at = (daysAgo: number) => new Date(Date.now() - daysAgo * DAY).toISOString();
const night = (daysAgo: number) => localDay(new Date(Date.now() - daysAgo * DAY));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(routine.loadRoutine).mockResolvedValue({ items: [{ id: "i1", label: "Cleanser", position: 0 }], entry: null });
  vi.mocked(trends.loadTrends).mockResolvedValue({
    photos: [
      { id: "p1", taken_at: at(2), storage_path: "u/p1.jpg" },
      { id: "p2", taken_at: at(1), storage_path: "u/p2.jpg" },
    ],
    readings: [
      { photo_id: "p1", zone: "forehead", redness: 2.4 },
      { photo_id: "p2", zone: "forehead", redness: 0.9 },
      { photo_id: "p1", zone: "nose", redness: 1.0 },
      { photo_id: "p2", zone: "nose", redness: 1.05 },
    ],
    spots: [
      { photo_id: "p2", zone: "forehead" },
      { photo_id: "p2", zone: "nose" },
      { photo_id: "p2", zone: "chin" },
    ],
    entries: [
      { night: night(1), completed_labels: ["Cleanser"], item_count: 1 },
      { night: night(3), completed_labels: ["Cleanser"], item_count: 1 },
    ],
  });
});

function renderToday() {
  render(
    <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
      <Today api={{ loadTrends: trends.loadTrends, routine }} />
    </NextIntlClientProvider>,
  );
}

const streakOf = (title: string) => screen.getByText(title).nextElementSibling;

describe("Today", () => {
  it("shows tonight's capture state, the last photo, both streaks, tonight's routine and the 7-day zone directions", async () => {
    renderToday();
    expect(await screen.findByRole("heading", { name: "No photo tonight yet" })).toBeInTheDocument();
    expect(trends.loadTrends).toHaveBeenCalledWith(windowDays(90, localDay(new Date()))[0]);
    expect(screen.getByRole("link", { name: "Take tonight's photo" })).toHaveAttribute("href", "/app/capture");
    expect(screen.getByText(/^Last: .+ · 3 spots marked$/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mark spots →" })).toHaveAttribute("href", "/app/spots/p2");
    expect(streakOf("Capture streak")).toHaveTextContent("2 nights in a row"); // yesterday and the day before
    expect(streakOf("Routine streak")).toHaveTextContent("1 night in a row"); // ticked yesterday, not two nights ago
    expect(await screen.findByRole("checkbox", { name: "Cleanser" })).not.toBeChecked();
    expect(screen.getByRole("link", { name: "Edit routine" })).toBeInTheDocument();
    expect(screen.getByText("Redness index, last 7 days")).toBeInTheDocument();
    expect(screen.getByText("↓ trending down")).toBeInTheDocument(); // forehead
    expect(screen.getByText("→ steady")).toBeInTheDocument(); // nose
    expect(screen.getByRole("link", { name: "Trends →" })).toHaveAttribute("href", "/app/trends");
  });

  it("switches the call to action once tonight has a photo", async () => {
    vi.mocked(trends.loadTrends).mockResolvedValue({
      photos: [{ id: "p3", taken_at: new Date().toISOString(), storage_path: "u/p3.jpg" }],
      readings: [],
      spots: [],
      entries: [],
    });
    renderToday();
    expect(await screen.findByRole("heading", { name: "Tonight's photo is saved" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Take another photo" })).toBeInTheDocument();
    expect(streakOf("Capture streak")).toHaveTextContent("1 night in a row");
  });

  it("tells a brand-new user there are no photos yet, with streaks at 0 and an unticked routine", async () => {
    vi.mocked(trends.loadTrends).mockResolvedValue({ photos: [], readings: [], spots: [], entries: [] });
    renderToday();
    expect(await screen.findByText("No photos yet. Take your first one to start the diary.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Take tonight's photo" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Mark spots →" })).not.toBeInTheDocument();
    expect(streakOf("Capture streak")).toHaveTextContent("0 nights in a row");
    expect(streakOf("Routine streak")).toHaveTextContent("0 nights in a row");
    expect(await screen.findByRole("checkbox", { name: "Cleanser" })).not.toBeChecked();
    expect(screen.queryByText("Redness index, last 7 days")).not.toBeInTheDocument();
  });

  it("shows the date, title and skeleton blocks while loading", async () => {
    vi.mocked(trends.loadTrends).mockReturnValue(new Promise(() => {}));
    renderToday();
    expect(await screen.findByRole("status")).toHaveTextContent("Loading…");
    expect(screen.getByRole("heading", { name: "Today" })).toBeInTheDocument();
    expect(screen.queryByText("Capture streak")).not.toBeInTheDocument();
  });

  it("shows an error with a retry when loading fails", async () => {
    vi.mocked(trends.loadTrends).mockRejectedValueOnce(new Error("offline"));
    renderToday();
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load your data");
    expect(screen.getByRole("heading", { name: "Today" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "No photo tonight yet" })).toBeInTheDocument();
  });
});

import { fireEvent, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import * as history from "@/lib/history";
import { PhotoHistory } from "./photo-history";

vi.mock("@/lib/history");
vi.mock("next/navigation", () => ({ usePathname: () => "/app/history" }));

// Noon local time: the provider formats in UTC, and noon stays on the same calendar day either way.
const year = new Date().getFullYear();
const at = (y: number, month: number, day: number) => new Date(y, month - 1, day, 12).toISOString();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(history.loadHistory).mockResolvedValue([
    { id: "p1", taken_at: at(year, 9, 13), spotCount: 3, url: "https://x/p1", note: null, tags: ["Thiếu ngủ"] },
    { id: "p2", taken_at: at(year, 9, 12), spotCount: 1, url: "https://x/p2", note: "Slept late", tags: [] },
    { id: "p0", taken_at: at(year - 1, 12, 30), spotCount: 0, url: "https://x/p0", note: null, tags: ["thiếu ngủ", "Serum mới"] },
  ]);
});

function renderHistory() {
  render(
    <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
      <PhotoHistory api={history} />
    </NextIntlClientProvider>,
  );
}

describe("PhotoHistory", () => {
  it("groups Photos by month, newest first, each tile with its date and spot count linking to Photo detail", async () => {
    renderHistory();
    expect(screen.getByRole("heading", { name: "Photo history" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute("href", "/app/settings");

    const months = await screen.findAllByRole("heading", { level: 2 });
    expect(months.map((h) => h.textContent)).toEqual(["September", `December ${year - 1}`]);
    const [september, december] = screen.getAllByRole("list");
    expect(september.parentElement).toHaveTextContent("2 photos");
    expect(within(september).getAllByRole("link").map((a) => a.getAttribute("aria-label"))).toEqual(["Sep 13, 3 spots", "Sep 12, 1 spot"]);
    expect(within(september).getByRole("link", { name: "Sep 13, 3 spots" })).toHaveAttribute("href", "/app/photos/p1");
    expect(december.parentElement).toHaveTextContent("1 photo");
    expect(within(december).getByRole("link", { name: "Dec 30, 0 spots" })).toHaveAttribute("href", "/app/photos/p0");
    expect(screen.queryByText("Photo · placeholder")).not.toBeInTheDocument();
  });

  it("filters by one Tag or by having a Note, and back to all", async () => {
    renderHistory();
    const filters = await screen.findByRole("group", { name: "Filter photos" });
    const chips = within(filters).getAllByRole("button");
    expect(chips.map((c) => c.textContent)).toEqual(["All", "Thiếu ngủ", "Serum mới", "Has a note"]);
    expect(within(filters).getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
    const tiles = () => screen.getAllByRole("link", { name: /spots?$/ }).map((a) => a.getAttribute("aria-label"));

    fireEvent.click(within(filters).getByRole("button", { name: "Thiếu ngủ" }));
    expect(within(filters).getByRole("button", { name: "Thiếu ngủ" })).toHaveAttribute("aria-pressed", "true");
    expect(tiles()).toEqual(["Sep 13, 3 spots", "Dec 30, 0 spots"]);

    fireEvent.click(within(filters).getByRole("button", { name: "Has a note" }));
    expect(tiles()).toEqual(["Sep 12, 1 spot"]);
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual(["September"]);

    fireEvent.click(within(filters).getByRole("button", { name: "All" }));
    expect(tiles()).toHaveLength(3);
  });

  it("says so when no Photo matches the filter", async () => {
    vi.mocked(history.loadHistory).mockResolvedValue([{ id: "p1", taken_at: at(year, 9, 13), spotCount: 3, url: "https://x/p1", note: null, tags: [] }]);
    renderHistory();
    fireEvent.click(await screen.findByRole("button", { name: "Has a note" }));
    expect(screen.getByText("No photos match this filter.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("tells a user without photos to take the first one", async () => {
    vi.mocked(history.loadHistory).mockResolvedValue([]);
    renderHistory();
    expect(await screen.findByText("No photos yet. Take your first one to start the diary.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Take tonight's photo" })).toHaveAttribute("href", "/app/capture");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("shows skeleton tiles while loading", () => {
    vi.mocked(history.loadHistory).mockReturnValue(new Promise(() => {}));
    renderHistory();
    expect(screen.getByRole("status")).toHaveTextContent("Loading…");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("shows an error with a retry when loading fails", async () => {
    vi.mocked(history.loadHistory).mockRejectedValueOnce(new Error("offline"));
    renderHistory();
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load your data");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("link", { name: "Sep 13, 3 spots" })).toBeInTheDocument();
  });
});

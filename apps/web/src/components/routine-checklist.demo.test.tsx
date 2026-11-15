import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import { RoutineChecklist, type RoutineApi } from "./routine-checklist";

vi.mock("next/navigation", () => ({ usePathname: () => "/demo/routine" }));

function api(remote?: boolean): RoutineApi {
  return {
    remote,
    loadRoutine: vi.fn().mockResolvedValue({ items: [{ id: "i1", label: "Cleanser", position: 0 }], entry: null }),
    addItem: vi.fn(),
    renameItem: vi.fn(),
    deleteItem: vi.fn(),
    swapPositions: vi.fn(),
    saveEntry: vi.fn(),
  } as unknown as RoutineApi;
}

afterEach(() => vi.unstubAllGlobals());

describe("RoutineChecklist", () => {
  it("keeps the demo's own steps: a browser-only api never asks /api/routine", async () => {
    // Signed out, /api/routine answers ok with no steps; before the fix that wiped the demo routine.
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, steps: [] }) });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <RoutineChecklist api={api(false)} />
      </NextIntlClientProvider>,
    );

    expect(await screen.findByText("Cleanser")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByText(/No routine steps yet/)).not.toBeInTheDocument();
  });

  it("speaks the active locale on the period switcher", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <RoutineChecklist api={api()} />
      </NextIntlClientProvider>,
    );
    expect(await screen.findByRole("button", { name: "Morning" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Evening" })).toBeInTheDocument();
    expect(screen.queryByText(/Routine Sáng|Routine Tối/)).not.toBeInTheDocument();
  });
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import * as routine from "@/lib/routine";
import { RoutineChecklist } from "./routine-checklist";

vi.mock("@/lib/routine");
vi.mock("next/navigation", () => ({ usePathname: () => "/app/routine" }));

// Radix positions the menu with a ResizeObserver; jsdom has none.
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const items = ["Makeup remover", "Cleanser", "Acne serum", "Moisturizer"].map((label, position) => ({
  id: `id-${position}`,
  label,
  position,
}));

function renderChecklist() {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <RoutineChecklist api={routine} />
    </NextIntlClientProvider>,
  );
  return screen.findByText("0/4 done");
}

// Opens the row's menu from the keyboard (Radix ignores jsdom's synthetic pointerdown) and picks an action.
async function pickMenuItem(row: number, action: string) {
  fireEvent.keyDown(screen.getAllByRole("button", { name: /^Options for / })[row], { key: "Enter" });
  fireEvent.click(await screen.findByRole("menuitem", { name: action }));
}

const labels = () => screen.getAllByRole("checkbox").map((c) => c.getAttribute("aria-label"));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(routine.loadRoutine).mockResolvedValue({ items, entry: null });
  vi.mocked(routine.saveEntry).mockResolvedValue();
  vi.mocked(routine.renameItem).mockResolvedValue();
  vi.mocked(routine.deleteItem).mockResolvedValue();
  vi.mocked(routine.swapPositions).mockResolvedValue();
  vi.mocked(routine.addItem).mockImplementation(async (label, position) => ({ id: `id-${position}`, label, position }));
});

describe("RoutineChecklist", () => {
  it("renders tonight's items with progress", async () => {
    await renderChecklist();
    expect(screen.getAllByRole("checkbox")).toHaveLength(4);
    expect(routine.loadRoutine).toHaveBeenCalledTimes(1);
    expect(routine.loadRoutine).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), en.Routine.defaults);
  });

  it("ticking snapshots the ticked labels for tonight", async () => {
    await renderChecklist();
    fireEvent.click(screen.getByRole("checkbox", { name: "Cleanser" }));
    expect(screen.getByText("1/4 done")).toBeInTheDocument();
    await waitFor(() =>
      expect(routine.saveEntry).toHaveBeenCalledWith(expect.any(String), ["Cleanser"], 4),
    );
  });

  it("a failed write reloads instead of showing an error", async () => {
    await renderChecklist();
    vi.mocked(routine.saveEntry).mockRejectedValue(new Error("offline"));
    fireEvent.click(screen.getByRole("checkbox", { name: "Cleanser" }));
    await waitFor(() => expect(routine.loadRoutine).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("0/4 done")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renaming an item never touches tonight's entry", async () => {
    await renderChecklist();
    await pickMenuItem(1, "Rename");
    const input = await screen.findByDisplayValue("Cleanser");
    fireEvent.change(input, { target: { value: "Gentle cleanser" } });
    fireEvent.submit(input.closest("form")!);
    expect(screen.getByRole("checkbox", { name: "Gentle cleanser" })).toBeInTheDocument();
    await waitFor(() => expect(routine.renameItem).toHaveBeenCalledWith("id-1", "Gentle cleanser"));
    expect(routine.saveEntry).not.toHaveBeenCalled();
  });

  it("a duplicate rename shows the inline error and is not saved", async () => {
    await renderChecklist();
    await pickMenuItem(1, "Rename");
    const input = await screen.findByDisplayValue("Cleanser");
    fireEvent.change(input, { target: { value: "Moisturizer" } });
    fireEvent.blur(input);
    expect(screen.getByRole("alert")).toHaveTextContent("This step already exists");
    expect(screen.getByDisplayValue("Moisturizer")).toBeInTheDocument();
    expect(routine.renameItem).not.toHaveBeenCalled();
  });

  it("adds a step from the field at the end of the list", async () => {
    await renderChecklist();
    fireEvent.click(screen.getByRole("button", { name: "Add step" }));
    const input = screen.getByRole("textbox", { name: "New step" });
    fireEvent.change(input, { target: { value: "Sunscreen" } });
    fireEvent.submit(input.closest("form")!);
    expect(labels()).toEqual([...en.Routine.defaults, "Sunscreen"]);
    await waitFor(() => expect(routine.addItem).toHaveBeenCalledWith("Sunscreen", 4));
    expect(screen.getByRole("button", { name: "Add step" })).toBeInTheDocument();
  });

  it("a duplicate new step shows the inline error and is not saved", async () => {
    await renderChecklist();
    fireEvent.click(screen.getByRole("button", { name: "Add step" }));
    const input = screen.getByRole("textbox", { name: "New step" });
    fireEvent.change(input, { target: { value: "Cleanser" } });
    fireEvent.submit(input.closest("form")!);
    expect(screen.getByRole("alert")).toHaveTextContent("This step already exists");
    expect(screen.getAllByRole("checkbox")).toHaveLength(4);
    expect(routine.addItem).not.toHaveBeenCalled();
  });

  it("deletes an item from its menu", async () => {
    await renderChecklist();
    await pickMenuItem(2, "Delete");
    await waitFor(() => expect(labels()).toEqual(["Makeup remover", "Cleanser", "Moisturizer"]));
    expect(routine.deleteItem).toHaveBeenCalledWith("id-2");
  });

  it("move down swaps positions and reorders", async () => {
    await renderChecklist();
    await pickMenuItem(0, "Move down");
    await waitFor(() => expect(labels()).toEqual(["Cleanser", "Makeup remover", "Acne serum", "Moisturizer"]));
    await waitFor(() => expect(routine.swapPositions).toHaveBeenCalledWith(items[0], items[1]));
  });
});

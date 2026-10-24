import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import { OnboardingGate } from "./onboarding";

// Node 26's own global localStorage is undefined without --localstorage-file and shadows jsdom's (as in demo.test.ts).
beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
  });
});

function renderGate() {
  render(
    <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
      <OnboardingGate>
        <p>App home</p>
      </OnboardingGate>
    </NextIntlClientProvider>,
  );
}

describe("Onboarding", () => {
  it("shows the three points instead of the app on a device that has not seen it", () => {
    renderGate();
    expect(screen.getByRole("heading", { name: "A skin diary, one photo a night." })).toBeInTheDocument();
    const points = screen.getAllByRole("listitem");
    expect(points.map((li) => li.textContent)).toEqual([
      expect.stringContaining("Same place, same light"),
      expect.stringContaining("Your browser will ask for the webcam"),
      expect.stringContaining("Not a diagnosis"),
    ]);
    expect(screen.queryByText("App home")).not.toBeInTheDocument();
  });

  it.each(["Get started", "Skip"])("%s opens the app and remembers it on this device", (name) => {
    renderGate();
    fireEvent.click(screen.getByRole("button", { name }));
    expect(screen.getByText("App home")).toBeInTheDocument();
    expect(localStorage.getItem("skinsense-onboarded")).not.toBeNull();
  });

  it("goes straight to the app once the flag is set", () => {
    localStorage.setItem("skinsense-onboarded", "1");
    renderGate();
    expect(screen.getByText("App home")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "A skin diary, one photo a night." })).not.toBeInTheDocument();
  });
});

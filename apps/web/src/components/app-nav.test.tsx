import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import { AppShell } from "./app-nav";

const pathname = vi.fn<() => string>();
vi.mock("next/navigation", () => ({ usePathname: () => pathname() }));

// The shadcn Sidebar reads a media query; jsdom has none.
beforeEach(() => {
  window.matchMedia = () => ({ addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList;
});

function renderShell(path: string) {
  pathname.mockReturnValue(path);
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <AppShell>
        <p>page</p>
      </AppShell>
    </NextIntlClientProvider>,
  );
  // The sidebar and the phone tab bar are both in the DOM; CSS shows one at a time.
  return screen.getAllByRole("navigation", { name: "Navigation" }).map((nav) =>
    Object.fromEntries(
      within(nav)
        .getAllByRole("link")
        .map((a) => [a.textContent, { href: a.getAttribute("href"), active: a.getAttribute("aria-current") === "page" }]),
    ),
  );
}

describe("AppShell", () => {
  it("links each tab to its /app screen and marks the current one active in both bars", () => {
    for (const nav of renderShell("/app/trends")) {
      expect(nav).toEqual({
        Today: { href: "/app", active: false },
        Capture: { href: "/app/capture", active: false },
        Trends: { href: "/app/trends", active: true },
        Settings: { href: "/app/settings", active: false },
      });
    }
    expect(screen.getByText("page")).toBeInTheDocument();
  });

  it("keeps Today active on the routine page", () => {
    for (const nav of renderShell("/app/routine")) expect(nav.Today.active).toBe(true);
  });

  it("stays inside the demo and sends demo-less screens to sign-in", () => {
    for (const nav of renderShell("/demo")) {
      expect(nav).toEqual({
        Today: { href: "/demo", active: true },
        Capture: { href: "/#cta", active: false },
        Trends: { href: "/demo/trends", active: false },
        Settings: { href: "/#cta", active: false },
      });
    }
  });
});

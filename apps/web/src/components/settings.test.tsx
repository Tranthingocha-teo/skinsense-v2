import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import * as account from "@/lib/account";
import { Settings } from "./settings";

vi.mock("@/lib/account");
const router = { push: vi.fn(), refresh: vi.fn() };
vi.mock("next/navigation", () => ({ usePathname: () => "/app/settings", useRouter: () => router }));

beforeEach(() => vi.clearAllMocks());

function renderSettings() {
  render(
    <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
      <Settings account={{ name: "Test User", email: "e2e@skinsense.test" }} api={account} />
    </NextIntlClientProvider>,
  );
}

async function openDialog() {
  fireEvent.click(screen.getByRole("button", { name: "Delete account" }));
  return screen.findByRole("alertdialog", { name: "Delete account?" });
}

describe("Settings", () => {
  it("shows the Google account, language, privacy, sign out and delete rows and no Android-only rows", () => {
    renderSettings();
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("e2e@skinsense.test")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "English" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Tiếng Việt" })).not.toBeChecked();
    expect(screen.getByRole("link", { name: "Feedback" })).toHaveAttribute("href", "/app/settings/feedback");
    expect(screen.getByRole("link", { name: "Privacy policy" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: "Photo history" })).toHaveAttribute("href", "/app/history");
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete account" })).toBeInTheDocument();
    for (const androidOnly of [/reminder/i, /lock/i, /about/i]) expect(screen.queryByText(androidOnly)).not.toBeInTheDocument();
  });

  it("remembers the chosen language in the cookie and re-renders", () => {
    renderSettings();
    fireEvent.click(screen.getByRole("radio", { name: "Tiếng Việt" }));
    expect(document.cookie).toContain("locale=vi");
    expect(router.refresh).toHaveBeenCalled();
  });

  it("signs out and leaves for the landing page", async () => {
    vi.mocked(account.signOut).mockResolvedValue();
    renderSettings();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/"));
    expect(account.signOut).toHaveBeenCalled();
  });

  it("asks before deleting and cancel closes without deleting", async () => {
    renderSettings();
    const dialog = await openDialog();
    expect(dialog).toHaveTextContent("Permanently delete your account and every photo, spot, reading and routine? This cannot be undone.");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(account.deleteAccount).not.toHaveBeenCalled();
  });

  it("shows progress with cancel disabled while deleting, then leaves", async () => {
    let finish!: () => void;
    vi.mocked(account.deleteAccount).mockReturnValue(new Promise((resolve) => (finish = resolve)));
    renderSettings();
    const dialog = await openDialog();
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete account" }));
    expect(await screen.findByRole("button", { name: "Deleting…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    finish();
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/"));
  });

  it("keeps the dialog open with the error when deletion fails", async () => {
    vi.mocked(account.deleteAccount).mockRejectedValue(new Error("boom"));
    renderSettings();
    const dialog = await openDialog();
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete account" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Deletion failed. Try again later. Your account has not been deleted.");
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled();
    expect(within(dialog).getByRole("button", { name: "Delete account" })).toBeEnabled();
    expect(router.push).not.toHaveBeenCalled();
  });
});

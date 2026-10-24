import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import { Toaster } from "@/components/ui/sonner";
import * as feedback from "@/lib/feedback";
import { Feedback } from "./feedback";

vi.mock("@/lib/feedback");
const router = { push: vi.fn() };
vi.mock("next/navigation", () => ({ usePathname: () => "/app/settings/feedback", useRouter: () => router }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(feedback.deviceInfo).mockReturnValue({ appVersion: "0.1.0", deviceNote: "Chrome on Linux" });
});

function renderFeedback() {
  render(
    <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
      <Feedback api={feedback} />
      {/* A fixed theme: "system" makes Sonner query matchMedia, which jsdom lacks. */}
      <Toaster theme="light" />
    </NextIntlClientProvider>,
  );
}

const message = () => screen.getByRole("textbox", { name: "Message" });
const send = () => screen.getByRole("button", { name: "Send feedback" });

describe("Feedback", () => {
  it("shows the kinds, the message field, the opt-in note and the no-photos statement; send waits for a message", () => {
    renderFeedback();
    expect(screen.getByRole("heading", { name: "Feedback" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Settings" })).toHaveAttribute("href", "/app/settings");
    expect(screen.getByRole("radio", { name: "Bug report" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Idea" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Other" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Attach browser and app version" })).not.toBeChecked();
    expect(screen.getByText("Your photos and skin data are never attached.")).toBeInTheDocument();
    expect(send()).toBeDisabled();
    fireEvent.change(message(), { target: { value: "   " } });
    expect(send()).toBeDisabled();
  });

  it("refuses a message over 2000 characters", () => {
    renderFeedback();
    fireEvent.change(message(), { target: { value: "a".repeat(2001) } });
    expect(screen.getByText("Keep it to 2000 characters.")).toBeInTheDocument();
    expect(message()).toHaveAttribute("aria-invalid", "true");
    expect(send()).toBeDisabled();
  });

  it("sends the trimmed message without device info when not opted in, toasts and returns to Settings", async () => {
    vi.mocked(feedback.sendFeedback).mockResolvedValue();
    renderFeedback();
    fireEvent.click(screen.getByRole("radio", { name: "Idea" }));
    fireEvent.change(message(), { target: { value: "  A weekly summary  " } });
    fireEvent.click(send());
    expect(await screen.findByText("Feedback sent. Thank you!")).toBeInTheDocument();
    expect(feedback.sendFeedback).toHaveBeenCalledWith({ kind: "idea", message: "A weekly summary", appVersion: null, deviceNote: null });
    expect(router.push).toHaveBeenCalledWith("/app/settings");
  });

  it("attaches the app version and browser only when opted in", async () => {
    vi.mocked(feedback.sendFeedback).mockResolvedValue();
    renderFeedback();
    fireEvent.change(message(), { target: { value: "Chart is blank" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Attach browser and app version" }));
    fireEvent.click(send());
    await waitFor(() => expect(router.push).toHaveBeenCalled());
    expect(feedback.sendFeedback).toHaveBeenCalledWith({ kind: "bug", message: "Chart is blank", appVersion: "0.1.0", deviceNote: "Chrome on Linux" });
  });

  it("shows the error inline and keeps the message when sending fails", async () => {
    vi.mocked(feedback.sendFeedback).mockRejectedValue(new Error("boom"));
    renderFeedback();
    fireEvent.change(message(), { target: { value: "Chart is blank" } });
    fireEvent.click(send());
    expect(await screen.findByRole("alert")).toHaveTextContent("Sending failed. Please try again.");
    expect(message()).toHaveValue("Chart is blank");
    expect(send()).toBeEnabled();
    expect(router.push).not.toHaveBeenCalled();
  });
});

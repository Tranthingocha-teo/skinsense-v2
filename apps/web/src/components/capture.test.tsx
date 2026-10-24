import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import type { Engine, Still } from "@/lib/capture-engine.web";
import { Capture, type CaptureApi } from "./capture";

const reading = { redness: 1.5, unevenness: 0.4, pixelCount: 1200 };
const readings = { forehead: reading, leftCheek: reading, rightCheek: reading, nose: reading, chin: { redness: 0, unevenness: 0, pixelCount: 0 } };
const stream = { getTracks: () => [], getVideoTracks: () => [] } as unknown as MediaStream;

function still(overrides: Partial<Still>): Still {
  return { image: new Blob(), previewUrl: "blob:still", brightness: 120, awbLocked: false, readings, issues: [], ...overrides };
}

// Seam 2: the engine and photos modules are the screen's data module.
const api = {
  startCamera: vi.fn(),
  loadEngine: vi.fn(),
  sampleFrame: vi.fn(),
  captureStill: vi.fn(),
  latestPhotoUrl: vi.fn(),
  savePhoto: vi.fn(),
} satisfies { [K in keyof CaptureApi]: ReturnType<typeof vi.fn> };

function renderCapture() {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <Capture api={api} />
    </NextIntlClientProvider>,
  );
}

async function renderLive() {
  renderCapture();
  const shutter = await screen.findByRole("button", { name: "Take photo" });
  await waitFor(() => expect(shutter).toBeEnabled());
  return shutter;
}

async function renderReview(issues: Still["issues"] = ["dark"]) {
  api.captureStill.mockResolvedValue(still({ issues, brightness: 40, awbLocked: true }));
  fireEvent.click(await renderLive());
  return screen.findByRole("alert");
}

let phone = false;

beforeEach(() => {
  vi.clearAllMocks();
  phone = false;
  window.matchMedia = () => ({ matches: phone }) as MediaQueryList;
  // No preview loop in jsdom: no canvas, no frames.
  vi.stubGlobal("requestAnimationFrame", () => 0);
  vi.stubGlobal("cancelAnimationFrame", () => {});
  URL.revokeObjectURL = vi.fn();
  api.startCamera.mockResolvedValue(stream);
  api.loadEngine.mockResolvedValue({} as Engine);
  api.latestPhotoUrl.mockResolvedValue(null);
  api.savePhoto.mockResolvedValue("photo-id");
});

describe("Capture", () => {
  it("keeps the shutter disabled until the camera is ready", async () => {
    let start!: (stream: MediaStream) => void;
    api.startCamera.mockReturnValue(new Promise<MediaStream>((resolve) => (start = resolve)));
    renderCapture();
    expect(screen.getByRole("button", { name: "Opening camera…" })).toBeDisabled();
    start(stream);
    const shutter = await screen.findByRole("button", { name: "Take photo" });
    await waitFor(() => expect(shutter).toBeEnabled());
    expect(screen.getByRole("status")).toHaveTextContent("Bring your face into the frame");
  });

  it("shows the low-light badge while the frames are too dark", async () => {
    // One sampled frame: the loop needs a decodable video and a 2d context.
    Object.defineProperty(HTMLMediaElement.prototype, "readyState", { configurable: true, value: 4 });
    HTMLCanvasElement.prototype.getContext = (() => new Proxy({}, { get: () => () => {} })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
    let loop: FrameRequestCallback | undefined;
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => ((loop ??= cb), 0));
    api.sampleFrame.mockReturnValue({ landmarks: null, issues: ["dark"] });
    await renderLive();
    act(() => loop!(1000));
    expect(screen.getByRole("status")).toHaveTextContent("Too dark");
  });

  it("lists the quality issues with Retake and Save anyway", async () => {
    const warning = await renderReview(["dark", "turned"]);
    expect(warning).toHaveTextContent("This photo may give misleading readings:");
    expect(warning).toHaveTextContent("Too dark");
    expect(warning).toHaveTextContent("Face the camera");
    expect(screen.getByRole("button", { name: "Retake" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Save anyway" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
  });

  it("a failed save shows the error inline and keeps the same still for retry", async () => {
    api.savePhoto.mockRejectedValueOnce(new Error("offline"));
    await renderReview();
    fireEvent.click(screen.getByRole("button", { name: "Save anyway" }));
    await screen.findByText("Saving failed. Please try again.");
    fireEvent.click(screen.getByRole("button", { name: "Save anyway" }));
    await screen.findByText("Saved");
    expect(api.savePhoto).toHaveBeenCalledTimes(2);
    expect(api.captureStill).toHaveBeenCalledTimes(1);
  });

  it("saves the readings on request and shows the per-zone table", async () => {
    await renderReview();
    fireEvent.click(screen.getByRole("button", { name: "Save anyway" }));
    await screen.findByText("Saved");
    expect(api.savePhoto).toHaveBeenCalledWith({ image: expect.any(Blob), brightness: 40, awbLocked: true, readings });
    expect(screen.getByText(/Not a medical diagnosis/)).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(6);
    expect(screen.getByRole("row", { name: /Chin/ })).toHaveTextContent("—");
    expect(screen.getByRole("button", { name: "Take another" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mark spots" })).toHaveAttribute("href", "/app/spots/photo-id");
    expect(screen.getByRole("link", { name: "Done" })).toHaveAttribute("href", "/app");
  });

  it("a capture without a face can only be retaken", async () => {
    api.captureStill.mockResolvedValue(still({ readings: null, issues: ["noFace"] }));
    fireEvent.click(await renderLive());

    await screen.findByText("Bring your face into the frame");
    expect(screen.queryByRole("button", { name: /Save/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retake" }));
    expect(await screen.findByRole("button", { name: "Take photo" })).toBeEnabled();
    expect(api.savePhoto).not.toHaveBeenCalled();
  });

  it("a blocked webcam shows the camera error and Try again restarts the camera", async () => {
    api.startCamera.mockRejectedValueOnce(new DOMException("denied", "NotAllowedError"));
    renderCapture();
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Could not open the camera. Allow camera access and reload.");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    const shutter = await screen.findByRole("button", { name: "Take photo" });
    await waitFor(() => expect(shutter).toBeEnabled());
    expect(api.startCamera).toHaveBeenCalledTimes(2);
  });

  it("at phone width points to the APK instead of opening the camera", async () => {
    phone = true;
    renderCapture();
    expect(screen.getByRole("note")).toHaveTextContent("Capture in a phone browser is not supported. Use the Android app instead.");
    expect(screen.getByRole("link", { name: "Download the APK" })).toHaveAttribute("href", expect.stringContaining("apk"));
    expect(screen.getByText(/open SkinSense in Chrome or Edge/)).toBeInTheDocument();
    await waitFor(() => expect(api.loadEngine).not.toHaveBeenCalled());
    expect(api.startCamera).not.toHaveBeenCalled();
  });
});

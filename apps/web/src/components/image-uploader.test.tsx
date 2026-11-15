import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { checkImageFile, MAX_IMAGE_BYTES } from "@/lib/upload-limits";
import { ImageUploader } from "./cloudinary-product-uploader";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function mockFetch(post: () => Response) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) =>
    init?.method === "POST" ? post() : json({ ok: true, configured: true }),
  );
}

const png = (name = "logo.png", size = 64) => new File([new Uint8Array(size)], name, { type: "image/png" });

describe("checkImageFile", () => {
  it("accepts images within the route's 10MB limit and refuses the rest", () => {
    expect(checkImageFile({ size: 1000, type: "image/jpeg" })).toBeNull();
    expect(checkImageFile({ size: MAX_IMAGE_BYTES + 1, type: "image/png" })).toMatch(/10MB/);
    expect(checkImageFile({ size: 10, type: "application/pdf" })).toMatch(/hình ảnh/);
  });
});

describe("ImageUploader (single image)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("has no URL text field, and offers the camera on phones", () => {
    mockFetch(() => json({ ok: true }));
    render(<ImageUploader images={[]} onChange={() => {}} label="Logo" />);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByTestId("product-camera-input")).toHaveAttribute("capture", "environment");
    expect(screen.getByTestId("product-file-input")).toHaveAttribute("accept", "image/*");
    expect(screen.getByTestId("product-file-input")).not.toHaveAttribute("multiple");
  });

  it("uploads the chosen file and replaces the current image", async () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v1/new.png";
    const fetchSpy = mockFetch(() => json({ ok: true, url }));
    const onChange = vi.fn();
    render(<ImageUploader images={["https://res.cloudinary.com/demo/old.png"]} onChange={onChange} folder="shops" />);

    fireEvent.change(screen.getByTestId("product-file-input"), { target: { files: [png()] } });

    await waitFor(() => expect(onChange).toHaveBeenCalledWith([url]));
    const post = fetchSpy.mock.calls.find(([, init]) => init?.method === "POST");
    const body = post?.[1]?.body as FormData;
    expect(body.get("folder")).toBe("shops");
  });

  it("refuses a too-large file before sending it", async () => {
    const fetchSpy = mockFetch(() => json({ ok: true, url: "x" }));
    const onChange = vi.fn();
    render(<ImageUploader images={[]} onChange={onChange} />);
    fireEvent.change(screen.getByTestId("product-file-input"), { target: { files: [png("big.png", MAX_IMAGE_BYTES + 1)] } });

    expect(await screen.findByText(/vượt quá giới hạn 10MB/)).toBeInTheDocument();
    expect(fetchSpy.mock.calls.some(([, init]) => init?.method === "POST")).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("tells a signed-out user to sign in when the route answers 401", async () => {
    mockFetch(() => json({ ok: false, error: "Unauthorized" }, 401));
    render(<ImageUploader images={[]} onChange={() => {}} />);
    fireEvent.change(screen.getByTestId("product-file-input"), { target: { files: [png()] } });
    expect(await screen.findByText(/Vui lòng đăng nhập để tải ảnh lên/)).toBeInTheDocument();
  });

  it("removes the image", () => {
    mockFetch(() => json({ ok: true }));
    const onChange = vi.fn();
    render(<ImageUploader images={["https://res.cloudinary.com/demo/a.png"]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Gỡ ảnh/ }));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});

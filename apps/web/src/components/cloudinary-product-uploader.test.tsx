import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CloudinaryProductUploader } from "./cloudinary-product-uploader";

describe("CloudinaryProductUploader", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders device picker and camera buttons without exposing Cloudinary branding or requiring URLs", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ok: true,
          configured: true,
          mode: "signed",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    render(<CloudinaryProductUploader images={[]} onChange={() => {}} />);

    expect(
      screen.getByRole("button", { name: /Chọn ảnh từ máy tính/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Chụp ảnh trực tiếp từ Camera/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Chưa có ảnh sản phẩm/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/cloudinary/i)).not.toBeInTheDocument();
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });
  });

  it("shows generic unavailable warning without exposing env/Cloudinary details when upload service is not ready", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ok: true,
          configured: false,
          mode: "none",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    render(<CloudinaryProductUploader images={[]} onChange={() => {}} />);

    await waitFor(() => {
      expect(
        screen.getByText(/Dịch vụ tải ảnh tạm thời chưa sẵn sàng/i),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText(/cloudinary/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\.env\.local/i)).not.toBeInTheDocument();
  });

  it("uploads device-selected image file in the background and adds returned URL without Cloudinary badge", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            configured: true,
            mode: "signed",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            url: "https://res.cloudinary.com/skinsense-demo/image/upload/v123/product.jpg",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    const onChange = vi.fn();
    render(
      <CloudinaryProductUploader
        images={[]}
        onChange={onChange}
        shopName="Sakura Shop"
      />,
    );

    const fileInput = screen.getByTestId("product-file-input");
    const file = new File(["image-bytes"], "kem-duong.jpg", {
      type: "image/jpeg",
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith([
        "https://res.cloudinary.com/skinsense-demo/image/upload/v123/product.jpg",
      ]);
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[1][0]).toBe("/api/upload/cloudinary");
  });

  it("allows setting a secondary image as cover and removing images without showing Cloudinary badge", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ok: true,
          configured: true,
          mode: "signed",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const onChange = vi.fn();
    const img1 =
      "https://res.cloudinary.com/skinsense-demo/image/upload/v1/first.jpg";
    const img2 =
      "https://res.cloudinary.com/skinsense-demo/image/upload/v1/second.jpg";

    render(<CloudinaryProductUploader images={[img1, img2]} onChange={onChange} />);

    expect(screen.queryByText(/cloudinary/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Đặt làm ảnh bìa/i }));
    expect(onChange).toHaveBeenCalledWith([img2, img1]);

    fireEvent.click(screen.getByRole("button", { name: /Xóa ảnh 1/i }));
    expect(onChange).toHaveBeenCalledWith([img2]);
  });
});

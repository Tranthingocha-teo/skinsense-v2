import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SafeProductImage } from "./safe-product-image";

describe("SafeProductImage Component", () => {
  it("renders fallback placeholder when src is missing or empty", () => {
    render(<SafeProductImage src="" alt="Serum B5 La Roche-Posay" />);
    const placeholder = screen.getByRole("img", { name: "Serum B5 La Roche-Posay" });
    expect(placeholder).toBeInTheDocument();
  });

  it("renders img tag when valid src is provided", () => {
    render(
      <SafeProductImage
        src="https://example.com/serum-b5.jpg"
        alt="Serum B5 La Roche-Posay"
      />,
    );
    const img = screen.getByRole("img", { name: "Serum B5 La Roche-Posay" });
    expect(img).toHaveAttribute("src", "https://example.com/serum-b5.jpg");
  });

  it("switches to graceful placeholder when img throws an error", () => {
    render(
      <SafeProductImage
        src="https://broken-link.invalid/broken.jpg"
        alt="Kem chống nắng Anessa"
      />,
    );
    const img = screen.getByRole("img", { name: "Kem chống nắng Anessa" });
    fireEvent.error(img);

    // After error, container with role="img" and aria-label should still exist
    const fallback = screen.getByRole("img", { name: "Kem chống nắng Anessa" });
    expect(fallback.tagName.toLowerCase()).toBe("div");
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InitialsAvatar } from "./initials-avatar";
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

  it("draws the product instead of hotlinking a stock photo", () => {
    const { container } = render(
      <SafeProductImage src="https://images.unsplash.com/photo-1?w=600" alt="Cicaplast Baume B5+" brand="La Roche-Posay" category="Kem dưỡng" />,
    );
    const art = screen.getByRole("img", { name: "Cicaplast Baume B5+" });
    expect(art.tagName.toLowerCase()).toBe("div");
    expect(container.querySelector("img")).toBeNull();
    expect(art.textContent).toContain("LR");
  });
});

describe("InitialsAvatar", () => {
  it("shows initials when the account has no picture of its own", () => {
    render(<InitialsAvatar name="Trần Thị Ngọc Hà" src="https://images.unsplash.com/photo-2" label="Trần Thị Ngọc Hà" />);
    expect(screen.getByRole("img", { name: "Trần Thị Ngọc Hà" }).textContent).toBe("TH");
  });

  it("keeps the account's own upload", () => {
    const { container } = render(<InitialsAvatar name="Hà" src="https://res.cloudinary.com/x/image/upload/a.jpg" />);
    expect(container.querySelector("img")?.getAttribute("src")).toBe("https://res.cloudinary.com/x/image/upload/a.jpg");
  });
});

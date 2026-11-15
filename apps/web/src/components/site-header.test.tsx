import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CanvasIcon, LogoMark, SiteHeader } from "./site-header";

describe("SiteHeader & LogoMark Components", () => {
  it("renders LogoMark with svg geometry", () => {
    const { container } = render(<LogoMark className="test-logo" draw />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass("test-logo");
    expect(container.querySelector(".mark-draw")).toBeInTheDocument();
  });

  it("renders CanvasIcon with designated size and path", () => {
    const { container } = render(<CanvasIcon name="download" size={24} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "24");
    expect(svg).toHaveAttribute("height", "24");
  });

  it("renders SiteHeader with accessible home link, nav slot, and children", () => {
    render(
      <SiteHeader
        nav={<nav data-testid="test-nav">Navigation Links</nav>}
        drawMark
      >
        <button type="button">Account Action</button>
      </SiteHeader>,
    );

    const homeLink = screen.getByRole("link", { name: "SkinSense Home" });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute("href", "/");
    expect(screen.getByText("SKINSENSE")).toBeInTheDocument();
    expect(screen.getByTestId("test-nav")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Account Action" })).toBeInTheDocument();
  });
});

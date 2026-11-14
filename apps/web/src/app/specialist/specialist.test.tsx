import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import SpecialistPage from "./page";

describe("Specialist Portal Stats Interactive Filtering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        authenticated: true,
        user: { fullName: "BS. CKI Nguyễn Mai Hoa", licenseId: "CCHN-008812/BYT" },
      }),
    } as Response);
  });

  it("renders the 3 interactive stat filter buttons with proper a11y attributes", () => {
    render(<SpecialistPage />);
    const allTab = screen.getByRole("tab", { name: /Lọc tất cả bệnh án tiếp nhận/i });
    const pendingTab = screen.getByRole("tab", { name: /Lọc bệnh án chờ xuất phác đồ/i });
    const treatmentTab = screen.getByRole("tab", { name: /Lọc bệnh nhân đang áp dụng liệu trình/i });

    expect(allTab).toBeInTheDocument();
    expect(pendingTab).toBeInTheDocument();
    expect(treatmentTab).toBeInTheDocument();

    expect(allTab).toHaveAttribute("aria-selected", "true");
    expect(pendingTab).toHaveAttribute("aria-selected", "false");
    expect(treatmentTab).toHaveAttribute("aria-selected", "false");
  });

  it("switches active tab and updates aria-selected when clicked", () => {
    render(<SpecialistPage />);
    const pendingTab = screen.getByRole("tab", { name: /Lọc bệnh án chờ xuất phác đồ/i });
    fireEvent.click(pendingTab);

    expect(pendingTab).toHaveAttribute("aria-selected", "true");
    const allTab = screen.getByRole("tab", { name: /Lọc tất cả bệnh án tiếp nhận/i });
    expect(allTab).toHaveAttribute("aria-selected", "false");
  });
});

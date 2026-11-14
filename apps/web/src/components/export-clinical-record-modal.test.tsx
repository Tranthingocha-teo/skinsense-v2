import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ExportClinicalRecordModal } from "./export-clinical-record-modal";

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("ExportClinicalRecordModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <ExportClinicalRecordModal isOpen={false} onClose={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders form fields when open and submits to API", async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        caseCode: "BA-2026-9999",
        message: "Đã lưu hồ sơ bệnh án thành công vào Supabase.",
      }),
    } as Response);

    render(
      <ExportClinicalRecordModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    );

    expect(screen.getByText(/Xuất Bệnh Án Soi Da AI Gửi Bác Sĩ Chuyên Khoa/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Trần Thị Ngọc Hà")).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", {
      name: /Xuất & Gửi Bệnh Án Tới Bác Sĩ/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/patient/clinical-records",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );
      expect(onSuccess).toHaveBeenCalledWith("BA-2026-9999");
    });
  });
});

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import SpecialistPage, { INITIAL_PATIENT_CASES } from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

function mockApi(casesResponse: { status: number; body: unknown }) {
  global.fetch = vi.fn().mockImplementation((url: string) => {
    if (String(url).startsWith("/api/specialist/cases")) {
      return Promise.resolve({
        ok: casesResponse.status < 400,
        status: casesResponse.status,
        json: async () => casesResponse.body,
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({
        authenticated: true,
        user: { fullName: "BS. CKI Nguyễn Mai Hoa", licenseId: "CCHN-008812/BYT" },
      }),
    } as Response);
  });
}

describe("Specialist Portal Stats Interactive Filtering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi({ status: 200, body: { ok: true, cases: INITIAL_PATIENT_CASES } });
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

  it("opens patient case detail modal and displays clinical allergy and Fitzpatrick info", async () => {
    render(<SpecialistPage />);
    const detailButtons = await screen.findAllByRole("button", { name: /Xem Bệnh án/i });
    expect(detailButtons.length).toBeGreaterThan(0);

    fireEvent.click(detailButtons[0]);
    expect(screen.getByText(/Bệnh án Da liễu:/i)).toBeInTheDocument();
    expect(screen.getByText(/Phân loại Fitzpatrick:/i)).toBeInTheDocument();

    const closeButton = screen.getByRole("button", { name: "Đóng" });
    fireEvent.click(closeButton);
    expect(screen.queryByText(/Bệnh án Da liễu:/i)).not.toBeInTheDocument();
  });

  it("displays empty state in prescribe modal when prescribing for a pending case with no routine", async () => {
    render(<SpecialistPage />);
    const prescribeButtons = await screen.findAllByRole("button", { name: /Chọn hồ sơ để xuất/i });
    expect(prescribeButtons.length).toBeGreaterThan(0);

    fireEvent.click(prescribeButtons[0]);
    expect(screen.getByText(/Chưa có sản phẩm nào trong phác đồ/i)).toBeInTheDocument();

    const cancelButton = screen.getByRole("button", { name: "Hủy" });
    fireEvent.click(cancelButton);
  });
});

describe("Specialist Portal access", () => {
  it("shows no sample patients when the account has no cases", async () => {
    mockApi({ status: 200, body: { ok: true, cases: [] } });
    render(<SpecialistPage />);
    expect(await screen.findByText(/Không tìm thấy bệnh án phù hợp/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Xem Bệnh án/i })).not.toBeInTheDocument();
  });

  it("asks a signed-out visitor to sign in instead of showing cases", async () => {
    mockApi({ status: 401, body: { ok: false } });
    render(<SpecialistPage />);
    expect(await screen.findByText(/Vui lòng đăng nhập bằng tài khoản Bác sĩ/i)).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Lọc tất cả bệnh án tiếp nhận/i })).not.toBeInTheDocument();
  });

  it("tells a non-specialist account it has no access", async () => {
    mockApi({ status: 403, body: { ok: false } });
    render(<SpecialistPage />);
    expect(await screen.findByText(/chưa được cấp quyền Bác sĩ/i)).toBeInTheDocument();
  });

  it("shows pending approval details and application button when a doctor status is pending", async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (String(url).startsWith("/api/specialist/cases")) {
        return Promise.resolve({ ok: false, status: 403, json: async () => ({ ok: false }) } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          authenticated: true,
          user: {
            fullName: "BS. Trần Quốc Tuấn",
            role: "specialist",
            status: "pending",
            licenseId: "CCHN-008812/BYT",
            hospital: "BV Da Liễu",
          },
        }),
      } as Response);
    });
    render(<SpecialistPage />);
    expect(await screen.findByText(/Hồ sơ Bác sĩ đang chờ Super Admin duyệt/i)).toBeInTheDocument();
    expect(screen.getByText(/CCHN-008812\/BYT/)).toBeInTheDocument();
  });
});

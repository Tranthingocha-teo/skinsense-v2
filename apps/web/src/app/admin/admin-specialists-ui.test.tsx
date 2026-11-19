import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminDashboardPage from "./page";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const MOCK_USERS = [
  {
    id: "doc-pending-1",
    name: "BS. Trần Quốc Tuấn",
    email: "bs.tuan@gmail.com",
    phone: "0918222333",
    role: "specialist",
    status: "pending",
    createdAt: "2026-11-10",
    submittedAt: "2026-11-19T07:30:00Z",
    specialistDetails: {
      licenseId: "CCHN-008812/BYT",
      hospital: "Bệnh viện Da Liễu Trung Ương",
      specialty: "Da liễu & Điều trị mụn",
    },
  },
  {
    id: "doc-active-1",
    name: "BS. Nguyễn Mai Hoa",
    email: "bacsi.hoa@skinsense.vn",
    phone: "0905123456",
    role: "specialist",
    status: "active",
    createdAt: "2026-11-14",
    specialistDetails: {
      licenseId: "014289/BYT-CCHN",
      hospital: "Bệnh viện Da Liễu Trung Ương",
      specialty: "Da liễu",
    },
  },
];

describe("Admin Dashboard Doctor Approval Visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockImplementation(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.startsWith("/api/admin/users")) {
        return { ok: true, status: 200, json: async () => ({ ok: true, users: MOCK_USERS }) } as Response;
      }
      if (url.startsWith("/api/admin/products")) {
        return { ok: true, status: 200, json: async () => ({ ok: true, products: [] }) } as Response;
      }
      if (url.startsWith("/api/admin/orders")) {
        return { ok: true, status: 200, json: async () => ({ ok: true, orders: [] }) } as Response;
      }
      if (url.startsWith("/api/admin/routines")) {
        return { ok: true, status: 200, json: async () => ({ ok: true, routines: {} }) } as Response;
      }
      return { ok: true, status: 200, json: async () => ({ ok: true }) } as Response;
    });
  });

  it("surfaces pending doctor counts across the default tab, Cần duyệt filter, and Duyệt Bác sĩ Da liễu", async () => {
    render(<AdminDashboardPage />);

    // Default tab ("Phân quyền 4 Role") must include pending specialists in Cần duyệt (1), not Cần duyệt (0).
    expect(await screen.findByRole("button", { name: /Cần duyệt \(1\)/i })).toBeInTheDocument();
    expect(screen.getByText(/1 chờ duyệt/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Duyệt Bác sĩ ngay/i })).toBeInTheDocument();

    // Pending doctor row in default users tab shows CCHN and both Approve / Reject actions.
    const userRow = screen.getByRole("row", { name: /bs\.tuan@gmail\.com/i });
    expect(within(userRow).getByText(/CCHN-008812\/BYT/)).toBeInTheDocument();
    expect(within(userRow).getByRole("button", { name: /Duyệt Bác sĩ/i })).toBeInTheDocument();
    expect(within(userRow).getByRole("button", { name: /Từ chối/i })).toBeInTheDocument();

    // Switching to "Duyệt Bác sĩ Da liễu" refreshes /api/admin/users and lists the pending doctor first.
    const userFetchesBefore = vi.mocked(global.fetch).mock.calls.filter(([u]) => String(u).startsWith("/api/admin/users")).length;
    fireEvent.click(screen.getByRole("button", { name: /Duyệt Bác sĩ Da liễu/i }));
    await waitFor(() => {
      const userFetchesAfter = vi.mocked(global.fetch).mock.calls.filter(([u]) => String(u).startsWith("/api/admin/users")).length;
      expect(userFetchesAfter).toBeGreaterThan(userFetchesBefore);
    });

    const specialistRows = screen.getAllByRole("row").slice(1);
    expect(specialistRows[0]).toHaveTextContent("bs.tuan@gmail.com");
    expect(within(specialistRows[0]).getByRole("button", { name: /Phê duyệt/i })).toBeInTheDocument();
  });
});

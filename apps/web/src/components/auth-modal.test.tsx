import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthModal } from "./auth-modal";

const push = vi.fn();
const refresh = vi.fn();
const signInWithPassword = vi.fn();
const signOut = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword,
      signOut,
      signInWithOAuth: vi.fn(async () => ({ data: { url: "https://accounts.google.com/o/oauth2/auth" }, error: null })),
    },
  }),
}));

describe("AuthModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/");
    signInWithPassword.mockResolvedValue({ data: { user: { id: "u1", email: "hattn.23itb@vku.udn.vn" } }, error: null });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ authenticated: false, role: "guest" }),
    } as Response);
  });

  it("renders the dialog in document.body, outside a sticky blurred header, and closes with X or Esc", async () => {
    // A backdrop-blur header makes fixed children position against the header, not the screen.
    const { container } = render(
      <header className="sticky top-0 backdrop-blur-md">
        <AuthModal defaultTab="sign-in" triggerLabel="Mở đăng nhập" />
      </header>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Mở đăng nhập" }));

    const dialog = screen.getByRole("dialog");
    expect(container.contains(dialog)).toBe(false);
    expect(document.body.contains(dialog)).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Đóng" }));
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Mở đăng nhập" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("authenticates Super Admin via Supabase Auth instead of bypassing signInWithPassword", async () => {
    signInWithPassword.mockResolvedValueOnce({ data: { user: null }, error: { message: "Invalid login credentials" } });
    render(<AuthModal defaultTab="sign-in" triggerLabel="Mở đăng nhập" />);
    fireEvent.click(screen.getByRole("button", { name: "Mở đăng nhập" }));

    fireEvent.change(screen.getByPlaceholderText("nhap-email-cua-ban@gmail.com"), {
      target: { value: "hattn.23itb@vku.udn.vn" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "wrong-pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập ngay" }));

    await waitFor(() => {
      expect(signInWithPassword).toHaveBeenCalledWith({
        email: "hattn.23itb@vku.udn.vn",
        password: "wrong-pass",
      });
    });
    expect(push).not.toHaveBeenCalledWith("/admin");
    expect(await screen.findByRole("alert")).toHaveTextContent(/Email hoặc mật khẩu không chính xác/);
  });

  it("lets a signed-in Google user submit a doctor application without entering a password", async () => {
    global.fetch = vi.fn().mockImplementation(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.startsWith("/api/auth/me")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            authenticated: true,
            user: { id: "g1", email: "signedin.doc@gmail.com", fullName: "BS. Minh Anh", role: "customer", status: "active" },
          }),
        } as Response;
      }
      if (url.startsWith("/api/auth/register")) {
        return { ok: true, status: 200, json: async () => ({ ok: true, status: "pending" }) } as Response;
      }
      return { ok: true, status: 200, json: async () => ({ ok: true }) } as Response;
    });

    render(<AuthModal defaultTab="doctor-approval" triggerLabel="Nộp hồ sơ BS" />);
    fireEvent.click(screen.getByRole("button", { name: "Nộp hồ sơ BS" }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("bacsi.tuan@gmail.com")).toHaveValue("signedin.doc@gmail.com");
    });
    expect(screen.queryByPlaceholderText("••••••••")).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("CCHN-008812/BYT"), { target: { value: "CCHN-123456" } });
    fireEvent.change(screen.getByPlaceholderText("Bệnh viện Da Liễu Trung Ương"), { target: { value: "BV Da Liễu" } });
    fireEvent.change(screen.getByPlaceholderText("0918 222 333"), { target: { value: "0912345678" } });
    fireEvent.click(screen.getByRole("button", { name: "Gửi yêu cầu duyệt Bác sĩ" }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/Hồ sơ Bác sĩ đã được gửi thành công/);
    });
    const registerCall = vi.mocked(global.fetch).mock.calls.find(([u]) => String(u).startsWith("/api/auth/register"));
    expect(registerCall).toBeTruthy();
    const sentBody = JSON.parse(String(registerCall![1]?.body));
    expect(sentBody.email).toBe("signedin.doc@gmail.com");
    expect(sentBody.password).toBeUndefined();
  });

  it("offers 1-click Google login back to doctor application when 409 existing email happens while signed out", async () => {
    global.fetch = vi.fn().mockImplementation(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.startsWith("/api/auth/me")) {
        return { ok: true, status: 200, json: async () => ({ authenticated: false, role: "guest" }) } as Response;
      }
      if (url.startsWith("/api/auth/register")) {
        return {
          ok: false,
          status: 409,
          json: async () => ({ error: "Email đã được đăng ký. Vui lòng đăng nhập bằng email này rồi gửi lại hồ sơ." }),
        } as Response;
      }
      return { ok: true, status: 200, json: async () => ({ ok: true }) } as Response;
    });

    render(<AuthModal defaultTab="doctor-approval" triggerLabel="Nộp hồ sơ BS" />);
    fireEvent.click(screen.getByRole("button", { name: "Nộp hồ sơ BS" }));

    fireEvent.change(screen.getByPlaceholderText("ThS. BS Trần Quốc Tuấn"), { target: { value: "BS. Hà" } });
    fireEvent.change(screen.getByPlaceholderText("CCHN-008812/BYT"), { target: { value: "CCHN-123" } });
    fireEvent.change(screen.getByPlaceholderText("Bệnh viện Da Liễu Trung Ương"), { target: { value: "BV Bạch Mai" } });
    fireEvent.change(screen.getByPlaceholderText("bacsi.tuan@gmail.com"), { target: { value: "existing@gmail.com" } });
    fireEvent.change(screen.getByPlaceholderText("0918 222 333"), { target: { value: "0912345678" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "Password123!" } });
    fireEvent.click(screen.getByRole("button", { name: "Gửi yêu cầu duyệt Bác sĩ" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Email đã được đăng ký/);
    expect(screen.getByRole("button", { name: /Đăng nhập bằng Gmail để tiếp tục nộp hồ sơ/i })).toBeInTheDocument();
  });
});

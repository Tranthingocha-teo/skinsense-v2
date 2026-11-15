import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import { AuthErrorNotice } from "./auth-error-notice";

let params = new URLSearchParams();
vi.mock("next/navigation", () => ({ useSearchParams: () => params }));

const renderNotice = () =>
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <AuthErrorNotice />
    </NextIntlClientProvider>,
  );

describe("AuthErrorNotice", () => {
  it("tells the visitor a failed sign-in didn't complete", () => {
    params = new URLSearchParams("auth_error=exchange_failed");
    renderNotice();
    expect(screen.getByRole("alert")).toHaveTextContent(en.Landing.authErrorTitle);
  });

  it("renders nothing on a normal visit", () => {
    params = new URLSearchParams();
    renderNotice();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import { GoogleSignIn } from "./google-sign-in";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

describe("GoogleSignIn", () => {
  it("renders the container Google mounts its button into", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <GoogleSignIn locale="en" />
      </NextIntlClientProvider>,
    );
    expect(screen.getByTestId("google-button")).toBeInTheDocument();
  });
});

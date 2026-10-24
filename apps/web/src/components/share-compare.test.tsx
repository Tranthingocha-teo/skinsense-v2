import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import { ShareCompare } from "./share-compare";
import messages from "../../messages/en.json";

describe("ShareCompare", () => {
  it("renders the share button and opens dialog", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ShareCompare
          beforeUrl="/demo-photos/before.svg"
          afterUrl="/demo-photos/after.svg"
          beforeDate="2026-10-01"
          afterDate="2026-10-24"
          rednessValue={0.35}
        />
      </NextIntlClientProvider>
    );

    const button = screen.getByRole("button", { name: /share/i });
    expect(button).toBeDefined();

    fireEvent.click(button);
    expect(screen.getByText(/Chia sẻ ảnh trước \/ sau/i)).toBeDefined();
    expect(screen.getByText(/Tải ảnh về máy/i)).toBeDefined();
  });
});

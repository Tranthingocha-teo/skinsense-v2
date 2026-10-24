import { act, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi as vitest } from "vitest";
import vi from "../../messages/vi.json";
import { Landing } from "./landing";

vitest.mock("next/navigation", () => ({ useRouter: () => ({ push: vitest.fn(), refresh: vitest.fn() }) }));
// The GSAP/Lenis chunk is a post-hydration add-on; jsdom has no layout to scrub.
vitest.mock("./stage/stage-motion-loader", () => ({ StageMotion: () => null }));
// next/script reports the GIS script ready on re-renders; the button itself is not under test.
vitest.stubGlobal("google", { accounts: { id: { initialize() {}, renderButton() {} } } });
vitest.stubEnv("NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID", "test-client-id");

function renderLanding() {
  return render(
    <NextIntlClientProvider locale="vi" messages={vi}>
      <Landing />
    </NextIntlClientProvider>,
  );
}

describe("Landing", () => {
  it("offers Google sign-in and Xem thử in the hero", () => {
    renderLanding();
    expect(screen.getByTestId("google-button")).toBeInTheDocument();
    const demo = screen.getAllByRole("link", { name: "Xem thử, không cần đăng nhập" });
    expect(demo[0]).toHaveAttribute("href", "/demo");
  });

  it("renders the three stage scenes and the data cards' final values before any motion loads", () => {
    const { container } = renderLanding();
    const steps = container.querySelectorAll(".stage-steps li");
    expect([...steps].map((li) => li.textContent)).toEqual(["01 " + vi.Landing.sceneCapture, "02 " + vi.Landing.sceneMark, "03 " + vi.Landing.sceneTrend]);
    expect(screen.getByText("3.1")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText(vi.Landing.cardStreak)).toBeInTheDocument();
  });

  it("loads the real Hôm nay into the stage phone once the phone nears the viewport", () => {
    type Callback = (entries: { isIntersecting: boolean }[]) => void;
    const observed: [Element, Callback][] = [];
    vitest.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(private cb: Callback) {}
        observe(el: Element) {
          observed.push([el, this.cb]);
        }
        disconnect() {}
      },
    );
    const { container } = renderLanding();
    const phone = container.querySelector(".stage-phone")!;
    expect(phone.querySelector("iframe")).not.toBeInTheDocument();
    act(() => observed.filter(([el]) => phone.contains(el)).forEach(([, cb]) => cb([{ isIntersecting: true }])));
    expect(phone.querySelector("iframe")).toHaveAttribute("src", "/stage");
    delete (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;
  });

  it("keeps the dotted face placeholder in Cách hoạt động until three.js is near the viewport", () => {
    const { container } = renderLanding();
    expect(container.querySelector("#how svg ellipse")).toBeInTheDocument();
    expect(container.querySelector("#how canvas")).not.toBeInTheDocument();
  });

  it("expands a FAQ item on click", () => {
    renderLanding();
    const { q, a } = vi.Landing.faq[1];
    expect(screen.queryByText(a)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: q }));
    expect(screen.getByText(a)).toBeInTheDocument();
  });
});

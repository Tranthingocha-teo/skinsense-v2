import { describe, expect, it } from "vitest";
import { isPatientAliasOfHa, filterProductsByTimeOfDay } from "./prescription-sync";

describe("prescription-sync helpers", () => {
  it("correctly identifies patient aliases for Trần Thị Ngọc Hà", () => {
    expect(isPatientAliasOfHa({ email: "hattn.23itb@vku.udn.vn" })).toBe(true);
    expect(isPatientAliasOfHa({ email: "trandinhhai0936039127@gmail.com" })).toBe(true);
    expect(isPatientAliasOfHa({ userId: "365d9ffb-0ee5-41d2-879c-37ef337fe262" })).toBe(true);
    expect(isPatientAliasOfHa({ name: "Trần Thị Ngọc Hà" })).toBe(true);
    expect(isPatientAliasOfHa({ email: "random.user@gmail.com", name: "Nguyễn Văn B" })).toBe(false);
  });

  it("filters products by morning and evening appropriately", () => {
    const products = [
      { id: "1", stepTime: "morning" },
      { id: "2", stepTime: "evening" },
      { id: "3", stepTime: "both" },
      { id: "4" },
    ];

    const morning = filterProductsByTimeOfDay(products, "morning");
    expect(morning.map((p) => p.id)).toEqual(["1", "3", "4"]);

    const evening = filterProductsByTimeOfDay(products, "evening");
    expect(evening.map((p) => p.id)).toEqual(["2", "3", "4"]);
  });
});

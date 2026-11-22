import { describe, expect, it } from "vitest";
import {
  detectActiveConflicts,
  extractProductActives,
  inferRoutineStepCategory,
  inferUsageSlot,
} from "./routine-builder";

describe("shared routine-builder", () => {
  it("supports array keyActives and string actives", () => {
    expect(extractProductActives(["Niacinamide 10%", "Zinc PCA (1%)"], "Serum")).toEqual([
      "Niacinamide 10%",
      "Zinc PCA",
    ]);
    expect(extractProductActives("Salicylic Acid, LHA", "Duo+M")).toEqual(["Salicylic Acid", "LHA"]);
  });

  it("detects Retinol + BHA conflicts from mobile keyActives arrays", () => {
    const warnings = detectActiveConflicts([
      { id: "a", name: "Night Retinol Cream", keyActives: ["Retinol 0.3%"] },
      { id: "b", name: "Pore BHA Gel", keyActives: ["Salicylic Acid 2%"] },
    ]);
    expect(warnings.some((w) => w.id === "retinoid-exfoliant")).toBe(true);
  });

  it("infers AM/PM slots and clinical routine categories", () => {
    expect(inferUsageSlot({ name: "Anthelios SPF50+", category: "Chống nắng" })).toBe("AM");
    expect(inferRoutineStepCategory({ name: "Gel Rửa Mặt Dịu Nhẹ", category: "Làm sạch" })).toBe("Cleanser");
  });
});

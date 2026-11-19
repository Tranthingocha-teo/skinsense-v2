import { describe, expect, it } from "vitest";
import {
  detectActiveConflicts,
  extractProductActives,
  inferRoutineStepCategory,
  inferUsageSlot,
} from "./routine-builder";

describe("extractProductActives", () => {
  it("parses comma-separated clinical actives and skips placeholder labels", () => {
    expect(
      extractProductActives(
        "Phylobioma, Niacinamide, Procerad, LHA, Salicylic Acid, Zinc PCA",
        "Effaclar Duo+M",
      ),
    ).toEqual(["Phylobioma", "Niacinamide", "Procerad", "LHA"]);

    expect(extractProductActives("Chưa cập nhật", "Serum Phục Hồi Hyalu B5")).toEqual([
      "Hyaluronic Acid",
      "Panthenol B5",
    ]);
  });

  it("extracts key actives without duplicates when mixed case appears", () => {
    expect(
      extractProductActives("Niacinamide, niacinamide, Ceramide NP", "Kem dưỡng"),
    ).toEqual(["Niacinamide", "Ceramide NP"]);
  });
});

describe("inferUsageSlot", () => {
  it("marks sunscreen as morning (AM) and retinol/micellar products as evening (PM)", () => {
    expect(
      inferUsageSlot({
        name: "Kem Chống Nắng Anthelios UVmune 400",
        category: "Chống nắng",
        howToUse: "Thoa trước khi ra nắng 15 phút",
      }),
    ).toBe("AM");

    expect(
      inferUsageSlot({
        name: "Tinh chất Retinol 0.3% tái tạo da ban đêm",
        category: "Serum",
        howToUse: "Thoa vào buổi tối 2-3 lần/tuần",
      }),
    ).toBe("PM");

    expect(
      inferUsageSlot({
        name: "Sữa Rửa Mặt Dưỡng Ẩm CeraVe Hydrating Cleanser",
        category: "Sữa rửa mặt",
        howToUse: "Dùng sáng và tối mỗi ngày",
      }),
    ).toBe("AM/PM");
  });
});

describe("inferRoutineStepCategory", () => {
  it("maps product names and categories into clean 4-step clinical taxonomy", () => {
    expect(inferRoutineStepCategory({ name: "Nước Tẩy Trang Bioderma", category: "Làm sạch" })).toBe("Cleanser");
    expect(inferRoutineStepCategory({ name: "Serum BHA + Niacinamide", category: "Tinh chất" })).toBe("Treatment");
    expect(inferRoutineStepCategory({ name: "Kem Dưỡng Ẩm B5 Cicaplast", category: "Kem dưỡng" })).toBe("Moisturizer");
    expect(inferRoutineStepCategory({ name: "Sữa Chống Nắng SPF50+", category: "Bảo vệ" })).toBe("Sunscreen");
  });
});

describe("detectActiveConflicts", () => {
  it("flags Retinol paired with BHA/Salicylic Acid or Vitamin C", () => {
    const conflicts = detectActiveConflicts([
      {
        id: "p1",
        name: "Retinol 0.5% Serum",
        specifications: { actives: "Retinol, Squalane" },
      },
      {
        id: "p2",
        name: "Effaclar Duo+M",
        specifications: { actives: "Niacinamide, LHA, Salicylic Acid" },
      },
    ]);

    expect(conflicts.length).toBeGreaterThanOrEqual(1);
    expect(conflicts[0]?.title).toMatch(/Retinol/i);
    expect(conflicts[0]?.products).toEqual(["Retinol 0.5% Serum", "Effaclar Duo+M"]);
  });

  it("returns no conflicts when barrier-safe products are paired", () => {
    const conflicts = detectActiveConflicts([
      {
        id: "p1",
        name: "CeraVe Hydrating Cleanser",
        specifications: { actives: "3 Ceramides thiết yếu, Hyaluronic Acid" },
      },
      {
        id: "p2",
        name: "La Roche-Posay Hyalu B5 Serum",
        specifications: { actives: "Hyaluronic Acid, Vitamin B5, Madecassoside" },
      },
    ]);

    expect(conflicts).toEqual([]);
  });
});

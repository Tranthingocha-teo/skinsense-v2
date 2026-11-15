import { describe, expect, it } from "vitest";
import { prescribedRoutineFromCases } from "./prescribed-routine";

describe("prescribedRoutineFromCases", () => {
  it("is null until a specialist prescribes (no built-in sample prescription)", () => {
    expect(prescribedRoutineFromCases([])).toBeNull();
    expect(prescribedRoutineFromCases([{ id: "c1", patientName: "A" }])).toBeNull();
  });

  it("shows the newest prescription with its doctor, products and real counts", () => {
    const routine = prescribedRoutineFromCases(
      [
        { id: "old", currentRoutine: { routineTitle: "Old", prescribedAt: "2026-11-01T00:00:00Z", products: [{ name: "X" }] } },
        {
          id: "new",
          patientName: "Nguyễn Văn A",
          severity: "severe",
          aiAnalysis: { rednessIndex: 61.4 },
          currentRoutine: {
            routineTitle: "Phác đồ mới",
            prescribedBy: "BS. Test",
            prescribedAt: "2026-11-10T00:00:00Z",
            revisitDate: "2026-11-24",
            doctorNotes: "Uống đủ nước",
            products: [
              { name: "Sữa rửa mặt", stepTime: "morning" },
              { name: "Kem dưỡng", stepTime: "both" },
            ],
          },
        },
      ],
      [{ id: "sp_01", name: "Kem dưỡng", priceVnd: 300000, originalPriceVnd: 400000 }],
    );
    expect(routine).toMatchObject({
      planTitle: "Phác đồ mới",
      patientName: "Nguyễn Văn A",
      severity: "Nặng",
      rednessScore: 61,
      revisitDate: "24/11/2026",
      doctorInstructions: ["Uống đủ nước"],
      doctor: { name: "BS. Test" },
    });
    expect(routine!.products.map((p) => [p.name, p.timing, p.priceVnd, p.productId])).toEqual([
      ["Sữa rửa mặt", "morning", 0, ""],
      ["Kem dưỡng", "both", 300000, "sp_01"],
    ]);
  });
});

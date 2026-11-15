import type { PrescribedRoutineData, RoutineProduct } from "@/components/user-prescribed-routine";

/** A clinical case as stored in clinical_records/cases_registry.json (the fields read here). */
export interface ClinicalCaseRecord {
  id?: string;
  patientName?: string;
  severity?: string;
  symptoms?: string;
  createdAt?: string;
  aiAnalysis?: { rednessIndex?: number };
  currentRoutine?: {
    routineTitle?: string;
    startDate?: string;
    revisitDate?: string;
    doctorNotes?: string;
    prescribedBy?: string;
    prescribedAt?: string;
    products?: Array<{
      id?: string;
      name?: string;
      brand?: string;
      category?: string;
      imageUrl?: string;
      activeIngredients?: string;
      stepTime?: string;
      stepNumber?: number;
      dosage?: string;
      usageGuide?: string;
    }>;
  };
}

export interface CatalogProduct {
  id: string;
  name: string;
  priceVnd: number;
  originalPriceVnd: number;
}

const SEVERITY: Record<string, PrescribedRoutineData["severity"]> = { mild: "Nhẹ", moderate: "Vừa", severe: "Nặng" };
const TIMING_LABEL: Record<RoutineProduct["timing"], string> = {
  morning: "Buổi sáng",
  evening: "Buổi tối",
  both: "Sáng & Tối",
};

function formatDate(iso?: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

/**
 * The routine a specialist really prescribed for this patient, newest case first, or null when no
 * specialist has prescribed one yet. /user/routine used to always render a built-in sample
 * prescription (a named doctor, four products, prices) for every account.
 * Prices come from the shop catalog when the product is sold there; otherwise they are 0 (not shown).
 */
export function prescribedRoutineFromCases(
  cases: ClinicalCaseRecord[],
  catalog: CatalogProduct[] = [],
): PrescribedRoutineData | null {
  const prescribed = cases
    .filter((c) => (c.currentRoutine?.products?.length ?? 0) > 0)
    .sort((a, b) =>
      String(b.currentRoutine?.prescribedAt ?? b.createdAt ?? "").localeCompare(
        String(a.currentRoutine?.prescribedAt ?? a.createdAt ?? ""),
      ),
    );
  const latest = prescribed[0];
  if (!latest?.currentRoutine) return null;
  const routine = latest.currentRoutine;

  const products: RoutineProduct[] = (routine.products ?? []).map((p, idx) => {
    const name = p.name?.trim() || `Sản phẩm ${idx + 1}`;
    const timing: RoutineProduct["timing"] =
      p.stepTime === "morning" || p.stepTime === "evening" ? p.stepTime : "both";
    const sold = catalog.find((c) => c.name.toLowerCase() === name.toLowerCase());
    const priceVnd = sold?.priceVnd ?? 0;
    const originalPriceVnd = sold?.originalPriceVnd ?? priceVnd;
    return {
      id: p.id || `prescribed-${idx}`,
      stepNumber: p.stepNumber || idx + 1,
      stepName: `Bước ${p.stepNumber || idx + 1} • ${p.category || "Theo chỉ định"}`,
      targetGoal: p.dosage || "Theo chỉ định của bác sĩ",
      timing,
      timingLabel: TIMING_LABEL[timing],
      name,
      brand: p.brand || "",
      volume: "",
      image: p.imageUrl || "",
      actives: p.activeIngredients || "",
      usageGuide: p.usageGuide || "",
      priceVnd,
      originalPriceVnd,
      discountPercent:
        originalPriceVnd > priceVnd && priceVnd > 0 ? Math.round((1 - priceVnd / originalPriceVnd) * 100) : 0,
      productId: sold?.id ?? "",
    };
  });

  const doctorName = routine.prescribedBy?.trim() || "Bác sĩ chuyên khoa";
  return {
    patientName: latest.patientName || "",
    diagnosisShort: routine.routineTitle || "Phác đồ điều trị",
    diagnosisDetails: latest.symptoms || "",
    severity: SEVERITY[latest.severity ?? ""] ?? "Vừa",
    rednessScore: Math.round(latest.aiAnalysis?.rednessIndex ?? 0),
    planTitle: routine.routineTitle || "Phác đồ điều trị",
    durationDays: 14,
    prescribedDate: formatDate(routine.prescribedAt ?? routine.startDate),
    revisitDate: formatDate(routine.revisitDate),
    doctorInstructions: routine.doctorNotes ? [routine.doctorNotes] : [],
    doctor: { name: doctorName, title: "Bác sĩ Da liễu", avatar: "", hospital: "", licenseNumber: "" },
    products,
  };
}

/**
 * Shared prescription synchronization helper for patient clinical accounts.
 * Enables automatic mapping between personal Google accounts and VKU school emails.
 */

export interface PatientUserIdentity {
  userId?: string;
  email?: string;
  name?: string;
}

export function isPatientAliasOfHa(identity: PatientUserIdentity): boolean {
  const email = (identity.email || "").trim().toLowerCase();
  const userId = identity.userId || "";
  const name = (identity.name || "").toLowerCase();

  return (
    email === "trandinhhai0936039127@gmail.com" ||
    email === "hattn.23itb@vku.udn.vn" ||
    email === "khachhang@gmail.com" ||
    userId === "365d9ffb-0ee5-41d2-879c-37ef337fe262" ||
    userId === "614ef0f9-1b4d-48f7-aa3e-29a8bd0b8c33" ||
    name.includes("ngọc hà") ||
    name.includes("ngoc ha")
  );
}

export function filterProductsByTimeOfDay<T extends { stepTime?: string }>(
  products: T[],
  timeOfDay: "morning" | "evening",
): T[] {
  return products.filter(
    (p) => !p.stepTime || p.stepTime === "both" || p.stepTime === timeOfDay,
  );
}

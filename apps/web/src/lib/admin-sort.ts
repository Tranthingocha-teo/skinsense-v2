const STATUS_SORT_RANK: Record<string, number> = {
  pending: 0,
  rejected: 1,
  active: 2,
  suspended: 3,
};

/** Keeps pending applications at the top, ordered by newest submission or account creation first. */
export function sortAdminRecords<T extends { status: string; submittedAt?: string; createdAt?: string }>(rows: readonly T[]): T[] {
  return [...rows].sort((a, b) => {
    const rankDiff = (STATUS_SORT_RANK[a.status] ?? 9) - (STATUS_SORT_RANK[b.status] ?? 9);
    if (rankDiff !== 0) return rankDiff;
    const aTime = Date.parse(a.submittedAt || a.createdAt || "") || 0;
    const bTime = Date.parse(b.submittedAt || b.createdAt || "") || 0;
    return bTime - aTime;
  });
}

// Labels are a night's snapshot key (ADR 0004), so two RoutineItems may not share one. `exceptId` is the item being renamed.
export function isDuplicateRoutineLabel(items: { id: string; label: string }[], label: string, exceptId?: string): boolean {
  return items.some((i) => i.label === label && i.id !== exceptId);
}

export function routineCompletionPercent(completedCount: number, totalCount: number): number {
  if (totalCount === 0) return 0;
  return Math.min(100, Math.max(0, Math.round((completedCount / totalCount) * 100)));
}

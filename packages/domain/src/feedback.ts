export const FEEDBACK_KINDS = ["bug", "idea", "other"] as const;
export type FeedbackKind = (typeof FEEDBACK_KINDS)[number];
export const FEEDBACK_PLATFORMS = ["web", "android"] as const;
export const FEEDBACK_MESSAGE_MAX = 2000;

// The message is stored trimmed; UTF-16 length is never below Postgres' char_length, so the DB check cannot reject what passes here.
export function feedbackMessageError(message: string): "empty" | "tooLong" | null {
  const trimmed = message.trim();
  if (trimmed.length === 0) return "empty";
  return trimmed.length > FEEDBACK_MESSAGE_MAX ? "tooLong" : null;
}

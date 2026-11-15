// In-app artwork rules shared by web and Android: the app shows only images that belong to it
// (a shop's own upload, the user's own photo, files shipped in the repo) and draws everything
// else itself, a product illustration or an initials avatar, never a stock or hotlinked photo.

/** Hosts of stock photos, placeholder generators and QR image services. Never rendered. */
const FOREIGN_IMAGE_HOSTS = [
  "unsplash.com",
  "pravatar.cc",
  "picsum.photos",
  "placehold.co",
  "placeholder.com",
  "placekitten.com",
  "qrserver.com",
  "quickchart.io",
  "vietqr.io",
  "randomuser.me",
  "ui-avatars.com",
];

/**
 * The URL when it is one of the app's own images, otherwise undefined so the caller draws its
 * fallback. Legacy rows still hold stock-photo URLs written by the old seed code.
 */
export function ownImageUrl(url: string | null | undefined): string | undefined {
  const trimmed = url?.trim();
  if (!trimmed) return undefined;
  // Relative paths, data: and blob: URLs are the app's own; anything with a host is checked,
  // protocol-relative ("//images.unsplash.com/...") included.
  if (!/^(https?:)?\/\//i.test(trimmed)) return trimmed;
  let host: string;
  try {
    host = new URL(trimmed, "https://app.invalid").hostname.toLowerCase();
  } catch {
    return undefined;
  }
  return FOREIGN_IMAGE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`)) ? undefined : trimmed;
}

/** "Trần Thị Ngọc Hà" → "TH": first letter of the first and the last word. */
export function initialsOf(name: string): string {
  const words = name
    .normalize("NFC")
    .split(/\s+/)
    .map((w) => w.match(/\p{L}|\p{N}/u)?.[0])
    .filter((c): c is string => Boolean(c));
  if (words.length === 0) return "·";
  const first = words[0]!;
  const last = words.length > 1 ? words[words.length - 1]! : "";
  return (first + last).toLocaleUpperCase("vi");
}

/** A stable index in [0, count) for a seed (FNV-1a), so a person or product keeps its tint. */
export function tintIndex(seed: string, count: number): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % Math.max(1, count);
}

export type ProductShape = "tube" | "pump" | "jar" | "dropper" | "bottle";

const SHAPE_RULES: [ProductShape, RegExp][] = [
  ["tube", /chống nắng|sunscreen|\bspf\b|uv|chấm mụn|spot|gel trị/i],
  ["pump", /sữa rửa|rửa mặt|cleanser|foam|tẩy trang|micellar/i],
  ["dropper", /tinh chất|serum|ampoule|essence|dầu dưỡng|\boil\b/i],
  ["jar", /kem dưỡng|kem|cream|baume|balm|mặt nạ|mask|moistur/i],
];

/** The packaging the illustration draws, read from the category first, then the name. */
export function productShape(category: string | undefined, name: string): ProductShape {
  for (const text of [category ?? "", name]) {
    for (const [shape, rule] of SHAPE_RULES) if (rule.test(text)) return shape;
  }
  return "bottle";
}

/** CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) as four upper-case hex digits. */
export function crc16Ccitt(text: string): string {
  let crc = 0xffff;
  for (let i = 0; i < text.length; i++) {
    crc ^= text.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** EMVCo purpose (62/08): ASCII letters, digits, space and dash, at most 25 characters. */
export function vietQrMemo(memo: string): string {
  return memo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, (c) => (c === "đ" ? "d" : "D"))
    .replace(/[^A-Za-z0-9 -]/g, "")
    .slice(0, 25);
}

const tlv = (id: string, value: string) => `${id}${String(value.length).padStart(2, "0")}${value}`;

/**
 * The EMVCo / NAPAS VietQR string a bank app reads, so the QR is drawn on the device instead of
 * fetched as an image from a third-party service. memo is ASCII (bank apps reject diacritics).
 */
export function vietQrPayload(params: { bankBin: string; accountNo: string; amount: number; memo: string }): string {
  const beneficiary = tlv("00", params.bankBin) + tlv("01", params.accountNo);
  const merchant = tlv("00", "A000000727") + tlv("01", beneficiary) + tlv("02", "QRIBFTTA");
  const body =
    tlv("00", "01") +
    tlv("01", "12") +
    tlv("38", merchant) +
    tlv("53", "704") +
    tlv("54", String(Math.round(params.amount))) +
    tlv("58", "VN") +
    tlv("62", tlv("08", vietQrMemo(params.memo))) +
    "6304";
  return body + crc16Ccitt(body);
}

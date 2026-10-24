/**
 * Data export formatting according to redesign-build 19:
 * Formats user's zone readings, spots, routine history, notes, and tags into standard CSV tables.
 */

export function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function formatCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerLine = headers.map(escapeCsv).join(',');
  const rowLines = rows.map((r) => r.map(escapeCsv).join(','));
  return [headerLine, ...rowLines].join('\n');
}

export type ExportReading = {
  photo_id: string;
  taken_at: string;
  zone: string;
  redness_index: number;
  unevenness: number;
};

export type ExportSpot = {
  photo_id: string;
  taken_at: string;
  spot_index: number;
  zone: string;
  x: number;
  y: number;
};

export type ExportRoutine = {
  night: string;
  item_count: number;
  completed_labels: string[];
};

export type ExportPhotoMeta = {
  photo_id: string;
  taken_at: string;
  note: string | null;
  tags: string[];
};

export function exportZoneReadingsCsv(readings: ExportReading[]): string {
  return formatCsv(
    ['photo_id', 'taken_at', 'zone', 'redness_index', 'unevenness'],
    readings.map((r) => [r.photo_id, r.taken_at, r.zone, r.redness_index, r.unevenness])
  );
}

export function exportSpotsCsv(spots: ExportSpot[]): string {
  return formatCsv(
    ['photo_id', 'taken_at', 'spot_index', 'zone', 'x', 'y'],
    spots.map((s) => [s.photo_id, s.taken_at, s.spot_index, s.zone, s.x, s.y])
  );
}

export function exportRoutineCsv(entries: ExportRoutine[]): string {
  return formatCsv(
    ['night', 'item_count', 'completed_labels'],
    entries.map((e) => [e.night, e.item_count, e.completed_labels.join('; ')])
  );
}

export function exportNotesAndTagsCsv(photos: ExportPhotoMeta[]): string {
  return formatCsv(
    ['photo_id', 'taken_at', 'note', 'tags'],
    photos.map((p) => [p.photo_id, p.taken_at, p.note ?? '', p.tags.join('; ')])
  );
}

export function estimateExportSizeBytes(photoCount: number, avgPhotoSizeBytes = 250_000): {
  photoCount: number;
  estimatedBytes: number;
  formattedSize: string;
} {
  const estimatedBytes = photoCount * avgPhotoSizeBytes + 10_000;
  let formattedSize: string;
  if (estimatedBytes < 1024 * 1024) {
    formattedSize = `${(estimatedBytes / 1024).toFixed(1)} KB`;
  } else {
    formattedSize = `${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return { photoCount, estimatedBytes, formattedSize };
}

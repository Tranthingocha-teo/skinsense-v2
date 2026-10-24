import { describe, expect, it } from 'vitest';
import {
  escapeCsv,
  estimateExportSizeBytes,
  exportNotesAndTagsCsv,
  exportRoutineCsv,
  exportSpotsCsv,
  exportZoneReadingsCsv,
  formatCsv,
} from './export';

describe('export utilities', () => {
  it('escapes CSV cells with commas, quotes, and newlines', () => {
    expect(escapeCsv('normal')).toBe('normal');
    expect(escapeCsv('with,comma')).toBe('"with,comma"');
    expect(escapeCsv('with "quotes"')).toBe('"with ""quotes"""');
    expect(escapeCsv('with\nnewline')).toBe('"with\nnewline"');
    expect(escapeCsv(null)).toBe('');
    expect(escapeCsv(undefined)).toBe('');
  });

  it('formats generic CSV table correctly', () => {
    const csv = formatCsv(['a', 'b'], [['1', '2'], ['hello, world', '3']]);
    expect(csv).toBe('a,b\n1,2\n"hello, world",3');
  });

  it('formats zone readings CSV with stable columns', () => {
    const csv = exportZoneReadingsCsv([
      {
        photo_id: 'p1',
        taken_at: '2026-10-24T00:00:00Z',
        zone: 'forehead',
        redness_index: 0.42,
        unevenness: 0.15,
      },
    ]);
    expect(csv).toContain('photo_id,taken_at,zone,redness_index,unevenness');
    expect(csv).toContain('p1,2026-10-24T00:00:00Z,forehead,0.42,0.15');
  });

  it('formats spots CSV with coordinates and zone', () => {
    const csv = exportSpotsCsv([
      {
        photo_id: 'p1',
        taken_at: '2026-10-24T00:00:00Z',
        spot_index: 1,
        zone: 'chin',
        x: 0.5,
        y: 0.8,
      },
    ]);
    expect(csv).toContain('photo_id,taken_at,spot_index,zone,x,y');
    expect(csv).toContain('p1,2026-10-24T00:00:00Z,1,chin,0.5,0.8');
  });

  it('formats routine CSV with completed labels', () => {
    const csv = exportRoutineCsv([
      {
        night: '2026-10-24',
        item_count: 4,
        completed_labels: ['Rửa mặt', 'Serum trị mụn'],
      },
    ]);
    expect(csv).toContain('night,item_count,completed_labels');
    expect(csv).toContain('2026-10-24,4,Rửa mặt; Serum trị mụn');
  });

  it('formats notes and tags CSV with escaping', () => {
    const csv = exportNotesAndTagsCsv([
      {
        photo_id: 'p1',
        taken_at: '2026-10-24T00:00:00Z',
        note: 'Da hơi khô, uống ít nước',
        tags: ['stress', 'thiếu ngủ'],
      },
    ]);
    expect(csv).toContain('photo_id,taken_at,note,tags');
    expect(csv).toContain('p1,2026-10-24T00:00:00Z,"Da hơi khô, uống ít nước",stress; thiếu ngủ');
  });

  it('estimates export size reasonably', () => {
    const estimate0 = estimateExportSizeBytes(0);
    expect(estimate0.photoCount).toBe(0);
    expect(estimate0.formattedSize).toContain('KB');

    const estimate10 = estimateExportSizeBytes(10);
    expect(estimate10.photoCount).toBe(10);
    expect(estimate10.formattedSize).toContain('MB');
  });
});

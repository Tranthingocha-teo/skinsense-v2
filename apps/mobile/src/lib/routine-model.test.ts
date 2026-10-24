import { predictZoneCondition, evaluateAllZones } from './routine-model';

jest.mock('react-native-fast-tflite', () => ({
  loadTensorflowModel: jest.fn().mockRejectedValue(new Error('TFLite mock test environment')),
}));

describe('routine-model on-device inference & fallback', () => {
  it('predicts acne_blemish condition when spot count is non-zero', async () => {
    const res = await predictZoneCondition('chin', {
      redness: 1.5,
      unevenness: 1.3,
      spotCount: 3,
    });
    expect(res.zone).toBe('chin');
    expect(res.condition).toBe('acne_blemish');
    expect(res.products.length).toBeGreaterThan(0);
    expect(res.products.some((p) => p.targetClasses.includes('acne_blemish'))).toBe(true);
  });

  it('predicts calming_redness when redness is elevated without spots', async () => {
    const res = await predictZoneCondition('leftCheek', {
      redness: 3.2,
      unevenness: 1.2,
      spotCount: 0,
    });
    expect(res.zone).toBe('leftCheek');
    expect(res.condition).toBe('calming_redness');
    expect(res.products.length).toBeGreaterThan(0);
  });

  it('evaluates all 5 zones simultaneously', async () => {
    const all = await evaluateAllZones({
      forehead: { redness: -0.8, unevenness: 1.2, spotCount: 0 },
      leftCheek: { redness: 0.4, unevenness: 1.3, spotCount: 0 },
      rightCheek: { redness: -0.9, unevenness: 1.1, spotCount: 0 },
      nose: { redness: 2.8, unevenness: 1.6, spotCount: 0 },
      chin: { redness: 4.0, unevenness: 1.8, spotCount: 1 },
    });

    expect(all.forehead).toBeDefined();
    expect(all.nose).toBeDefined();
    expect(all.chin.condition).toBe('acne_blemish');
    expect(all.nose.products.length).toBeGreaterThan(0);
  });
});

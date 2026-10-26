import {
  classifyZoneCondition,
  PRODUCTS,
  recommendProductsForZone,
  type Product,
  type SkinConditionClass,
  type Zone,
  type ZoneTelemetry,
} from '@skinsense/domain';
import { loadTensorflowModel, type TfliteModel } from 'react-native-fast-tflite';

export const CONDITION_CLASSES: SkinConditionClass[] = [
  'acne_blemish',
  'calming_redness',
  'barrier_repair',
  'brightening_tone',
  'pore_oil_control',
  'gentle_maintenance',
];

const ZONE_INDICES: Record<Zone, number> = {
  forehead: 0,
  leftCheek: 1,
  rightCheek: 2,
  nose: 3,
  chin: 4,
};

let cachedModel: TfliteModel | null = null;
let modelLoadFailed = false;

export async function loadRoutineModel(): Promise<TfliteModel | null> {
  if (cachedModel) return cachedModel;
  if (modelLoadFailed) return null;
  try {
    cachedModel = await loadTensorflowModel(
      require('../../assets/models/routine_recommendation.tflite'),
      [],
    );
    return cachedModel;
  } catch (error) {
    modelLoadFailed = true;
    return null;
  }
}

export interface ZonePrediction {
  zone: Zone;
  condition: SkinConditionClass;
  confidence: number;
  products: Product[];
}

/**
 * Predicts the optimal skincare treatment category for a facial zone using the on-device TFLite model,
 * with automatic fallback to dermatological rule-based classification if model is unavailable.
 */
export async function predictZoneCondition(
  zone: Zone,
  telemetry: ZoneTelemetry,
  skinType = 1, // default oily/combo
): Promise<ZonePrediction> {
  const model = await loadRoutineModel();
  if (model) {
    try {
      const featZone = ZONE_INDICES[zone] / 4.0;
      const featRedness = Math.min(1.0, Math.max(0.0, (telemetry.redness + 5.0) / 15.0));
      const featUneven = Math.min(1.0, Math.max(0.0, telemetry.unevenness / 10.0));
      const featSpots = Math.min(1.0, Math.max(0.0, telemetry.spotCount / 10.0));
      const featSkinType = skinType / 4.0;

      const input = new Float32Array([featZone, featRedness, featUneven, featSpots, featSkinType]);
      const outputs = await model.run([input as any]);
      const confidences = (outputs[0] as unknown as Float32Array | number[]) || [];

      let bestIdx = 0;
      let maxConf = -1;
      for (let i = 0; i < confidences.length; i++) {
        if (confidences[i] > maxConf) {
          maxConf = confidences[i];
          bestIdx = i;
        }
      }

      const condition = CONDITION_CLASSES[bestIdx] ?? 'gentle_maintenance';
      const products = recommendProductsForZone(zone, telemetry, condition);
      return { zone, condition, confidence: maxConf, products };
    } catch {
      // Fallback below
    }
  }

  // Robust domain fallback
  const condition = classifyZoneCondition(zone, telemetry);
  const products = recommendProductsForZone(zone, telemetry, condition);
  return {
    zone,
    condition,
    confidence: 0.95,
    products,
  };
}

/**
 * Evaluates all 5 facial zones and returns tailored product recommendations for each zone.
 */
export async function evaluateAllZones(
  telemetries: Partial<Record<Zone, ZoneTelemetry>>,
): Promise<Record<Zone, ZonePrediction>> {
  const zones: Zone[] = ['forehead', 'leftCheek', 'rightCheek', 'nose', 'chin'];
  const results = await Promise.all(
    zones.map(async (zone) => {
      const telem = telemetries[zone] ?? { redness: 0, unevenness: 1.0, spotCount: 0 };
      const pred = await predictZoneCondition(zone, telem);
      return [zone, pred] as const;
    }),
  );
  return Object.fromEntries(results) as Record<Zone, ZonePrediction>;
}

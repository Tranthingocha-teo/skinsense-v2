// The 400svh track holds three equal scenes (DESIGN.md Motion): capture, mark, trend.
export const SCENES = 3;

export const sceneAt = (progress: number) => Math.min(SCENES - 1, Math.floor(progress * SCENES));

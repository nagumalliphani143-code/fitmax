import type {
  ActivityLevel,
  CalorieGoalMode,
  Profile,
  StepSensitivity,
} from "./types";

export function calcBMR(p: Profile): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return Math.round(p.sex === "male" ? base + 5 : base - 161);
}

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

export function calcTDEE(p: Profile): number {
  return Math.round(calcBMR(p) * ACTIVITY_MULTIPLIERS[p.activityLevel]);
}

export function calcBMI(p: Profile): number {
  const m = p.heightCm / 100;
  if (m <= 0) return 0;
  return Math.round((p.weightKg / (m * m)) * 10) / 10;
}

export function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Underweight", color: "text-sky-400" };
  if (bmi < 25) return { label: "Normal", color: "text-brand-400" };
  if (bmi < 30) return { label: "Overweight", color: "text-amber-400" };
  return { label: "Obese", color: "text-rose-400" };
}

export function calcCalorieTarget(p: Profile, mode: CalorieGoalMode): number {
  const tdee = calcTDEE(p);
  if (mode === "lose") return tdee - 500;
  if (mode === "gain") return tdee + 300;
  return tdee;
}

export interface MacroTargets {
  proteinG: number;
  carbsG: number;
  fatsG: number;
}

export function calcMacroTargets(calories: number): MacroTargets {
  return {
    proteinG: Math.round((calories * 0.3) / 4),
    carbsG: Math.round((calories * 0.4) / 4),
    fatsG: Math.round((calories * 0.3) / 9),
  };
}

export interface SensitivityProfile {
  label: string;
  description: string;
  /** steps added per simulated motion tick */
  stepsPerTick: number;
  /** ms between simulated motion ticks */
  tickIntervalMs: number;
  /** steps added per manual "+" press */
  manualIncrement: number;
  /** device motion acceleration threshold (m/s^2) to count as a step */
  motionThreshold: number;
  /** min ms between two motion-detected steps */
  motionCooldownMs: number;
}

export const SENSITIVITY_PROFILES: Record<StepSensitivity, SensitivityProfile> = {
  low: {
    label: "Low",
    description: "Counts only deliberate, strong motion. Fewer accidental steps.",
    stepsPerTick: 1,
    tickIntervalMs: 1500,
    manualIncrement: 10,
    motionThreshold: 14,
    motionCooldownMs: 500,
  },
  medium: {
    label: "Medium",
    description: "Balanced everyday calibration (recommended).",
    stepsPerTick: 2,
    tickIntervalMs: 900,
    manualIncrement: 25,
    motionThreshold: 10,
    motionCooldownMs: 350,
  },
  high: {
    label: "High",
    description: "Aggressive detection — light motion counts as steps.",
    stepsPerTick: 4,
    tickIntervalMs: 450,
    manualIncrement: 50,
    motionThreshold: 6,
    motionCooldownMs: 220,
  },
};

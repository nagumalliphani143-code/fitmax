export type Sex = "male" | "female";

export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";

export type CalorieGoalMode = "lose" | "maintain" | "gain";

export type StepSensitivity = "low" | "medium" | "high";

export interface Profile {
  name: string;
  weightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
  activityLevel: ActivityLevel;
}

export interface Settings {
  stepGoal: number;
  stepSensitivity: StepSensitivity;
  calorieGoalMode: CalorieGoalMode;
  waterGoalGlasses: number;
  defaultRestSeconds: number;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snacks";

export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snacks"];

export interface FoodEntry {
  id: string;
  date: string; // YYYY-MM-DD
  meal: MealType;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
}

export interface ExercisePlan {
  id: string;
  name: string;
  sets: number;
  reps: string;
}

export interface DayPlan {
  day: number; // 0 = Monday ... 6 = Sunday
  title: string;
  exercises: ExercisePlan[];
}

export interface LoggedSet {
  reps: number;
  weightKg: number;
  done: boolean;
}

// date -> exerciseId -> sets
export type SetLogs = Record<string, Record<string, LoggedSet[]>>;

export interface Reminder {
  id: string;
  type: "water" | "workout";
  time: string; // HH:MM (24h)
  label: string;
  enabled: boolean;
}

export interface DayActivity {
  steps: number;
  waterGlasses: number;
  workoutDone: boolean;
}

export type ActivityLog = Record<string, DayActivity>; // YYYY-MM-DD -> activity

export interface AppData {
  version: number;
  profile: Profile;
  settings: Settings;
  foodLog: FoodEntry[];
  workoutPlan: DayPlan[];
  setLogs: SetLogs;
  reminders: Reminder[];
  activityLog: ActivityLog;
}

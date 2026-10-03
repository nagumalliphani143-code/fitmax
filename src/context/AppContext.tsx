"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AppData,
  DayActivity,
  DayPlan,
  ExercisePlan,
  FoodEntry,
  LoggedSet,
  Profile,
  Reminder,
  Settings,
} from "@/lib/types";
import { DATA_VERSION, STORAGE_KEY, defaultAppData, uid } from "@/lib/defaults";
import { todayKey } from "@/lib/date";
import {
  calcBMI,
  calcBMR,
  calcCalorieTarget,
  calcMacroTargets,
  calcTDEE,
} from "@/lib/metrics";

function loadData(): AppData {
  const base = defaultAppData();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<AppData>;
    if (!parsed || typeof parsed !== "object") return base;
    return {
      ...base,
      ...parsed,
      version: DATA_VERSION,
      profile: { ...base.profile, ...(parsed.profile ?? {}) },
      settings: { ...base.settings, ...(parsed.settings ?? {}) },
      foodLog: Array.isArray(parsed.foodLog) ? parsed.foodLog : base.foodLog,
      workoutPlan:
        Array.isArray(parsed.workoutPlan) && parsed.workoutPlan.length === 7
          ? parsed.workoutPlan
          : base.workoutPlan,
      setLogs: parsed.setLogs ?? base.setLogs,
      reminders: Array.isArray(parsed.reminders) ? parsed.reminders : base.reminders,
      activityLog: parsed.activityLog ?? base.activityLog,
    };
  } catch {
    return base;
  }
}

const EMPTY_DAY: DayActivity = { steps: 0, waterGlasses: 0, workoutDone: false };

interface AppContextValue {
  data: AppData;
  hydrated: boolean;
  metrics: {
    bmr: number;
    tdee: number;
    bmi: number;
    calorieTarget: number;
    macros: { proteinG: number; carbsG: number; fatsG: number };
  };
  updateProfile: (patch: Partial<Profile>) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  addSteps: (amount: number, date?: string) => void;
  setSteps: (steps: number, date?: string) => void;
  resetSteps: (date?: string) => void;
  addWater: (glasses: number, date?: string) => void;
  markWorkoutDone: (done: boolean, date?: string) => void;
  addFoodEntry: (entry: Omit<FoodEntry, "id">) => void;
  updateFoodEntry: (id: string, patch: Partial<Omit<FoodEntry, "id">>) => void;
  deleteFoodEntry: (id: string) => void;
  updateDayPlan: (day: number, patch: Partial<Pick<DayPlan, "title" | "exercises">>) => void;
  addExercise: (day: number, exercise: Omit<ExercisePlan, "id">) => void;
  updateExercise: (day: number, exerciseId: string, patch: Partial<Omit<ExercisePlan, "id">>) => void;
  deleteExercise: (day: number, exerciseId: string) => void;
  moveExercise: (day: number, exerciseId: string, direction: -1 | 1) => void;
  initSetLogs: (exerciseId: string, setCount: number, date?: string) => void;
  toggleSetDone: (exerciseId: string, setIndex: number, date?: string) => void;
  updateSetLog: (exerciseId: string, setIndex: number, patch: Partial<LoggedSet>, date?: string) => void;
  addReminder: (reminder: Omit<Reminder, "id">) => void;
  updateReminder: (id: string, patch: Partial<Omit<Reminder, "id">>) => void;
  deleteReminder: (id: string) => void;
  resetAllData: () => void;
  exportData: () => string;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => defaultAppData());
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setData(loadData());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        // storage full or unavailable — keep working in memory
      }
    }, 150);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, hydrated]);

  const patchActivity = useCallback(
    (dateKeyStr: string, updater: (cur: DayActivity) => Partial<DayActivity>) => {
      setData((prev) => {
        const current = prev.activityLog[dateKeyStr] ?? EMPTY_DAY;
        const next: DayActivity = { ...current, ...updater(current) };
        if (next.steps < 0) next.steps = 0;
        if (next.waterGlasses < 0) next.waterGlasses = 0;
        return { ...prev, activityLog: { ...prev.activityLog, [dateKeyStr]: next } };
      });
    },
    []
  );

  const patchSetLogs = useCallback(
    (
      date: string,
      exerciseId: string,
      updater: (sets: LoggedSet[]) => LoggedSet[]
    ) => {
      setData((prev) => {
        const dayLogs = prev.setLogs[date] ?? {};
        const sets = updater(dayLogs[exerciseId] ?? []);
        return {
          ...prev,
          setLogs: { ...prev.setLogs, [date]: { ...dayLogs, [exerciseId]: sets } },
        };
      });
    },
    []
  );

  const value = useMemo<AppContextValue>(() => {
    const { profile, settings } = data;
    const calorieTarget = calcCalorieTarget(profile, settings.calorieGoalMode);
    return {
      data,
      hydrated,
      metrics: {
        bmr: calcBMR(profile),
        tdee: calcTDEE(profile),
        bmi: calcBMI(profile),
        calorieTarget,
        macros: calcMacroTargets(calorieTarget),
      },
      updateProfile: (patch) =>
        setData((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } })),
      updateSettings: (patch) =>
        setData((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } })),
      addSteps: (amount, date = todayKey()) =>
        patchActivity(date, (cur) => ({ steps: cur.steps + amount })),
      setSteps: (steps, date = todayKey()) =>
        patchActivity(date, () => ({ steps: Math.max(0, Math.round(steps)) })),
      resetSteps: (date = todayKey()) => patchActivity(date, () => ({ steps: 0 })),
      addWater: (glasses, date = todayKey()) =>
        patchActivity(date, (cur) => ({ waterGlasses: cur.waterGlasses + glasses })),
      markWorkoutDone: (done, date = todayKey()) =>
        patchActivity(date, () => ({ workoutDone: done })),
      addFoodEntry: (entry) =>
        setData((prev) => ({
          ...prev,
          foodLog: [...prev.foodLog, { ...entry, id: uid("food") }],
        })),
      updateFoodEntry: (id, patch) =>
        setData((prev) => ({
          ...prev,
          foodLog: prev.foodLog.map((f) => (f.id === id ? { ...f, ...patch } : f)),
        })),
      deleteFoodEntry: (id) =>
        setData((prev) => ({ ...prev, foodLog: prev.foodLog.filter((f) => f.id !== id) })),
      updateDayPlan: (day, patch) =>
        setData((prev) => ({
          ...prev,
          workoutPlan: prev.workoutPlan.map((d) => (d.day === day ? { ...d, ...patch } : d)),
        })),
      addExercise: (day, exercise) =>
        setData((prev) => ({
          ...prev,
          workoutPlan: prev.workoutPlan.map((d) =>
            d.day === day
              ? { ...d, exercises: [...d.exercises, { ...exercise, id: uid("ex") }] }
              : d
          ),
        })),
      updateExercise: (day, exerciseId, patch) =>
        setData((prev) => ({
          ...prev,
          workoutPlan: prev.workoutPlan.map((d) =>
            d.day === day
              ? {
                  ...d,
                  exercises: d.exercises.map((e) =>
                    e.id === exerciseId ? { ...e, ...patch } : e
                  ),
                }
              : d
          ),
        })),
      deleteExercise: (day, exerciseId) =>
        setData((prev) => ({
          ...prev,
          workoutPlan: prev.workoutPlan.map((d) =>
            d.day === day
              ? { ...d, exercises: d.exercises.filter((e) => e.id !== exerciseId) }
              : d
          ),
        })),
      moveExercise: (day, exerciseId, direction) =>
        setData((prev) => ({
          ...prev,
          workoutPlan: prev.workoutPlan.map((d) => {
            if (d.day !== day) return d;
            const idx = d.exercises.findIndex((e) => e.id === exerciseId);
            const target = idx + direction;
            if (idx < 0 || target < 0 || target >= d.exercises.length) return d;
            const exercises = [...d.exercises];
            [exercises[idx], exercises[target]] = [exercises[target], exercises[idx]];
            return { ...d, exercises };
          }),
        })),
      initSetLogs: (exerciseId, setCount, date = todayKey()) =>
        patchSetLogs(date, exerciseId, (sets) => {
          if (sets.length === setCount) return sets;
          return Array.from({ length: setCount }, (_, i) =>
            sets[i] ?? { reps: 0, weightKg: 0, done: false }
          );
        }),
      toggleSetDone: (exerciseId, setIndex, date = todayKey()) =>
        patchSetLogs(date, exerciseId, (sets) =>
          sets.map((s, i) => (i === setIndex ? { ...s, done: !s.done } : s))
        ),
      updateSetLog: (exerciseId, setIndex, patch, date = todayKey()) =>
        patchSetLogs(date, exerciseId, (sets) =>
          sets.map((s, i) => (i === setIndex ? { ...s, ...patch } : s))
        ),
      addReminder: (reminder) =>
        setData((prev) => ({
          ...prev,
          reminders: [...prev.reminders, { ...reminder, id: uid("rem") }],
        })),
      updateReminder: (id, patch) =>
        setData((prev) => ({
          ...prev,
          reminders: prev.reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),
      deleteReminder: (id) =>
        setData((prev) => ({ ...prev, reminders: prev.reminders.filter((r) => r.id !== id) })),
      resetAllData: () => {
        const fresh = defaultAppData();
        setData(fresh);
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
        } catch {
          // ignore
        }
      },
      exportData: () => JSON.stringify(data, null, 2),
    };
  }, [data, hydrated, patchActivity, patchSetLogs]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

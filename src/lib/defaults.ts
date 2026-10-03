import type { AppData, DayPlan, ExercisePlan, Reminder } from "./types";

let counter = 0;
export function uid(prefix = "id"): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter}_${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

function ex(name: string, sets: number, reps: string): ExercisePlan {
  return { id: uid("ex"), name, sets, reps };
}

export function defaultWorkoutPlan(): DayPlan[] {
  return [
    {
      day: 0,
      title: "Chest & Legs",
      exercises: [
        ex("Barbell Bench Press", 4, "8-10"),
        ex("Incline Dumbbell Press", 3, "10-12"),
        ex("Push-Ups", 3, "15"),
        ex("Barbell Squat", 4, "8-10"),
        ex("Walking Lunges", 3, "12 / leg"),
        ex("Standing Calf Raise", 4, "15-20"),
      ],
    },
    {
      day: 1,
      title: "Abs & Biceps",
      exercises: [
        ex("Hanging Leg Raise", 3, "12"),
        ex("Cable Crunch", 3, "15"),
        ex("Russian Twist", 3, "20"),
        ex("Plank", 3, "45 sec"),
        ex("Barbell Curl", 4, "8-10"),
        ex("Hammer Curl", 3, "10-12"),
      ],
    },
    {
      day: 2,
      title: "Rest / Cardio",
      exercises: [ex("Brisk Walk or Easy Cycle", 1, "25-30 min")],
    },
    {
      day: 3,
      title: "Back & Shoulders",
      exercises: [
        ex("Pull-Ups / Lat Pulldown", 4, "8-10"),
        ex("Bent-Over Barbell Row", 4, "8-10"),
        ex("Seated Cable Row", 3, "10-12"),
        ex("Overhead Press", 4, "8-10"),
        ex("Lateral Raise", 3, "12-15"),
        ex("Face Pull", 3, "15"),
      ],
    },
    {
      day: 4,
      title: "Full Body",
      exercises: [
        ex("Deadlift", 4, "6-8"),
        ex("Dumbbell Thruster", 3, "10-12"),
        ex("Renegade Row", 3, "10 / side"),
        ex("Kettlebell Swing", 3, "15"),
        ex("Burpees", 3, "10"),
      ],
    },
    {
      day: 5,
      title: "HIIT & Core",
      exercises: [
        ex("Sprint Intervals", 1, "8 x 30 sec"),
        ex("Mountain Climbers", 3, "30 sec"),
        ex("Bicycle Crunch", 3, "20"),
        ex("Side Plank", 3, "30 sec / side"),
      ],
    },
    {
      day: 6,
      title: "Active Recovery",
      exercises: [
        ex("Full-Body Stretching", 1, "15 min"),
        ex("Easy Walk", 1, "30 min"),
      ],
    },
  ];
}

export function defaultReminders(): Reminder[] {
  return [
    { id: uid("rem"), type: "water", time: "09:00", label: "Morning hydration", enabled: true },
    { id: uid("rem"), type: "water", time: "13:00", label: "Midday water break", enabled: true },
    { id: uid("rem"), type: "water", time: "18:00", label: "Evening hydration", enabled: true },
    { id: uid("rem"), type: "workout", time: "17:30", label: "Hit the gym", enabled: true },
  ];
}

export const STORAGE_KEY = "fitmax:data:v1";
export const DATA_VERSION = 1;

export function defaultAppData(): AppData {
  return {
    version: DATA_VERSION,
    profile: {
      name: "Athlete",
      weightKg: 75,
      heightCm: 175,
      age: 28,
      sex: "male",
      activityLevel: "moderate",
    },
    settings: {
      stepGoal: 10000,
      stepSensitivity: "medium",
      calorieGoalMode: "maintain",
      waterGoalGlasses: 8,
      defaultRestSeconds: 60,
    },
    foodLog: [],
    workoutPlan: defaultWorkoutPlan(),
    setLogs: {},
    reminders: defaultReminders(),
    activityLog: {},
  };
}

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

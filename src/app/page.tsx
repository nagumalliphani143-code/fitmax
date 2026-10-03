"use client";

import Link from "next/link";
import ProgressRing from "@/components/ProgressRing";
import ActivityCalendar from "@/components/ActivityCalendar";
import RemindersWidget from "@/components/RemindersWidget";
import { useApp } from "@/context/AppContext";
import { WEEKDAY_NAMES, formatDateLong, todayKey, weekdayIndex } from "@/lib/date";
import { STREAK_MILESTONES } from "@/lib/defaults";
import { bmiCategory } from "@/lib/metrics";
import { activeDaysThisMonth, currentStreak, longestStreak } from "@/lib/streaks";

export default function Dashboard() {
  const { data, hydrated, metrics } = useApp();

  if (!hydrated) return <PageSkeleton />;

  const today = todayKey();
  const day = data.activityLog[today] ?? { steps: 0, waterGlasses: 0, workoutDone: false };
  const stepGoal = data.settings.stepGoal;
  const streak = currentStreak(data.activityLog);
  const best = longestStreak(data.activityLog);
  const monthActive = activeDaysThisMonth(data.activityLog);
  const bmi = bmiCategory(metrics.bmi);

  const consumed = data.foodLog
    .filter((e) => e.date === today)
    .reduce((s, e) => s + e.calories, 0);

  const todayPlan = data.workoutPlan[weekdayIndex()];
  const nextMilestone = STREAK_MILESTONES.find((m) => m > streak) ?? null;

  return (
    <main className="space-y-5">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-sm text-slate-400">{formatDateLong(today)}</p>
          <h1 className="text-2xl font-bold">
            Hey {data.profile.name} <span className="align-middle">💪</span>
          </h1>
        </div>
        <Link href="/settings" className="chip hover:!border-brand-600">
          Edit profile
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="card flex items-center gap-4">
          <ProgressRing progress={stepGoal > 0 ? day.steps / stepGoal : 0} size={110} stroke={10}>
            <span className="text-lg font-extrabold tabular-nums">
              {day.steps >= 1000 ? `${(day.steps / 1000).toFixed(1)}k` : day.steps}
            </span>
            <span className="text-[10px] text-slate-400">steps</span>
          </ProgressRing>
          <div>
            <h2 className="font-semibold">Step Tracker</h2>
            <p className="text-sm text-slate-400">
              {Math.max(0, stepGoal - day.steps).toLocaleString()} to goal
            </p>
            <Link href="/steps" className="mt-2 inline-block text-sm font-semibold text-brand-400 hover:underline">
              Open tracker →
            </Link>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <ProgressRing
            progress={metrics.calorieTarget > 0 ? consumed / metrics.calorieTarget : 0}
            size={110}
            stroke={10}
            strokeColor={consumed > metrics.calorieTarget ? "#f43f5e" : "#46c08b"}
          >
            <span className="text-lg font-extrabold tabular-nums">{consumed}</span>
            <span className="text-[10px] text-slate-400">kcal</span>
          </ProgressRing>
          <div>
            <h2 className="font-semibold">Energy</h2>
            <p className="text-sm text-slate-400">
              Target {metrics.calorieTarget.toLocaleString()} kcal
            </p>
            <Link href="/food" className="mt-2 inline-block text-sm font-semibold text-brand-400 hover:underline">
              Log food →
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="BMI" value={String(metrics.bmi)} sub={bmi.label} subClass={bmi.color} />
        <StatCard label="BMR" value={metrics.bmr.toLocaleString()} sub="kcal / day" />
        <StatCard label="TDEE" value={metrics.tdee.toLocaleString()} sub="kcal / day" />
        <StatCard label="Active days" value={String(monthActive)} sub="this month" />
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">🔥 Daily Streak</h2>
          <span className="text-sm text-slate-400">Best: {best} days</span>
        </div>
        <p className="text-3xl font-extrabold text-amber-400">
          {streak} <span className="text-base font-semibold text-slate-400">consecutive days</span>
        </p>
        {nextMilestone && (
          <p className="text-xs text-slate-400">
            {nextMilestone - streak} more day{nextMilestone - streak === 1 ? "" : "s"} to the{" "}
            {nextMilestone}-day badge
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {STREAK_MILESTONES.map((m) => {
            const earned = streak >= m || best >= m;
            return (
              <span
                key={m}
                title={`${m}-day streak badge`}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                  earned
                    ? "border-amber-400/60 bg-amber-400/15 text-amber-300"
                    : "border-surface-border bg-surface-raised text-slate-600"
                }`}
              >
                {earned ? "🏅" : "🔒"} {m} days
              </span>
            );
          })}
        </div>
      </section>

      <section className="card space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Today&apos;s Workout</h2>
          <Link href="/workouts" className="text-sm font-semibold text-brand-400 hover:underline">
            Open →
          </Link>
        </div>
        <p className="text-sm font-medium text-brand-400">
          {WEEKDAY_NAMES[weekdayIndex()]} — {todayPlan.title}
        </p>
        <ul className="space-y-1 text-sm text-slate-400">
          {todayPlan.exercises.slice(0, 4).map((ex) => (
            <li key={ex.id}>
              • {ex.name}{" "}
              <span className="text-slate-500">
                ({ex.sets} × {ex.reps})
              </span>
            </li>
          ))}
          {todayPlan.exercises.length > 4 && (
            <li className="text-slate-500">+ {todayPlan.exercises.length - 4} more…</li>
          )}
          {todayPlan.exercises.length === 0 && <li>Rest day — enjoy it!</li>}
        </ul>
        {day.workoutDone && <p className="chip !border-brand-500 !text-brand-300">✓ Completed today</p>}
      </section>

      <RemindersWidget />
      <ActivityCalendar activityLog={data.activityLog} />
    </main>
  );
}

function StatCard({
  label,
  value,
  sub,
  subClass,
}: {
  label: string;
  value: string;
  sub: string;
  subClass?: string;
}) {
  return (
    <div className="card !p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-xl font-extrabold tabular-nums">{value}</p>
      <p className={`text-[11px] ${subClass ?? "text-slate-400"}`}>{sub}</p>
    </div>
  );
}

function PageSkeleton() {
  return (
    <main className="space-y-5">
      <div className="h-9 w-56 animate-pulse rounded bg-surface-raised" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card h-36 animate-pulse" />
        <div className="card h-36 animate-pulse" />
      </div>
      <div className="card h-28 animate-pulse" />
    </main>
  );
}

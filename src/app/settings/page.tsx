"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { SENSITIVITY_PROFILES, bmiCategory, calcCalorieTarget } from "@/lib/metrics";
import type { ActivityLevel, CalorieGoalMode, Sex, StepSensitivity } from "@/lib/types";

export default function SettingsPage() {
  const { data, hydrated, metrics, updateProfile, updateSettings, resetAllData, exportData } =
    useApp();
  const [confirmReset, setConfirmReset] = useState(false);
  const [exported, setExported] = useState(false);

  if (!hydrated) return <PageSkeleton />;

  const { profile, settings } = data;
  const bmi = bmiCategory(metrics.bmi);
  const sens = SENSITIVITY_PROFILES[settings.stepSensitivity];

  async function copyExport() {
    try {
      await navigator.clipboard.writeText(exportData());
      setExported(true);
      setTimeout(() => setExported(false), 2500);
    } catch {
      // clipboard unavailable — silently ignore
    }
  }

  return (
    <main className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-slate-400">
          Every change instantly recalculates your BMR, BMI and calorie targets
        </p>
      </header>

      {/* Profile / biometrics */}
      <section className="card space-y-4">
        <h2 className="font-semibold">Profile & Biometrics</h2>
        <div>
          <span className="label">Name</span>
          <input
            className="input"
            value={profile.name}
            onChange={(e) => updateProfile({ name: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <NumberField
            label="Weight (kg)"
            value={profile.weightKg}
            min={0}
            max={300}
            step={0.5}
            clearZeroOnFocus
            onChange={(v) => updateProfile({ weightKg: v })}
          />
          <NumberField
            label="Height (cm)"
            value={profile.heightCm}
            min={0}
            max={250}
            step={1}
            clearZeroOnFocus
            onChange={(v) => updateProfile({ heightCm: v })}
          />
          <NumberField
            label="Age"
            value={profile.age}
            min={0}
            max={120}
            step={1}
            clearZeroOnFocus
            onChange={(v) => updateProfile({ age: v })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="label">Sex</span>
            <select
              className="input"
              value={profile.sex}
              onChange={(e) => updateProfile({ sex: e.target.value as Sex })}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <span className="label">Activity level</span>
            <select
              className="input"
              value={profile.activityLevel}
              onChange={(e) =>
                updateProfile({ activityLevel: e.target.value as ActivityLevel })
              }
            >
              <option value="sedentary">Sedentary (desk job)</option>
              <option value="light">Light (1-3 workouts/wk)</option>
              <option value="moderate">Moderate (3-5 workouts/wk)</option>
              <option value="active">Active (6-7 workouts/wk)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-xl border border-surface-border bg-surface-raised p-3 text-center">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">BMI</p>
            <p className="text-lg font-extrabold tabular-nums">{metrics.bmi}</p>
            <p className={`text-[11px] font-semibold ${bmi.color}`}>{bmi.label}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">BMR</p>
            <p className="text-lg font-extrabold tabular-nums">{metrics.bmr}</p>
            <p className="text-[11px] text-slate-500">kcal / day</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">TDEE</p>
            <p className="text-lg font-extrabold tabular-nums">{metrics.tdee}</p>
            <p className="text-[11px] text-slate-500">kcal / day</p>
          </div>
        </div>
      </section>

      {/* Step tracker */}
      <section className="card space-y-4">
        <h2 className="font-semibold">Step Tracker</h2>
        <NumberField
          label="Daily step goal"
          value={settings.stepGoal}
          min={1000}
          max={100000}
          step={500}
          onChange={(v) => updateSettings({ stepGoal: v })}
        />
        <div>
          <span className="label">Step Tracker Sensitivity (motion threshold)</span>
          <div className="grid grid-cols-3 gap-2">
            {(["low", "medium", "high"] as StepSensitivity[]).map((level) => {
              const p = SENSITIVITY_PROFILES[level];
              const active = settings.stepSensitivity === level;
              return (
                <button
                  key={level}
                  onClick={() => updateSettings({ stepSensitivity: level })}
                  className={`rounded-xl border p-3 text-left transition ${
                    active
                      ? "border-brand-500 bg-brand-600/15"
                      : "border-surface-border bg-surface-raised hover:border-brand-700"
                  }`}
                >
                  <p className={`text-sm font-bold ${active ? "text-brand-300" : "text-slate-300"}`}>
                    {p.label}
                  </p>
                  <p className="mt-0.5 text-[10px] leading-tight text-slate-500">
                    +{p.manualIncrement}/tap · threshold {p.motionThreshold} m/s²
                  </p>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-400">{sens.description}</p>
        </div>
      </section>

      {/* Nutrition goals */}
      <section className="card space-y-4">
        <h2 className="font-semibold">Nutrition Goals</h2>
        <div>
          <span className="label">Calorie goal mode</span>
          <div className="grid grid-cols-3 gap-2">
            {(["lose", "maintain", "gain"] as CalorieGoalMode[]).map((mode) => {
              const active = settings.calorieGoalMode === mode;
              const target = calcCalorieTarget(profile, mode);
              return (
                <button
                  key={mode}
                  onClick={() => updateSettings({ calorieGoalMode: mode })}
                  className={`rounded-xl border p-3 text-center transition ${
                    active
                      ? "border-brand-500 bg-brand-600/15"
                      : "border-surface-border bg-surface-raised hover:border-brand-700"
                  }`}
                >
                  <p className={`text-sm font-bold capitalize ${active ? "text-brand-300" : "text-slate-300"}`}>
                    {mode}
                  </p>
                  <p className="text-[10px] text-slate-500 tabular-nums">{target} kcal</p>
                </button>
              );
            })}
          </div>
        </div>
        <div className="rounded-xl border border-surface-border bg-surface-raised p-3 text-sm">
          <p className="text-slate-400">
            Daily targets —{" "}
            <span className="font-semibold text-slate-200 tabular-nums">
              {metrics.calorieTarget} kcal
            </span>
            : P {metrics.macros.proteinG}g · C {metrics.macros.carbsG}g · F {metrics.macros.fatsG}g
          </p>
        </div>
        <NumberField
          label="Water goal (glasses / day)"
          value={settings.waterGoalGlasses}
          min={1}
          max={20}
          step={1}
          onChange={(v) => updateSettings({ waterGoalGlasses: v })}
        />
      </section>

      {/* Workout timer */}
      <section className="card space-y-3">
        <h2 className="font-semibold">Workout</h2>
        <div>
          <span className="label">Default rest timer (seconds)</span>
          <div className="flex gap-2">
            {[30, 45, 60, 90, 120].map((s) => (
              <button
                key={s}
                className={`btn flex-1 !px-2 ${
                  settings.defaultRestSeconds === s
                    ? "bg-brand-600 text-white"
                    : "border border-surface-border bg-surface-raised text-slate-300 hover:border-brand-600"
                }`}
                onClick={() => updateSettings({ defaultRestSeconds: s })}
              >
                {s}s
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Data */}
      <section className="card space-y-3">
        <h2 className="font-semibold">Data (stored offline in this browser)</h2>
        <button className="btn-ghost w-full" onClick={copyExport}>
          {exported ? "✓ Copied JSON to clipboard" : "Copy all data as JSON"}
        </button>
        {confirmReset ? (
          <div className="space-y-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3">
            <p className="text-sm text-rose-200">
              This erases your profile, steps, workouts, food log and streaks. Continue?
            </p>
            <div className="flex gap-2">
              <button
                className="btn-danger flex-1"
                onClick={() => {
                  resetAllData();
                  setConfirmReset(false);
                }}
              >
                Yes, erase everything
              </button>
              <button className="btn-ghost" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button className="btn-danger w-full" onClick={() => setConfirmReset(true)}>
            Reset all app data
          </button>
        )}
      </section>

      <footer className="pb-2 text-center text-xs text-slate-600">
        Fitmax 0.0.1 · offline-first · no accounts, no cloud
      </footer>
    </main>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step,
  clearZeroOnFocus = false,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  clearZeroOnFocus?: boolean;
  onChange: (v: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [focused, value]);

  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        type="number"
        className="input"
        value={draft}
        placeholder="0"
        min={min}
        max={max}
        step={step}
        onFocus={() => {
          setFocused(true);
          if (clearZeroOnFocus && value === 0) setDraft("");
        }}
        onBlur={() => {
          setFocused(false);
          if (draft.trim() === "") setDraft("0");
        }}
        onChange={(e) => {
          const raw = e.target.value;
          setDraft(raw);
          if (raw.trim() === "") {
            onChange(0);
            return;
          }
          const n = Number(raw);
          if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
      />
    </label>
  );
}

function PageSkeleton() {
  return (
    <main className="space-y-5">
      <div className="h-8 w-40 animate-pulse rounded bg-surface-raised" />
      <div className="card h-64 animate-pulse" />
    </main>
  );
}

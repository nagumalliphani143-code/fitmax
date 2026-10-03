"use client";

import { useEffect, useRef, useState } from "react";
import ProgressRing from "@/components/ProgressRing";
import { useApp } from "@/context/AppContext";
import { SENSITIVITY_PROFILES } from "@/lib/metrics";
import { formatDateLong, todayKey } from "@/lib/date";
import type { StepSensitivity } from "@/lib/types";

export default function StepsPage() {
  const { data, hydrated, addSteps, resetSteps, updateSettings } = useApp();
  const today = todayKey();
  const steps = data.activityLog[today]?.steps ?? 0;
  const goal = data.settings.stepGoal;
  const sensitivity = data.settings.stepSensitivity;
  const profile = SENSITIVITY_PROFILES[sensitivity];

  const [simulating, setSimulating] = useState(false);
  const [motionListening, setMotionListening] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const simTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMotionStep = useRef(0);
  const sensitivityRef = useRef(sensitivity);
  sensitivityRef.current = sensitivity;

  useEffect(() => {
    if (!simulating) {
      if (simTimer.current) clearInterval(simTimer.current);
      simTimer.current = null;
      return;
    }
    simTimer.current = setInterval(() => {
      const p = SENSITIVITY_PROFILES[sensitivityRef.current];
      addSteps(p.stepsPerTick);
    }, profile.tickIntervalMs);
    return () => {
      if (simTimer.current) clearInterval(simTimer.current);
      simTimer.current = null;
    };
    // re-arm interval when sensitivity changes while simulating
  }, [simulating, profile.tickIntervalMs, addSteps]);

  useEffect(() => {
    return () => {
      if (simTimer.current) clearInterval(simTimer.current);
    };
  }, []);

  async function startMotionSensor() {
    if (typeof window === "undefined") return;
    const w = window as typeof window & {
      DeviceMotionEvent?: { requestPermission?: () => Promise<"granted" | "denied"> };
    };
    try {
      if (w.DeviceMotionEvent?.requestPermission) {
        const result = await w.DeviceMotionEvent.requestPermission();
        if (result !== "granted") return;
      }
      window.addEventListener("devicemotion", handleDeviceMotion);
      setMotionListening(true);
    } catch {
      // sensor unavailable — simulated mode still works
    }
  }

  function stopMotionSensor() {
    window.removeEventListener("devicemotion", handleDeviceMotion);
    setMotionListening(false);
  }

  function handleDeviceMotion(event: DeviceMotionEvent) {
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;
    const magnitude = Math.sqrt(
      (acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2
    );
    const p = SENSITIVITY_PROFILES[sensitivityRef.current];
    const now = Date.now();
    if (
      Math.abs(magnitude - 9.81) > p.motionThreshold &&
      now - lastMotionStep.current > p.motionCooldownMs
    ) {
      lastMotionStep.current = now;
      addSteps(1);
    }
  }

  useEffect(() => {
    return () => window.removeEventListener("devicemotion", handleDeviceMotion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progress = goal > 0 ? steps / goal : 0;
  const percent = Math.round(Math.min(progress, 1) * 100);
  const remaining = Math.max(0, goal - steps);

  if (!hydrated) return <PageSkeleton />;

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Step Tracker</h1>
        <p className="text-sm text-slate-400">{formatDateLong(today)}</p>
      </header>

      <section className="card flex flex-col items-center gap-5">
        <ProgressRing progress={progress} size={220} stroke={16}>
          <span className="text-4xl font-extrabold tabular-nums">
            {steps.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400">of {goal.toLocaleString()} steps</span>
          <span className="mt-1 text-sm font-semibold text-brand-400">{percent}%</span>
        </ProgressRing>

        <p className="text-sm text-slate-400">
          {remaining > 0
            ? `${remaining.toLocaleString()} steps to reach your goal`
            : "Daily goal reached — keep going!"}
        </p>

        <div className="grid w-full grid-cols-2 gap-3">
          <button
            className="btn-primary text-base"
            onClick={() => addSteps(profile.manualIncrement)}
            aria-label={`Add ${profile.manualIncrement} steps`}
          >
            + {profile.manualIncrement} steps
          </button>
          <button
            className="btn-ghost text-base"
            onClick={() => addSteps(-profile.manualIncrement)}
            disabled={steps === 0}
            aria-label={`Subtract ${profile.manualIncrement} steps`}
          >
            − {profile.manualIncrement} steps
          </button>
        </div>

        <button
          className="btn-danger w-full"
          onClick={() => setConfirmReset(true)}
          disabled={steps === 0}
        >
          − / Reset steps to zero
        </button>

        {confirmReset && (
          <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3">
            <span className="text-sm text-rose-200">
              Clear today&apos;s {steps.toLocaleString()} steps?
            </span>
            <div className="flex gap-2">
              <button
                className="btn px-3 py-1.5 bg-rose-600 text-white hover:bg-rose-500"
                onClick={() => {
                  resetSteps();
                  setConfirmReset(false);
                  setSimulating(false);
                }}
              >
                Yes, reset
              </button>
              <button className="btn-ghost px-3 py-1.5" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Motion source</h2>
          <span className="chip">
            Sensitivity: {SENSITIVITY_PROFILES[sensitivity].label}
          </span>
        </div>
        <p className="text-sm text-slate-400">{profile.description}</p>

        <div className="grid grid-cols-2 gap-3">
          <button
            className={simulating ? "btn-danger" : "btn-primary"}
            onClick={() => setSimulating((s) => !s)}
          >
            {simulating ? "Stop simulation" : "Simulate walking"}
          </button>
          {motionListening ? (
            <button className="btn-ghost" onClick={stopMotionSensor}>
              Stop motion sensor
            </button>
          ) : (
            <button className="btn-ghost" onClick={startMotionSensor}>
              Use device motion
            </button>
          )}
        </div>

        <div>
          <span className="label">Quick sensitivity (full control in Settings)</span>
          <div className="flex gap-2">
            {(["low", "medium", "high"] as StepSensitivity[]).map((level) => (
              <button
                key={level}
                className={`btn flex-1 capitalize ${
                  sensitivity === level
                    ? "bg-brand-600 text-white"
                    : "border border-surface-border bg-surface-raised text-slate-300 hover:border-brand-600"
                }`}
                onClick={() => updateSettings({ stepSensitivity: level })}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="mb-3 font-semibold">Daily goal</h2>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1000}
            max={100000}
            step={500}
            className="input"
            value={goal}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (Number.isFinite(next) && next >= 1000) {
                updateSettings({ stepGoal: Math.min(next, 100000) });
              }
            }}
          />
          <span className="text-sm text-slate-400">steps / day</span>
        </div>
      </section>
    </main>
  );
}

function PageSkeleton() {
  return (
    <main className="space-y-6">
      <div className="h-8 w-40 animate-pulse rounded bg-surface-raised" />
      <div className="card flex justify-center py-10">
        <div className="h-52 w-52 animate-pulse rounded-full bg-surface-raised" />
      </div>
    </main>
  );
}

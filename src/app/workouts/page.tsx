"use client";

import { useEffect, useMemo, useState } from "react";
import RestTimer from "@/components/RestTimer";
import { useApp } from "@/context/AppContext";
import { WEEKDAY_NAMES, WEEKDAY_SHORT, todayKey, weekdayIndex } from "@/lib/date";
import type { DayPlan, ExercisePlan } from "@/lib/types";

export default function WorkoutsPage() {
  const { data, hydrated } = useApp();
  const [selectedDay, setSelectedDay] = useState<number>(weekdayIndex());
  const [editMode, setEditMode] = useState(false);

  if (!hydrated) return <PageSkeleton />;

  const plan = data.workoutPlan[selectedDay];
  const isToday = selectedDay === weekdayIndex();

  return (
    <main className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workouts</h1>
          <p className="text-sm text-slate-400">Your weekly schedule — fully customizable</p>
        </div>
        <button
          className={editMode ? "btn bg-brand-600 text-white" : "btn-ghost"}
          onClick={() => setEditMode((e) => !e)}
        >
          {editMode ? "Done editing" : "Customize"}
        </button>
      </header>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {data.workoutPlan.map((d) => {
          const active = d.day === selectedDay;
          const today = d.day === weekdayIndex();
          return (
            <button
              key={d.day}
              onClick={() => setSelectedDay(d.day)}
              className={`flex min-w-14 flex-col items-center rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                active
                  ? "border-brand-500 bg-brand-600/20 text-brand-300"
                  : "border-surface-border bg-surface-card text-slate-400 hover:border-brand-700"
              }`}
            >
              <span>{WEEKDAY_SHORT[d.day]}</span>
              {today && <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-brand-400" />}
            </button>
          );
        })}
      </div>

      {editMode ? (
        <DayEditor plan={plan} />
      ) : (
        <WorkoutSession plan={plan} isToday={isToday} />
      )}
    </main>
  );
}

/* ---------------- Live workout session (set/rep logger + rest timer) ------- */

function WorkoutSession({ plan, isToday }: { plan: DayPlan; isToday: boolean }) {
  const { data, initSetLogs, toggleSetDone, updateSetLog, markWorkoutDone } = useApp();
  const [restTrigger, setRestTrigger] = useState(0);
  const today = todayKey();
  const workoutDone = data.activityLog[today]?.workoutDone ?? false;

  const dayLogs = data.setLogs[today] ?? {};

  useEffect(() => {
    for (const ex of plan.exercises) {
      const logs = data.setLogs[today]?.[ex.id];
      if (!logs || logs.length !== ex.sets) initSetLogs(ex.id, ex.sets);
    }
  }, [plan.exercises, data.setLogs, today, initSetLogs]);

  const completion = useMemo(() => {
    let total = 0;
    let done = 0;
    for (const ex of plan.exercises) {
      total += ex.sets;
      const logs = dayLogs[ex.id] ?? [];
      done += logs.filter((s) => s.done).length;
    }
    return { total, done };
  }, [plan.exercises, dayLogs]);

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{WEEKDAY_NAMES[plan.day]}</h2>
            <p className="text-sm font-medium text-brand-400">{plan.title}</p>
          </div>
          {plan.exercises.length > 0 && (
            <span className="chip">
              {completion.done}/{completion.total} sets
            </span>
          )}
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-raised">
          <div
            className="h-full rounded-full bg-brand-500 transition-all duration-500"
            style={{
              width: `${completion.total ? (completion.done / completion.total) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {plan.exercises.length === 0 ? (
        <div className="card py-10 text-center text-slate-400">
          Rest day — no exercises scheduled.
          <br />
          Tap <span className="font-semibold text-brand-400">Customize</span> to add some.
        </div>
      ) : (
        plan.exercises.map((ex) => {
          const logs = dayLogs[ex.id] ?? [];
          return (
            <div key={ex.id} className="card space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">{ex.name}</h3>
                <span className="chip whitespace-nowrap">
                  {ex.sets} × {ex.reps}
                </span>
              </div>
              <div className="space-y-2">
                {Array.from({ length: ex.sets }, (_, i) => {
                  const log = logs[i] ?? { reps: 0, weightKg: 0, done: false };
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2 rounded-xl border p-2 ${
                        log.done
                          ? "border-brand-600/50 bg-brand-600/10"
                          : "border-surface-border bg-surface-raised"
                      }`}
                    >
                      <button
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold ${
                          log.done
                            ? "border-brand-500 bg-brand-600 text-white"
                            : "border-surface-border bg-surface-card text-slate-400 hover:border-brand-600"
                        }`}
                        onClick={() => {
                          if (!log.done) setRestTrigger((t) => t + 1);
                          toggleSetDone(ex.id, i);
                        }}
                        aria-label={`Toggle set ${i + 1} of ${ex.name}`}
                      >
                        {i + 1}
                      </button>
                      <label className="flex flex-1 items-center gap-1.5 text-xs text-slate-400">
                        Reps
                        <input
                          type="number"
                          min={0}
                          className="input !w-20 !px-2 !py-1.5 text-center"
                          value={log.reps || ""}
                          placeholder="0"
                          onChange={(e) => {
                            updateSetLog(ex.id, i, { reps: Math.max(0, Number(e.target.value) || 0) });
                          }}
                        />
                      </label>
                      <label className="flex flex-1 items-center gap-1.5 text-xs text-slate-400">
                        kg
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          className="input !w-20 !px-2 !py-1.5 text-center"
                          value={log.weightKg || ""}
                          placeholder="0"
                          onChange={(e) => {
                            updateSetLog(ex.id, i, {
                              weightKg: Math.max(0, Number(e.target.value) || 0),
                            });
                          }}
                        />
                      </label>
                      <span className={`text-sm ${log.done ? "text-brand-400" : "text-slate-600"}`}>
                        {log.done ? "✓" : "○"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      <RestTimer
        defaultSeconds={data.settings.defaultRestSeconds}
        trigger={restTrigger}
      />

      {isToday && plan.exercises.length > 0 && (
        <button
          className={workoutDone ? "btn-ghost w-full" : "btn-primary w-full"}
          onClick={() => markWorkoutDone(!workoutDone)}
        >
          {workoutDone ? "Mark workout as not done" : "Mark workout complete"}
        </button>
      )}
    </div>
  );
}

/* ---------------- Day / schedule editor ----------------------------------- */

function DayEditor({ plan }: { plan: DayPlan }) {
  const { updateDayPlan, addExercise, updateExercise, deleteExercise, moveExercise } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", sets: 3, reps: "10" });

  function submitAdd() {
    if (!draft.name.trim()) return;
    addExercise(plan.day, {
      name: draft.name.trim(),
      sets: Math.max(1, Math.min(20, draft.sets)),
      reps: draft.reps.trim() || "10",
    });
    setDraft({ name: "", sets: 3, reps: "10" });
    setAdding(false);
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-2">
        <span className="label">{WEEKDAY_NAMES[plan.day]} — session title</span>
        <input
          className="input"
          value={plan.title}
          onChange={(e) => updateDayPlan(plan.day, { title: e.target.value })}
          placeholder="e.g. Push Day, Rest, Cardio…"
        />
        <p className="text-xs text-slate-500">
          Rename this day, reorder it below, or leave it empty to make it a rest day.
        </p>
      </div>

      {plan.exercises.map((ex, idx) => (
        <div key={ex.id} className="card">
          {editingId === ex.id ? (
            <ExerciseForm
              initial={ex}
              onSave={(patch) => {
                updateExercise(plan.day, ex.id, patch);
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold">{ex.name}</p>
                <p className="text-xs text-slate-400">
                  {ex.sets} sets × {ex.reps} reps
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  className="btn-ghost !px-2 !py-1 text-xs"
                  onClick={() => moveExercise(plan.day, ex.id, -1)}
                  disabled={idx === 0}
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  className="btn-ghost !px-2 !py-1 text-xs"
                  onClick={() => moveExercise(plan.day, ex.id, 1)}
                  disabled={idx === plan.exercises.length - 1}
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button
                  className="btn-ghost !px-2 !py-1 text-xs"
                  onClick={() => setEditingId(ex.id)}
                >
                  Edit
                </button>
                <button
                  className="btn-danger !px-2 !py-1 text-xs"
                  onClick={() => deleteExercise(plan.day, ex.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {adding ? (
        <div className="card">
          <ExerciseForm
            initial={{ name: draft.name, sets: draft.sets, reps: draft.reps }}
            saveLabel="Add exercise"
            onSave={(patch) => {
              if (!patch.name?.trim()) return;
              addExercise(plan.day, {
                name: patch.name.trim(),
                sets: patch.sets ?? 3,
                reps: patch.reps?.trim() || "10",
              });
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      ) : (
        <button className="btn-primary w-full" onClick={() => setAdding(true)}>
          + Add exercise to {WEEKDAY_SHORT[plan.day]}
        </button>
      )}
    </div>
  );
}

function ExerciseForm({
  initial,
  onSave,
  onCancel,
  saveLabel = "Save",
}: {
  initial: Pick<ExercisePlan, "name" | "sets" | "reps">;
  onSave: (patch: { name: string; sets: number; reps: string }) => void;
  onCancel: () => void;
  saveLabel?: string;
}) {
  const [name, setName] = useState(initial.name);
  const [sets, setSets] = useState(initial.sets);
  const [reps, setReps] = useState(initial.reps);

  return (
    <div className="space-y-3">
      <div>
        <span className="label">Exercise name</span>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Bench Press"
          autoFocus
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="label">Sets</span>
          <input
            type="number"
            min={1}
            max={20}
            className="input"
            value={sets}
            onChange={(e) => setSets(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
          />
        </div>
        <div>
          <span className="label">Reps (free text)</span>
          <input
            className="input"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="8-10, 30 sec, 12 / leg"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          className="btn-primary flex-1"
          onClick={() => onSave({ name, sets, reps })}
          disabled={!name.trim()}
        >
          {saveLabel}
        </button>
        <button className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <main className="space-y-5">
      <div className="h-8 w-48 animate-pulse rounded bg-surface-raised" />
      <div className="card h-40 animate-pulse" />
    </main>
  );
}

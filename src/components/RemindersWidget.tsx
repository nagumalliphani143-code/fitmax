"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { todayKey } from "@/lib/date";
import type { Reminder } from "@/lib/types";

function minutesUntil(timeHHMM: string, now: Date): number {
  const [h, m] = timeHHMM.split(":").map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 60000);
}

function formatCountdown(mins: number): string {
  if (mins <= 0) return "now";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `in ${h}h ${m}m`;
  return `in ${m}m`;
}

export default function RemindersWidget() {
  const { data, addWater, addReminder, updateReminder, deleteReminder } = useApp();
  const [now, setNow] = useState(() => new Date());
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ type: "water" as Reminder["type"], time: "12:00", label: "" });

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const today = todayKey();
  const water = data.activityLog[today]?.waterGlasses ?? 0;
  const waterGoal = data.settings.waterGoalGlasses;

  const sorted = useMemo(
    () =>
      [...data.reminders].sort((a, b) => {
        if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
        return a.time.localeCompare(b.time);
      }),
    [data.reminders]
  );

  const nextUp = sorted.find(
    (r) => r.enabled && minutesUntil(r.time, now) > -30
  );

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Reminders & Water</h2>
        <button className="btn-ghost !px-3 !py-1 text-xs" onClick={() => setAdding((a) => !a)}>
          {adding ? "Close" : "+ Add reminder"}
        </button>
      </div>

      <div className="rounded-xl border border-surface-border bg-surface-raised p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">💧 Water today</span>
          <span className="tabular-nums text-slate-400">
            {water} / {waterGoal} glasses
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex flex-1 gap-1">
            {Array.from({ length: waterGoal }, (_, i) => (
              <span
                key={i}
                className={`h-2.5 flex-1 rounded-full ${i < water ? "bg-sky-400" : "bg-surface-border"}`}
              />
            ))}
          </div>
          <button className="btn-ghost !px-3 !py-1 text-sm" onClick={() => addWater(-1)} disabled={water === 0}>
            −
          </button>
          <button className="btn-primary !px-4 !py-1 text-sm" onClick={() => addWater(1)}>
            +1 glass
          </button>
        </div>
      </div>

      {nextUp && (
        <p className="text-xs text-slate-400">
          Next: <span className="font-semibold text-brand-400">{nextUp.label || nextUp.type}</span>{" "}
          at {nextUp.time} ({formatCountdown(minutesUntil(nextUp.time, now))})
        </p>
      )}

      {adding && (
        <div className="space-y-2 rounded-xl border border-brand-600/40 bg-brand-600/5 p-3">
          <div className="flex gap-2">
            <select
              className="input !w-auto"
              value={draft.type}
              onChange={(e) => setDraft({ ...draft, type: e.target.value as Reminder["type"] })}
            >
              <option value="water">Water</option>
              <option value="workout">Workout</option>
            </select>
            <input
              type="time"
              className="input !w-auto"
              value={draft.time}
              onChange={(e) => setDraft({ ...draft, time: e.target.value })}
            />
          </div>
          <input
            className="input"
            placeholder="Label (e.g. Post-workout protein)"
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          />
          <button
            className="btn-primary w-full"
            onClick={() => {
              addReminder({
                type: draft.type,
                time: draft.time,
                label: draft.label.trim() || (draft.type === "water" ? "Drink water" : "Time to train"),
                enabled: true,
              });
              setDraft({ type: "water", time: "12:00", label: "" });
              setAdding(false);
            }}
          >
            Save reminder
          </button>
        </div>
      )}

      <ul className="space-y-2">
        {sorted.length === 0 && <li className="text-sm text-slate-500">No reminders set.</li>}
        {sorted.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between gap-2 rounded-xl border border-surface-border bg-surface-raised px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span>{r.type === "water" ? "💧" : "🏋️"}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{r.label}</p>
                <p className="text-xs text-slate-400 tabular-nums">{r.time}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                role="switch"
                aria-checked={r.enabled}
                aria-label={`Toggle ${r.label}`}
                className={`h-6 w-11 rounded-full p-0.5 transition ${r.enabled ? "bg-brand-600" : "bg-surface-border"}`}
                onClick={() => updateReminder(r.id, { enabled: !r.enabled })}
              >
                <span
                  className={`block h-5 w-5 rounded-full bg-white transition-transform ${r.enabled ? "translate-x-5" : ""}`}
                />
              </button>
              <button
                className="text-slate-500 transition hover:text-rose-400"
                onClick={() => deleteReminder(r.id)}
                aria-label={`Delete ${r.label}`}
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { useState } from "react";
import { dateKey } from "@/lib/date";
import { isDayActive } from "@/lib/streaks";
import type { ActivityLog } from "@/lib/types";

export default function ActivityCalendar({ activityLog }: { activityLog: ActivityLog }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const now = new Date();
  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // shift so the grid starts on Monday
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const todayStr = dateKey(now);

  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => dateKey(new Date(year, month, i + 1))),
  ];

  const monthLabel = viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const activeCount = cells.filter((k) => k && isDayActive(activityLog, k)).length;

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Activity Calendar</h2>
        <span className="chip">{activeCount} active days</span>
      </div>
      <div className="flex items-center justify-between">
        <button
          className="btn-ghost !px-3 !py-1 text-xs"
          onClick={() => setMonthOffset((m) => m - 1)}
          aria-label="Previous month"
        >
          ←
        </button>
        <span className="text-sm font-medium text-slate-300">{monthLabel}</span>
        <button
          className="btn-ghost !px-3 !py-1 text-xs"
          onClick={() => setMonthOffset((m) => Math.min(0, m + 1))}
          disabled={monthOffset >= 0}
          aria-label="Next month"
        >
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-500">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((key, i) =>
          key === null ? (
            <span key={`empty-${i}`} />
          ) : (
            <CalendarCell key={key} dayKey={key} activityLog={activityLog} isToday={key === todayStr} />
          )
        )}
      </div>
      <div className="flex flex-wrap gap-3 text-[10px] text-slate-500">
        <LegendDot className="bg-brand-500" label="Fully active" />
        <LegendDot className="bg-brand-800" label="Light activity" />
        <LegendDot className="bg-surface-raised border border-surface-border" label="None" />
      </div>
    </div>
  );
}

function CalendarCell({
  dayKey,
  activityLog,
  isToday,
}: {
  dayKey: string;
  activityLog: ActivityLog;
  isToday: boolean;
}) {
  const day = activityLog[dayKey];
  const active = isDayActive(activityLog, dayKey);
  const strong =
    active &&
    ((day?.steps ?? 0) >= 5000 || day?.workoutDone === true);
  const dayNum = Number(dayKey.slice(-2));

  return (
    <div
      title={`${dayKey}${day ? ` — ${day.steps} steps, ${day.waterGlasses} glasses${day.workoutDone ? ", workout done" : ""}` : " — no activity"}`}
      className={`flex aspect-square items-center justify-center rounded-lg text-xs font-medium ${
        strong
          ? "bg-brand-500 text-white"
          : active
            ? "bg-brand-800 text-brand-100"
            : "bg-surface-raised text-slate-500"
      } ${isToday ? "ring-2 ring-brand-400" : ""}`}
    >
      {dayNum}
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-2.5 w-2.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}

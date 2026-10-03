"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { addDays, formatDateLong, todayKey } from "@/lib/date";
import { MEAL_TYPES, type FoodEntry, type MealType } from "@/lib/types";

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snacks: "Snacks",
};

interface DraftEntry {
  name: string;
  calories: string;
  proteinG: string;
  carbsG: string;
  fatsG: string;
}

const EMPTY_DRAFT: DraftEntry = { name: "", calories: "", proteinG: "", carbsG: "", fatsG: "" };

export default function FoodPage() {
  const { data, hydrated, metrics, addFoodEntry, updateFoodEntry, deleteFoodEntry } = useApp();
  const [date, setDate] = useState(todayKey());
  const [mealFilter, setMealFilter] = useState<MealType | null>(null);
  const [addingTo, setAddingTo] = useState<MealType | null>(null);
  const [draft, setDraft] = useState<DraftEntry>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);

  const entriesForDate = useMemo(
    () => data.foodLog.filter((e) => e.date === date),
    [data.foodLog, date]
  );

  const totals = useMemo(() => {
    return entriesForDate.reduce(
      (acc, e) => ({
        calories: acc.calories + e.calories,
        proteinG: acc.proteinG + e.proteinG,
        carbsG: acc.carbsG + e.carbsG,
        fatsG: acc.fatsG + e.fatsG,
      }),
      { calories: 0, proteinG: 0, carbsG: 0, fatsG: 0 }
    );
  }, [entriesForDate]);

  if (!hydrated) return <PageSkeleton />;

  const remaining = metrics.calorieTarget - totals.calories;

  function submitEntry(meal: MealType) {
    if (!draft.name.trim()) return;
    const entry = {
      date,
      meal,
      name: draft.name.trim(),
      calories: num(draft.calories),
      proteinG: num(draft.proteinG),
      carbsG: num(draft.carbsG),
      fatsG: num(draft.fatsG),
    };
    addFoodEntry(entry);
    setDraft(EMPTY_DRAFT);
    setAddingTo(null);
  }

  function submitEdit(entry: FoodEntry) {
    updateFoodEntry(entry.id, {
      name: entry.name.trim(),
      calories: entry.calories,
      proteinG: entry.proteinG,
      carbsG: entry.carbsG,
      fatsG: entry.fatsG,
    });
    setEditingId(null);
  }

  function shiftDate(days: number) {
    setDate((d) => {
      const [y, m, dd] = d.split("-").map(Number);
      return todayOf(addDays(new Date(y, m - 1, dd), days));
    });
  }

  return (
    <main className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Food Log</h1>
        <p className="text-sm text-slate-400">100% manual — you type every item and macro</p>
      </header>

      <div className="card flex items-center justify-between gap-3">
        <button className="btn-ghost !px-3 !py-1.5" onClick={() => shiftDate(-1)} aria-label="Previous day">
          ←
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold">{formatDateLong(date)}</p>
          {date !== todayKey() && (
            <button className="text-xs text-brand-400 hover:underline" onClick={() => setDate(todayKey())}>
              Jump to today
            </button>
          )}
        </div>
        <button className="btn-ghost !px-3 !py-1.5" onClick={() => shiftDate(1)} aria-label="Next day">
          →
        </button>
      </div>

      <div className="card">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-slate-400">Calories consumed</span>
          <span className="text-sm text-slate-400">
            target {metrics.calorieTarget.toLocaleString()}
          </span>
        </div>
        <p className="mt-1 text-3xl font-extrabold tabular-nums">
          {totals.calories.toLocaleString()}
          <span
            className={`ml-2 text-sm font-semibold ${
              remaining >= 0 ? "text-brand-400" : "text-rose-400"
            }`}
          >
            {remaining >= 0
              ? `${remaining.toLocaleString()} left`
              : `${Math.abs(remaining).toLocaleString()} over`}
          </span>
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <MacroStat label="Protein" value={totals.proteinG} target={metrics.macros.proteinG} unit="g" />
          <MacroStat label="Carbs" value={totals.carbsG} target={metrics.macros.carbsG} unit="g" />
          <MacroStat label="Fats" value={totals.fatsG} target={metrics.macros.fatsG} unit="g" />
        </div>
      </div>

      {MEAL_TYPES.filter((m) => mealFilter === null || mealFilter === m).map((meal) => {
        const entries = entriesForDate.filter((e) => e.meal === meal);
        const mealCalories = entries.reduce((s, e) => s + e.calories, 0);
        return (
          <section key={meal} className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">
                {MEAL_LABELS[meal]}
                <span className="ml-2 text-xs font-normal text-slate-400">
                  {mealCalories.toLocaleString()} kcal
                </span>
              </h2>
              <button
                className="btn-ghost !px-3 !py-1.5 text-xs"
                onClick={() => {
                  setDraft(EMPTY_DRAFT);
                  setAddingTo(addingTo === meal ? null : meal);
                }}
              >
                {addingTo === meal ? "Cancel" : "+ Add food"}
              </button>
            </div>

            {addingTo === meal && (
              <EntryForm
                draft={draft}
                setDraft={setDraft}
                onSubmit={() => submitEntry(meal)}
                submitLabel="Add to log"
              />
            )}

            {entries.length === 0 && addingTo !== meal && (
              <p className="text-sm text-slate-500">Nothing logged yet.</p>
            )}

            {entries.map((entry) =>
              editingId === entry.id ? (
                <EditEntryForm
                  key={entry.id}
                  entry={entry}
                  onSave={submitEdit}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-surface-border bg-surface-raised p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{entry.name}</p>
                    <p className="text-xs text-slate-400 tabular-nums">
                      {entry.calories} kcal · P {entry.proteinG}g · C {entry.carbsG}g · F{" "}
                      {entry.fatsG}g
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      className="btn-ghost !px-2 !py-1 text-xs"
                      onClick={() => setEditingId(entry.id)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-danger !px-2 !py-1 text-xs"
                      onClick={() => deleteFoodEntry(entry.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            )}
          </section>
        );
      })}

      <div className="flex flex-wrap gap-2">
        <button
          className={`chip cursor-pointer ${mealFilter === null ? "!border-brand-500 !text-brand-300" : ""}`}
          onClick={() => setMealFilter(null)}
        >
          All meals
        </button>
        {MEAL_TYPES.map((m) => (
          <button
            key={m}
            className={`chip cursor-pointer ${mealFilter === m ? "!border-brand-500 !text-brand-300" : ""}`}
            onClick={() => setMealFilter(mealFilter === m ? null : m)}
          >
            {MEAL_LABELS[m]}
          </button>
        ))}
      </div>
    </main>
  );
}

function MacroStat({
  label,
  value,
  target,
  unit,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div className="rounded-xl border border-surface-border bg-surface-raised p-2">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-bold tabular-nums">
        {Math.round(value)}
        {unit}
        <span className="text-xs font-normal text-slate-500"> / {target}{unit}</span>
      </p>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-border">
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function EntryForm({
  draft,
  setDraft,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  draft: DraftEntry;
  setDraft: (d: DraftEntry) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  submitLabel: string;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-brand-600/40 bg-brand-600/5 p-3">
      <input
        className="input"
        placeholder="Food item name (typed manually)"
        value={draft.name}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        autoFocus
      />
      <div className="grid grid-cols-4 gap-2">
        <NumField label="kcal" value={draft.calories} onChange={(v) => setDraft({ ...draft, calories: v })} />
        <NumField label="Protein g" value={draft.proteinG} onChange={(v) => setDraft({ ...draft, proteinG: v })} />
        <NumField label="Carbs g" value={draft.carbsG} onChange={(v) => setDraft({ ...draft, carbsG: v })} />
        <NumField label="Fats g" value={draft.fatsG} onChange={(v) => setDraft({ ...draft, fatsG: v })} />
      </div>
      <div className="flex gap-2">
        <button className="btn-primary flex-1" onClick={onSubmit} disabled={!draft.name.trim()}>
          {submitLabel}
        </button>
        {onCancel && (
          <button className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function EditEntryForm({
  entry,
  onSave,
  onCancel,
}: {
  entry: FoodEntry;
  onSave: (entry: FoodEntry) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<DraftEntry>({
    name: entry.name,
    calories: String(entry.calories),
    proteinG: String(entry.proteinG),
    carbsG: String(entry.carbsG),
    fatsG: String(entry.fatsG),
  });

  return (
    <EntryForm
      draft={draft}
      setDraft={setDraft}
      submitLabel="Save changes"
      onCancel={onCancel}
      onSubmit={() =>
        onSave({
          ...entry,
          name: draft.name,
          calories: num(draft.calories),
          proteinG: num(draft.proteinG),
          carbsG: num(draft.carbsG),
          fatsG: num(draft.fatsG),
        })
      }
    />
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="label !text-[10px]">{label}</span>
      <input
        type="number"
        min={0}
        step={label === "kcal" ? 1 : 0.5}
        className="input !px-2 !py-2 text-center"
        value={value}
        placeholder="0"
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function num(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 10) / 10 : 0;
}

function todayOf(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function PageSkeleton() {
  return (
    <main className="space-y-5">
      <div className="h-8 w-40 animate-pulse rounded bg-surface-raised" />
      <div className="card h-32 animate-pulse" />
    </main>
  );
}

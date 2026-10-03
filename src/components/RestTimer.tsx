"use client";

import { useEffect, useRef, useState } from "react";

interface RestTimerProps {
  defaultSeconds: number;
  /** increment to (re)start the countdown */
  trigger: number;
  onFinish?: () => void;
}

const PRESETS = [30, 60, 90, 120];

export default function RestTimer({ defaultSeconds, trigger, onFinish }: RestTimerProps) {
  const [total, setTotal] = useState(defaultSeconds);
  const [remaining, setRemaining] = useState(defaultSeconds);
  const [running, setRunning] = useState(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    if (trigger === 0) return;
    setTotal(defaultSeconds);
    setRemaining(defaultSeconds);
    setRunning(true);
  }, [trigger, defaultSeconds]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          setRunning(false);
          onFinishRef.current?.();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  function restart(seconds: number) {
    setTotal(seconds);
    setRemaining(seconds);
    setRunning(true);
  }

  const done = remaining === 0 && !running;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Rest Timer</h3>
        <span
          className={`rounded-full px-3 py-1 font-mono text-2xl font-bold tabular-nums ${
            done
              ? "bg-brand-600/20 text-brand-400"
              : running
                ? "bg-amber-500/15 text-amber-400"
                : "bg-surface-raised text-slate-300"
          }`}
        >
          {done ? "GO!" : `${mm}:${ss}`}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            className={`btn px-3 py-1.5 text-xs ${
              total === p
                ? "bg-brand-600 text-white"
                : "border border-surface-border bg-surface-raised text-slate-300 hover:border-brand-600"
            }`}
            onClick={() => restart(p)}
          >
            {p}s
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          className="btn-primary flex-1"
          onClick={() => setRunning((r) => !r)}
          disabled={done}
        >
          {running ? "Pause" : remaining < total ? "Resume" : "Start"}
        </button>
        <button className="btn-ghost" onClick={() => restart(total)}>
          Restart
        </button>
        <button
          className="btn-ghost"
          onClick={() => {
            setRunning(false);
            setRemaining(0);
            onFinishRef.current?.();
          }}
          disabled={done}
        >
          Skip
        </button>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/steps", label: "Steps", icon: StepsIcon },
  { href: "/workouts", label: "Workouts", icon: DumbbellIcon },
  { href: "/food", label: "Food", icon: FoodIcon },
  { href: "/settings", label: "Settings", icon: GearIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-surface-border bg-surface-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-stretch justify-around">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
                active ? "text-brand-400" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" />
    </svg>
  );
}

function StepsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 4v7l4 3v6M7 20v-6l4-3V4" />
      <circle cx="13" cy="3" r="1" />
      <circle cx="7" cy="3" r="1" />
    </svg>
  );
}

function DumbbellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path strokeLinecap="round" d="M6.5 6.5v11M3.5 9v5M17.5 6.5v11M20.5 9v5M6.5 12h11" />
    </svg>
  );
}

function FoodIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 3v8a2 2 0 0 0 4 0V3M8 11v10M17 3c-1.5 2-2 4-2 7h4c0-3-.5-5-2-7ZM17 10v11" />
    </svg>
  );
}

function GearIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.4 15-.9.5a1.7 1.7 0 0 0-.8 1.9l.2 1a1.7 1.7 0 0 1-1.1 2l-1 .4a1.7 1.7 0 0 1-2-.6l-.6-.8a1.7 1.7 0 0 0-2 0l-.6.8a1.7 1.7 0 0 1-2 .6l-1-.4a1.7 1.7 0 0 1-1.1-2l.2-1a1.7 1.7 0 0 0-.8-1.9l-.9-.5a1.7 1.7 0 0 1-.7-2.2l.4-1a1.7 1.7 0 0 1 1.7-1l1 .1a1.7 1.7 0 0 0 1.6-1l.3-1a1.7 1.7 0 0 1 2-1.2l1 .2a1.7 1.7 0 0 1 1.3 1.6v1a1.7 1.7 0 0 0 1 1.6l.9.4a1.7 1.7 0 0 1 .8 2.2l-.3 1Z" />
    </svg>
  );
}

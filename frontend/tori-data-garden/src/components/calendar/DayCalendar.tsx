import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { ScheduleEvent } from "./ScheduleCalendar";

interface DayCalendarProps {
  date: Date;
  events: ScheduleEvent[];
  hours?: { start: number; end: number };
  className?: string;
  onEventClick?: (ev: ScheduleEvent) => void;
}

function clamp(n: number, min: number, max: number) { return Math.min(Math.max(n, min), max); }

export default function DayCalendar({ date, events, hours = { start: 8, end: 20 }, className, onEventClick }: DayCalendarProps) {
  const hourBlocks = useMemo(() => { const a:number[]=[]; for(let h=hours.start; h<=hours.end; h++) a.push(h); return a; }, [hours.start, hours.end]);
  const list = useMemo(() => events.filter((ev) => {
    const s = new Date(ev.start);
    return s.toDateString() === date.toDateString();
  }), [events, date]);

  function getTopPct(dt: Date) {
    const total = (hours.end - hours.start) * 60;
    const minutes = dt.getHours() * 60 + dt.getMinutes() - hours.start * 60;
    const clamped = clamp(minutes, 0, total);
    return (clamped / total) * 100;
  }
  function getHeightPct(s: Date, e: Date) {
    const total = (hours.end - hours.start) * 60;
    const mins = Math.max(15, (e.getTime() - s.getTime()) / 60000);
    const clamped = clamp(mins, 15, total);
    return (clamped / total) * 100;
  }

  const now = new Date();
  const isToday = now.toDateString() === date.toDateString();

  return (
    <div className={cn("rounded-xl border bg-card overflow-hidden", className)}>
      <div className="grid" style={{ gridTemplateColumns: "90px minmax(0,1fr)" }}>
        <div className="bg-card/60 backdrop-blur sticky top-0 z-10 border-b h-16" />
        <div className="bg-card/60 backdrop-blur sticky top-0 z-10 border-b h-16 flex items-center px-4">
          <div className="text-xl font-semibold">
            {date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </div>
        </div>
      </div>
      <div className="relative" style={{ height: "calc(100vh - 9.5rem)" }}>
        <div className="grid" style={{ gridTemplateColumns: "90px minmax(0,1fr)", height: "100%" }}>
          <div className="relative border-r">
            {hourBlocks.map((h, i) => (
              <div key={i} className="h-[calc(100%/(var(--hours)))]">
                <div className="absolute -mt-3 right-2 text-xs text-muted-foreground">
                  {h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`}
                </div>
              </div>
            ))}
          </div>
          <div
            className="relative"
            style={{
              backgroundImage: `repeating-linear-gradient(to bottom, rgb(var(--border) / 0.25), rgb(var(--border) / 0.25) 1px, transparent 1px, transparent calc(100% / ${hours.end - hours.start}))`,
              backgroundSize: `100% calc(100% / ${hours.end - hours.start})`,
            }}
          >
            <div className="absolute inset-0">
              {list.map((ev) => {
                const s = new Date(ev.start);
                const e = new Date(ev.end);
                const top = getTopPct(s);
                const height = getHeightPct(s, e);
                return (
                  <button
                    key={ev.id}
                    onClick={() => onEventClick?.(ev)}
                    className="absolute left-2 right-2 rounded-lg text-left p-2 shadow-sm border bg-primary/10 hover:bg-primary/20 border-primary/20 transition-all hover:shadow-md hover:-translate-y-[1px]"
                    style={{ top: `${top}%`, height: `${height}%` }}
                  >
                    <div className="text-[13px] font-semibold truncate">{ev.title}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {s.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {e.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </button>
                );
              })}
            </div>
            {isToday && (
              <div className="absolute left-0 right-0" style={{ top: `${getTopPct(now)}%` }}>
                <div className="relative">
                  <div className="absolute -left-1 top-[-3px] h-2 w-2 rounded-full bg-red-500 shadow" />
                  <div className="h-[2px] w-full bg-red-500/70" />
                </div>
              </div>
            )}
          </div>
        </div>
        <style>{`:root { --hours: ${hours.end - hours.start}; }`}</style>
      </div>
    </div>
  );
}

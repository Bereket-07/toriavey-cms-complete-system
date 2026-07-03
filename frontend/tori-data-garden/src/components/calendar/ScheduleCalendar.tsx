import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Instagram, Youtube, MessageSquare } from "lucide-react";

export type ScheduleEvent = {
  id: string;
  title: string;
  start: string; // ISO datetime
  end: string;   // ISO datetime
  platforms?: string[]; // e.g., ["IG", "YT"]
  color?: string; // optional accent color
};

interface ScheduleCalendarProps {
  weekStart: Date; // Monday of the week
  events: ScheduleEvent[];
  hours?: { start: number; end: number }; // 0-24
  className?: string;
  onEventClick?: (event: ScheduleEvent) => void;
}

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

export function ScheduleCalendar({
  weekStart,
  events,
  hours = { start: 8, end: 20 },
  className,
  onEventClick,
}: ScheduleCalendarProps) {
  const days = useMemo(() => {
    const d: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      d.push(day);
    }
    return d;
  }, [weekStart]);

  const hourBlocks = useMemo(() => {
    const list: number[] = [];
    for (let h = hours.start; h <= hours.end; h++) list.push(h);
    return list;
  }, [hours.start, hours.end]);

  const now = new Date();
  const isCurrentWeek = now >= days[0] && now < new Date(days[6].getTime() + 24 * 60 * 60 * 1000);

  // Group events by day index 0..6
  const eventsByDay = useMemo(() => {
    const map: Record<number, ScheduleEvent[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    events.forEach((ev) => {
      const start = new Date(ev.start);
      const idx = (start.getDay() + 6) % 7; // Mon=0 .. Sun=6
      if (map[idx]) map[idx].push(ev);
    });
    // sort by start time
    Object.values(map).forEach((arr) => arr.sort((a, b) => +new Date(a.start) - +new Date(b.start)));
    return map;
  }, [events]);

  function getTopPct(date: Date) {
    const total = (hours.end - hours.start) * 60;
    const minutes = date.getHours() * 60 + date.getMinutes() - hours.start * 60;
    const clamped = clamp(minutes, 0, total);
    return (clamped / total) * 100;
  }

  function getHeightPct(start: Date, end: Date) {
    const total = (hours.end - hours.start) * 60;
    const minutes = Math.max(15, (end.getTime() - start.getTime()) / 60000); // minimum 15 minutes
    const clamped = clamp(minutes, 15, total);
    return (clamped / total) * 100;
  }

  function getDayLabel(d: Date, i: number) {
    const isToday = new Date().toDateString() === d.toDateString();
    return (
      <div className="flex items-center justify-between w-full">
        <div className={cn("flex items-baseline gap-2", isToday && "text-primary font-semibold")}
             title={d.toLocaleDateString()}
        >
          <span className="text-sm text-muted-foreground">{dayNames[i]}</span>
          <span className="text-2xl leading-none">{d.getDate()}</span>
        </div>
        {isToday && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">Today</span>
        )}
      </div>
    );
  }

  const platformStyles: Record<string, { wrap: string; icon: React.ReactNode }> = {
    IG: { wrap: "bg-pink-500/10 border-pink-500/30 text-pink-800", icon: <Instagram className="h-3 w-3" /> },
    YT: { wrap: "bg-red-500/10 border-red-500/30 text-red-800", icon: <Youtube className="h-3 w-3" /> },
    Threads: { wrap: "bg-zinc-900/5 border-zinc-900/20 text-zinc-800", icon: <MessageSquare className="h-3 w-3" /> },
  };

  return (
    <div className={cn("rounded-2xl border bg-gradient-to-b from-muted/40 to-background shadow-sm overflow-hidden", className)}>
      {/* Header */}
      <div className="grid" style={{ gridTemplateColumns: "90px repeat(7, minmax(0, 1fr))" }}>
        <div className="bg-card/60 backdrop-blur sticky top-0 z-10 border-b h-16" />
        {days.map((d, i) => (
          <div key={i} className="bg-card/60 backdrop-blur sticky top-0 z-10 border-b h-16 flex items-center justify-start px-4">
            {getDayLabel(d, i)}
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="relative" style={{ height: "calc(100vh - 9.5rem)" }}>
        <div className="grid" style={{ gridTemplateColumns: "90px repeat(7, minmax(0, 1fr))", height: "100%" }}>
          {/* Time column */}
          <div className="relative border-r">
            {hourBlocks.map((h, idx) => (
              <div key={idx} className="h-[calc(100%/(var(--hours)))] relative" style={{
                // Using CSS var for consistency across rows
                // Will be set on container style below
              }}>
                <div className="absolute -top-3 right-2 text-xs text-muted-foreground tabular-nums">
                  {h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`}
                </div>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((d, dayIdx) => (
            <div
              key={dayIdx}
              className={cn(
                "relative border-r/50",
                dayIdx === 6 && "border-r-0",
                // Weekend subtle tint
                (dayIdx === 5 || dayIdx === 6) && "bg-muted/20",
                // Current day accent background
                new Date().toDateString() === d.toDateString() && "bg-primary/5"
              )}
              style={{
                // Row grid lines
                backgroundImage: `repeating-linear-gradient(to bottom, rgb(var(--border) / 0.25), rgb(var(--border) / 0.25) 1px, transparent 1px, transparent calc(100% / ${hours.end - hours.start}))`,
                backgroundSize: `100% calc(100% / ${hours.end - hours.start})`,
              }}
            >
              {/* Events layer */}
              <div className="absolute inset-0">
                {eventsByDay[dayIdx].map((ev) => {
                  const s = new Date(ev.start);
                  const e = new Date(ev.end);
                  const top = getTopPct(s);
                  const height = getHeightPct(s, e);
                  const singlePlatform = ev.platforms && ev.platforms.length === 1 ? ev.platforms[0] : undefined;
                  const style = singlePlatform && platformStyles[singlePlatform]
                    ? platformStyles[singlePlatform]
                    : { wrap: "bg-primary/10 border-primary/20 text-foreground", icon: null };
                  return (
                    <button
                      key={ev.id}
                      onClick={() => onEventClick?.(ev)}
                      className={cn(
                        "absolute left-2 right-2 rounded-lg text-left p-2 shadow-sm border",
                        "hover:shadow-md hover:-translate-y-[1px] transition-all",
                        style.wrap
                      )}
                      style={{ top: `${top}%`, height: `${height}%` }}
                    >
                      <div className="text-[13px] font-semibold truncate">{ev.title}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {s.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {e.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      {ev.platforms && (
                        <div className="mt-1 flex gap-1 flex-wrap">
                          {ev.platforms.map((p) => {
                            const meta = platformStyles[p] || { wrap: "bg-muted", icon: null };
                            return (
                              <Badge key={p} variant="secondary" className={cn("px-1.5 py-0.5 text-[10px] gap-1", meta.wrap)}>
                                {meta.icon}
                                <span>{p}</span>
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Now indicator */}
              {isCurrentWeek && d.toDateString() === now.toDateString() && (
                <div
                  className="absolute left-0 right-0"
                  style={{ top: `${getTopPct(now)}%` }}
                >
                  <div className="relative">
                    <div className="absolute -left-1 top-[-3px] h-2 w-2 rounded-full bg-red-500 shadow" />
                    <div className="h-[2px] w-full bg-red-500/70" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CSS variable for hour rows */}
        <style>{`:root { --hours: ${hours.end - hours.start}; }`}</style>
      </div>
    </div>
  );
}

export default ScheduleCalendar;

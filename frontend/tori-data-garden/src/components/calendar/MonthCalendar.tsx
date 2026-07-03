import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ScheduleEvent } from "./ScheduleCalendar";

const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function startOfMonth(d: Date) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfMonth(d: Date) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + 1);
  x.setDate(0);
  x.setHours(23, 59, 59, 999);
  return x;
}
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export interface MonthCalendarProps {
  month: Date; // any day within month
  events: ScheduleEvent[];
  className?: string;
  onDayClick?: (date: Date) => void;
  onEventClick?: (event: ScheduleEvent) => void;
}

export default function MonthCalendar({ month, events, className, onDayClick, onEventClick }: MonthCalendarProps) {
  const first = startOfMonth(month);
  const last = endOfMonth(month);

  // Grid starts on Sunday
  const gridStart = (() => {
    const d = new Date(first);
    const day = d.getDay(); // 0..6 Sun..Sat
    return addDays(d, -day);
  })();

  const days = useMemo(() => new Array(42).fill(0).map((_, i) => addDays(gridStart, i)), [gridStart]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    events.forEach((ev) => {
      const s = new Date(ev.start);
      const key = `${s.getFullYear()}-${s.getMonth()}-${s.getDate()}`;
      const arr = map.get(key) || [];
      arr.push(ev);
      map.set(key, arr);
    });
    return map;
  }, [events]);

  return (
    <div className={cn("rounded-xl border bg-card overflow-hidden", className)}>
      {/* Header */}
      <div className="grid grid-cols-7 border-b bg-card/60 backdrop-blur">
        {dayNames.map((d) => (
          <div key={d} className="px-3 py-3 text-xs font-medium text-muted-foreground tracking-wide">{d}</div>
        ))}
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-7">
        {days.map((d, idx) => {
          const inMonth = d.getMonth() === month.getMonth();
          const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          const list = (eventsByDate.get(key) || []).slice(0, 3);
          const hiddenCount = (eventsByDate.get(key)?.length || 0) - list.length;
          const isToday = isSameDay(d, new Date());
          return (
            <button
              key={idx}
              onClick={() => onDayClick?.(d)}
              className={cn(
                "h-36 sm:h-40 lg:h-44 xl:h-48 border-r border-b p-2 text-left hover:bg-muted/50 transition-colors",
                !inMonth && "bg-muted/30 text-muted-foreground",
                isToday && "bg-primary/5"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <div className={cn("text-sm", isToday && "text-primary font-semibold")}>{d.getDate()}</div>
              </div>
              <div className="space-y-1">
                {list.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={(e) => { e.stopPropagation(); onEventClick?.(ev); }}
                    className={cn(
                      "w-full truncate text-xs px-2 py-1 rounded-md border",
                      "bg-primary/10 border-primary/20 hover:bg-primary/20"
                    )}
                    title={ev.title}
                  >
                    {ev.title}
                  </div>
                ))}
                {hiddenCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5">+{hiddenCount} more</Badge>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

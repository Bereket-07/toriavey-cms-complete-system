import React from "react";
import { cn } from "@/lib/utils";

function MonthMini({ month }: { month: Date }) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const startOffset = first.getDay(); // Sun..Sat
  const days = new Array(startOffset).fill(null).concat(new Array(last.getDate()).fill(0).map((_, i) => i + 1));
  return (
    <div className="rounded-lg border bg-card p-2">
      <div className="text-xs font-medium mb-2">{month.toLocaleDateString(undefined, { month: "long" })}</div>
      <div className="grid grid-cols-7 gap-1 text-[10px] text-muted-foreground mb-1">
        {"SMTWTFS".split("").map((d) => (<div key={d} className="text-center">{d}</div>))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-[10px]">
        {days.map((d, i) => (
          <div key={i} className={cn("h-5 text-center rounded", d ? "hover:bg-muted/70" : "opacity-50")}>{d ?? ""}</div>
        ))}
      </div>
    </div>
  );
}

export default function YearCalendar({ year = new Date().getFullYear() }: { year?: number }) {
  const months = new Array(12).fill(0).map((_, i) => new Date(year, i, 1));
  return (
    <div className="rounded-xl">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {months.map((m) => (<MonthMini key={m.getMonth()} month={m} />))}
      </div>
    </div>
  );
}

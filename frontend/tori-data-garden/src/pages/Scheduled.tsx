import { useMemo, useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import ScheduleCalendar, { ScheduleEvent } from "@/components/calendar/ScheduleCalendar";
import MonthCalendar from "@/components/calendar/MonthCalendar";
import { Input } from "@/components/ui/input";
import DayCalendar from "@/components/calendar/DayCalendar";
import YearCalendar from "@/components/calendar/YearCalendar";
import EventModal from "@/components/modals/EventModal";

function getMonday(d = new Date()) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Mon=0..Sun=6
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default function Scheduled() {
  const [activeDate, setActiveDate] = useState<Date>(new Date());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [view, setView] = useState<"day" | "week" | "month" | "year">("week");
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | undefined>();
  const [modalOpen, setModalOpen] = useState(false);

  const events: ScheduleEvent[] = useMemo(() => {
    const base = getMonday(activeDate);
    const mk = (dayOffset: number, hour: number, durMin: number, title: string, platforms: string[]) => {
      const s = new Date(base);
      s.setDate(base.getDate() + dayOffset);
      s.setHours(hour, 0, 0, 0);
      const e = new Date(s.getTime() + durMin * 60000);
      return { id: `${title}-${s.toISOString()}`, title, start: s.toISOString(), end: e.toISOString(), platforms };
    };
    return [
      mk(1, 10, 45, "IG Reel: Autumn Soup", ["IG", "YT"]),
      mk(2, 13, 30, "Carousel: Meal Prep Tips", ["IG", "Threads"]),
      mk(4, 9, 60, "YouTube: Full Recipe Edit", ["YT"]),
      mk(5, 15, 30, "Post: Pantry Staples", ["IG"]),
    ];
  }, [activeDate]);

  function next() {
    const d = new Date(activeDate);
    if (view === "week" || view === "day") d.setDate(d.getDate() + (view === "week" ? 7 : 1));
    if (view === "month") d.setMonth(d.getMonth() + 1);
    if (view === "year") d.setFullYear(d.getFullYear() + 1);
    setActiveDate(d);
  }
  function prev() {
    const d = new Date(activeDate);
    if (view === "week" || view === "day") d.setDate(d.getDate() - (view === "week" ? 7 : 1));
    if (view === "month") d.setMonth(d.getMonth() - 1);
    if (view === "year") d.setFullYear(d.getFullYear() - 1);
    setActiveDate(d);
  }
  function goToday() {
    setActiveDate(new Date());
  }

  return (
    <div className="-mt-6 -mx-8">
      {/* Full-bleed scheduling view */}
      <div className="px-8 pt-6 pb-3 bg-gradient-to-b from-muted/50 to-transparent border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={next}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="secondary" onClick={goToday}>Today</Button>
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {activeDate.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={activeDate}
                  onSelect={(d) => d && setActiveDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-2xl font-playfair font-bold tracking-tight">Content Schedule</div>
            <div className="hidden md:flex items-center gap-1 rounded-lg bg-muted p-1">
              {(["day","week","month","year"] as const).map((v) => (
                <Button key={v} size="sm" variant={view===v?"secondary":"ghost"} onClick={() => setView(v)} className="capitalize">
                  {v}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <div className="relative">
                <Search className="h-4 w-4 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2" />
                <Input placeholder="Search" className="pl-8 w-48" />
              </div>
            </div>
            <Button variant="outline">New Post</Button>
            <Button className="bg-primary text-primary-foreground">Auto-Schedule</Button>
          </div>
        </div>
      </div>

      <div className="px-8 pb-8">
        {view === "month" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left sidebar: mini agenda */}
            <div className="lg:col-span-3">
              <Card className="p-4 space-y-4">
                <div className="text-sm font-medium text-muted-foreground">This Month</div>
                <div className="space-y-3">
                  {events.slice(0, 6).map((ev) => (
                    <div key={ev.id} className="text-sm">
                      <div className="font-medium truncate">{ev.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(ev.start).toLocaleDateString()} • {new Date(ev.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
            {/* Center: Month grid */}
            <div className="lg:col-span-9">
              <MonthCalendar month={activeDate} events={events} onDayClick={(d)=> { setActiveDate(d); setView("week"); }} onEventClick={(ev) => { setSelectedEvent(ev); setModalOpen(true); }} />
            </div>
          </div>
        ) : view === "week" ? (
          <Card className="border-none shadow-none">
            <ScheduleCalendar weekStart={getMonday(activeDate)} events={events} onEventClick={(ev)=> { setSelectedEvent(ev); setModalOpen(true); }} />
          </Card>
        ) : view === "day" ? (
          <Card className="border-none shadow-none">
            <DayCalendar date={activeDate} events={events} onEventClick={(ev)=> { setSelectedEvent(ev); setModalOpen(true); }} />
          </Card>
        ) : (
          <Card className="border-none shadow-none p-4">
            <YearCalendar year={activeDate.getFullYear()} />
          </Card>
        )}
      </div>
      <EventModal open={modalOpen} onOpenChange={setModalOpen} event={selectedEvent} />
    </div>
  );
}

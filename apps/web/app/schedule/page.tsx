"use client";

import { type ChangeEvent, useMemo, useRef, useState } from "react";

import { PageShell, Card, Section, EmptyState, Button } from "@/app/components/PageShell";
import {
  buildEventsByDateForMonth,
  buildEventsByDateForRange,
  type CalendarEvent,
} from "@/app/schedule/calendar-events";
import {
  buildCalendarGrid,
  formatMonthInputValue,
  formatMonthTitle,
  formatSelectedDayTitle,
  isSameDay,
  parseMonthInputValue,
  toIsoDate,
} from "@/app/schedule/calendar-utils";

type MonthPickerInput = HTMLInputElement & { showPicker?: () => void };
type WeeklyEvent = { dateKey: string; event: CalendarEvent };

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function getWeekRange(selectedDate: Date): { start: Date; end: Date } {
  const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

function formatDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function EventList({ events }: { events: CalendarEvent[] }) {
  return (
    <div className="space-y-3">
      {events.map((event) => (
        <Card key={event.id} className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium text-foreground">{event.title}</h4>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{event.category}</span>
          </div>
          <p className="text-xs text-text-muted">{event.time}</p>
          {event.details && <p className="text-xs text-text-muted">{event.details}</p>}
        </Card>
      ))}
    </div>
  );
}

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const monthPickerRef = useRef<HTMLInputElement>(null);

  const calendarCells = useMemo(() => buildCalendarGrid(visibleMonth), [visibleMonth]);
  const eventsByDateInMonth = useMemo(() => buildEventsByDateForMonth(visibleMonth), [visibleMonth]);
  const selectedDateKey = toIsoDate(selectedDate);
  const selectedDayEvents = eventsByDateInMonth.get(selectedDateKey) ?? [];

  const weeklyEvents = useMemo<WeeklyEvent[]>(() => {
    const { start, end } = getWeekRange(selectedDate);
    const eventsByDate = buildEventsByDateForRange(start, end);
    return Array.from(eventsByDate.entries()).flatMap(([dateKey, events]) =>
      events.map((event) => ({ dateKey, event })),
    );
  }, [selectedDate]);

  function goToMonth(year: number, month: number): void {
    const nextMonthDate = new Date(year, month, 1);
    setVisibleMonth(nextMonthDate);
    setSelectedDate(new Date(year, month, 1));
  }

  function handleMonthStep(offset: number): void {
    goToMonth(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset);
  }

  function handleMonthChange(event: ChangeEvent<HTMLInputElement>): void {
    const parsedMonth = parseMonthInputValue(event.target.value);
    if (!parsedMonth) {
      return;
    }

    goToMonth(parsedMonth.year, parsedMonth.month);
  }

  function openMonthPicker(): void {
    const monthPicker = monthPickerRef.current as MonthPickerInput | null;
    if (!monthPicker) {
      return;
    }

    if (typeof monthPicker.showPicker === "function") {
      monthPicker.showPicker();
      return;
    }

    monthPicker.click();
  }

  return (
    <PageShell
      title="Calendar"
      subtitle="Dates, birthdays, anniversaries & reminders"
      actions={
        <Button variant="primary">
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Event
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openMonthPicker}
                  aria-label="Select month and year"
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                    />
                  </svg>
                </button>
                <h3 className="text-lg font-medium text-slate-900">{formatMonthTitle(visibleMonth)}</h3>
                <input
                  ref={monthPickerRef}
                  type="month"
                  aria-label="Month and year selector"
                  value={formatMonthInputValue(visibleMonth)}
                  onChange={handleMonthChange}
                  className="pointer-events-none absolute opacity-0"
                />
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleMonthStep(-1)}
                  aria-label="Previous month"
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleMonthStep(1)}
                  aria-label="Next month"
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1">
              {DAY_HEADERS.map((day) => (
                <div key={day} className="py-2 text-center text-xs font-medium text-slate-400">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((cell) => {
                const isSelected = isSameDay(cell.date, selectedDate);
                const hasEvents = cell.isCurrentMonth && eventsByDateInMonth.has(toIsoDate(cell.date));

                return (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => setSelectedDate(cell.date)}
                    className={`relative aspect-square rounded-lg p-2 text-sm transition-colors ${
                      isSelected
                        ? "bg-accent-light font-medium text-accent-muted ring-1 ring-accent/30"
                        : cell.isCurrentMonth
                          ? "text-slate-700 hover:bg-slate-100"
                          : "text-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {cell.dayNumber}
                    {hasEvents && (
                      <span
                        className={`absolute bottom-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${
                          isSelected ? "bg-accent-muted" : "bg-accent"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Section title={formatSelectedDayTitle(selectedDate)}>
            {selectedDayEvents.length > 0 ? (
              <EventList events={selectedDayEvents} />
            ) : (
              <Card padding="none">
                <EmptyState title="No events on this day" description="Pick another day or add a new event." />
              </Card>
            )}
          </Section>

          <Section title="This Week">
            {weeklyEvents.length > 0 ? (
              <Card className="space-y-3">
                {weeklyEvents.map(({ dateKey, event }) => (
                  <div key={`${dateKey}-${event.id}`} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{event.title}</p>
                      <p className="text-xs text-text-muted">{event.time}</p>
                    </div>
                    <p className="text-xs text-text-muted">{formatDateKey(dateKey)}</p>
                  </div>
                ))}
              </Card>
            ) : (
              <Card padding="none">
                <EmptyState
                  icon={
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  }
                  title="No upcoming events"
                  description="Add birthdays and anniversaries"
                />
              </Card>
            )}
          </Section>

        </div>
      </div>
    </PageShell>
  );
}

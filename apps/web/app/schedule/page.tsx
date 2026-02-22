"use client";

import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageShell, Card, Section, EmptyState, Button } from "@/app/components/PageShell";
import { fetchEventsByDateForRange, type CalendarEvent } from "@/app/schedule/calendar-events";
import { api } from "@/app/lib/api";
import { useApi } from "@/app/lib/hooks/use-api";
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

function EventList({
  events,
  onDelete,
  onEdit,
}: {
  events: CalendarEvent[];
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string) => Promise<void>;
}) {
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
          <div className="flex justify-end gap-2">
            <button
              className="text-xs text-slate-600"
              onClick={() => {
                const updatedTitle = window.prompt("Edit event title", event.title);
                if (updatedTitle?.trim()) {
                  void onEdit(event.id, updatedTitle.trim());
                }
              }}
            >
              Edit
            </button>
            <button className="text-xs text-red-600" onClick={() => onDelete(event.id)}>Delete</button>
          </div>
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

  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDetails, setNewEventDetails] = useState("");
  const [newEventType, setNewEventType] = useState("Event");
  const [newEventAllDay, setNewEventAllDay] = useState(true);
  const [newEventTime, setNewEventTime] = useState("09:00");
  const [savingEvent, setSavingEvent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthPickerRef = useRef<HTMLInputElement>(null);

  const calendarCells = useMemo(() => buildCalendarGrid(visibleMonth), [visibleMonth]);
  const selectedDateKey = toIsoDate(selectedDate);

  const [eventsByDateInMonth, setEventsByDateInMonth] = useState<Map<string, CalendarEvent[]>>(new Map());
  const [weeklyEvents, setWeeklyEvents] = useState<WeeklyEvent[]>([]);

  const { data: peopleData } = useApi(() => api.people.list(), []);
  const people = peopleData?.data ?? [];

  const reloadEventsForVisibleMonth = useCallback(async () => {
    const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const monthEnd = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0, 23, 59, 59);
    const map = await fetchEventsByDateForRange(monthStart, monthEnd);
    setEventsByDateInMonth(map);
  }, [visibleMonth]);

  const reloadWeeklyEvents = useCallback(async () => {
    const { start, end } = getWeekRange(selectedDate);
    const map = await fetchEventsByDateForRange(start, end);
    const events: WeeklyEvent[] = [];
    for (const [dateKey, evts] of map.entries()) {
      for (const event of evts) events.push({ dateKey, event });
    }
    setWeeklyEvents(events);
  }, [selectedDate]);

  useEffect(() => {
    void reloadEventsForVisibleMonth();
  }, [reloadEventsForVisibleMonth]);

  useEffect(() => {
    void reloadWeeklyEvents();
  }, [reloadWeeklyEvents]);

  const selectedDayEvents = eventsByDateInMonth.get(selectedDateKey) ?? [];

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
    if (!parsedMonth) return;
    goToMonth(parsedMonth.year, parsedMonth.month);
  }

  function openMonthPicker(): void {
    const monthPicker = monthPickerRef.current as MonthPickerInput | null;
    if (!monthPicker) return;
    if (typeof monthPicker.showPicker === "function") {
      monthPicker.showPicker();
      return;
    }
    monthPicker.click();
  }

  async function handleAddEvent() {
    if (!selectedPersonId || !newEventTitle.trim()) return;
    setSavingEvent(true);
    setError(null);
    try {
      const dateIso = toIsoDate(selectedDate);
      const startAt = newEventAllDay
        ? new Date(`${dateIso}T00:00:00`).toISOString()
        : new Date(`${dateIso}T${newEventTime}:00`).toISOString();

      await api.events.create(selectedPersonId, {
        title: newEventTitle.trim(),
        event_type: newEventType || undefined,
        start_at: startAt,
        is_all_day: newEventAllDay,
        details: newEventDetails.trim() || undefined,
      });
      setNewEventTitle("");
      setNewEventDetails("");
      await Promise.all([reloadEventsForVisibleMonth(), reloadWeeklyEvents()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create event.");
    } finally {
      setSavingEvent(false);
    }
  }

  async function handleDeleteEvent(id: string) {
    setError(null);
    try {
      await api.events.delete(id);
      await Promise.all([reloadEventsForVisibleMonth(), reloadWeeklyEvents()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete event.");
    }
  }

  async function handleEditEvent(id: string, title: string) {
    setError(null);
    try {
      await api.events.update(id, { title });
      await Promise.all([reloadEventsForVisibleMonth(), reloadWeeklyEvents()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to edit event.");
    }
  }

  return (
    <PageShell
      title="Calendar"
      subtitle="Dates, birthdays, anniversaries and reminders"
      actions={<Button variant="primary" onClick={() => void handleAddEvent()} disabled={savingEvent || !selectedPersonId || !newEventTitle.trim()}>{savingEvent ? "Saving..." : "Add Event"}</Button>}
    >
      {error && <Card className="mb-4 text-sm text-red-600">{error}</Card>}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button type="button" onClick={openMonthPicker} aria-label="Select month and year" className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">Pick</button>
                <h3 className="text-lg font-medium text-slate-900">{formatMonthTitle(visibleMonth)}</h3>
                <input ref={monthPickerRef} type="month" aria-label="Month and year selector" value={formatMonthInputValue(visibleMonth)} onChange={handleMonthChange} className="pointer-events-none absolute opacity-0" />
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => handleMonthStep(-1)} aria-label="Previous month" className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">Prev</button>
                <button type="button" onClick={() => handleMonthStep(1)} aria-label="Next month" className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">Next</button>
              </div>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1">
              {DAY_HEADERS.map((day) => (
                <div key={day} className="py-2 text-center text-xs font-medium text-slate-400">{day}</div>
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
                    {hasEvents && <span className={`absolute bottom-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${isSelected ? "bg-accent-muted" : "bg-accent"}`} />}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Section title="Create Event">
            <Card className="space-y-2">
              <select value={selectedPersonId} onChange={(e) => setSelectedPersonId(e.target.value)} className="w-full rounded border border-slate-200 px-2 py-2 text-sm">
                <option value="">Select person</option>
                {people.map((person) => <option key={person.id} value={person.id}>{person.display_name}</option>)}
              </select>
              <input value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} placeholder="Event title" className="w-full rounded border border-slate-200 px-2 py-2 text-sm" />
              <input value={newEventType} onChange={(e) => setNewEventType(e.target.value)} placeholder="Type" className="w-full rounded border border-slate-200 px-2 py-2 text-sm" />
              <textarea value={newEventDetails} onChange={(e) => setNewEventDetails(e.target.value)} placeholder="Details" className="w-full rounded border border-slate-200 px-2 py-2 text-sm" rows={2} />
              <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={newEventAllDay} onChange={(e) => setNewEventAllDay(e.target.checked)} /> All day</label>
              {!newEventAllDay && <input type="time" value={newEventTime} onChange={(e) => setNewEventTime(e.target.value)} className="w-full rounded border border-slate-200 px-2 py-2 text-sm" />}
              <Button size="sm" onClick={() => void handleAddEvent()} disabled={savingEvent || !selectedPersonId || !newEventTitle.trim()}>{savingEvent ? "Saving..." : "Add"}</Button>
            </Card>
          </Section>

          <Section title={formatSelectedDayTitle(selectedDate)}>
            {selectedDayEvents.length > 0 ? <EventList events={selectedDayEvents} onDelete={handleDeleteEvent} onEdit={handleEditEvent} /> : <Card padding="none"><EmptyState title="No events on this day" description="Pick another day or add a new event." /></Card>}
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
              <Card padding="none"><EmptyState title="No upcoming events" description="Add birthdays and anniversaries" /></Card>
            )}
          </Section>
        </div>
      </div>
    </PageShell>
  );
}

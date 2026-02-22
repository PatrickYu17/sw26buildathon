import { api } from "@/app/lib/api";
import type { Event } from "@/app/lib/api-types";

export type CalendarEventCategory = string;

export type CalendarEvent = {
  id: string;
  title: string;
  time: string;
  category: CalendarEventCategory;
  details?: string;
};

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(dateStr: string, isAllDay: boolean): string {
  if (isAllDay) return "All day";
  return new Date(dateStr).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function toCalendarEvent(e: Event): CalendarEvent {
  return {
    id: e.id,
    title: e.title,
    time: formatTime(e.start_at, e.is_all_day),
    category: e.event_type || "Event",
    details: e.details || undefined,
  };
}

export async function fetchEventsByDateForRange(
  from: Date,
  to: Date,
): Promise<Map<string, CalendarEvent[]>> {
  try {
    const res = await api.events.forRange(from.toISOString(), to.toISOString());
    const map = new Map<string, CalendarEvent[]>();
    for (const e of res.data) {
      const key = toIsoDate(new Date(e.start_at));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(toCalendarEvent(e));
    }
    return map;
  } catch {
    return new Map();
  }
}

// Sync stubs kept for initial render before async data loads
export function buildEventsByDateForMonth(viewDate: Date): Map<string, CalendarEvent[]> {
  void viewDate;
  return new Map<string, CalendarEvent[]>();
}

export function buildEventsByDateForRange(startDate: Date, endDate: Date): Map<string, CalendarEvent[]> {
  void startDate;
  void endDate;
  return new Map<string, CalendarEvent[]>();
}

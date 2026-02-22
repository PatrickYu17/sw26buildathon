export type CalendarEventCategory = string;

export type CalendarEvent = {
  id: string;
  title: string;
  time: string;
  category: CalendarEventCategory;
  details?: string;
};

export function buildEventsByDateForMonth(_viewDate: Date): Map<string, CalendarEvent[]> {
  void _viewDate;
  return new Map<string, CalendarEvent[]>();
}

export function buildEventsByDateForRange(_startDate: Date, _endDate: Date): Map<string, CalendarEvent[]> {
  void _startDate;
  void _endDate;
  return new Map<string, CalendarEvent[]>();
}

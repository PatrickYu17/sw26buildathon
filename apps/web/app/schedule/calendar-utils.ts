export type CalendarCell = {
  key: string;
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
};

const MONTH_INPUT_PATTERN = /^(\d{4})-(\d{2})$/;

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function buildCalendarGrid(viewDate: Date): CalendarCell[] {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = getDaysInMonth(year, month);
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const date = new Date(year, month, index - firstWeekday + 1);
    const dayNumber = date.getDate();
    const isCurrentMonth = date.getFullYear() === year && date.getMonth() === month;
    return {
      key: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${index}`,
      date,
      dayNumber,
      isCurrentMonth,
    };
  });
}

export function getClampedDateInMonth(date: Date, year: number, month: number): Date {
  const day = Math.min(date.getDate(), getDaysInMonth(year, month));
  return new Date(year, month, day);
}

export function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function formatMonthTitle(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function formatMonthInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function parseMonthInputValue(value: string): { year: number; month: number } | null {
  const match = value.match(MONTH_INPUT_PATTERN);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  if (Number.isNaN(year) || Number.isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) {
    return null;
  }

  return { year, month: monthNumber - 1 };
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

export function formatSelectedDayTitle(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

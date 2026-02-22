export const GESTURE_CATEGORIES = [
  "Daily",
  "Romantic",
  "Special",
  "Caring",
  "Supportive",
  "Celebration",
] as const;

export const GESTURE_EFFORT_LEVELS = ["Low", "Medium", "High"] as const;

export const GESTURE_TIMESCALES = [
  "Today",
  "This Week",
  "This Month",
  "Next Month",
  "Flexible",
] as const;

export const GESTURE_DURATION_OPTIONS = [
  "5 min",
  "15 min",
  "30 min",
  "1 hour",
  "2+ hours",
] as const;

export const GESTURE_REMINDER_OPTIONS = [
  "No reminder",
  "Morning of",
  "Day before",
  "3 days before",
] as const;

export const GESTURE_REPEAT_MODES = [
  "No repeat",
  "Repeat every N days",
  "Variable schedule",
  "Variable reward scheduling",
] as const;

export type GestureCategory = (typeof GESTURE_CATEGORIES)[number];
export type GestureEffort = (typeof GESTURE_EFFORT_LEVELS)[number];
export type GestureTimescale = (typeof GESTURE_TIMESCALES)[number];
export type GestureDuration = (typeof GESTURE_DURATION_OPTIONS)[number];
export type GestureReminder = (typeof GESTURE_REMINDER_OPTIONS)[number];
export type GestureRepeatMode = (typeof GESTURE_REPEAT_MODES)[number];

export type SavedGesture = {
  title: string;
  category: GestureCategory;
  effort: GestureEffort;
  timescale: GestureTimescale;
  repeatMode: GestureRepeatMode;
  repeatEveryDays: number;
  variableRepeatDays: string;
  notes?: string;
};

export type UpcomingGesture = {
  title: string;
  date: string;
  person: string;
  repeatSummary: string;
};

export type CreateGestureInput = {
  title: string;
  category: GestureCategory;
  effort: GestureEffort;
  timescale: GestureTimescale;
  person: string;
  dueDate: string;
  duration: GestureDuration;
  reminder: GestureReminder;
  repeatMode: GestureRepeatMode;
  repeatEveryDays: number;
  variableRepeatDays: string;
  notes: string;
};

export const INITIAL_SAVED_GESTURES: SavedGesture[] = [
  {
    title: "Send a good morning text",
    category: "Daily",
    effort: "Low",
    timescale: "Today",
    repeatMode: "No repeat",
    repeatEveryDays: 7,
    variableRepeatDays: "",
  },
  {
    title: "Plan a surprise date",
    category: "Special",
    effort: "High",
    timescale: "This Month",
    repeatMode: "No repeat",
    repeatEveryDays: 7,
    variableRepeatDays: "",
  },
  {
    title: "Write a love note",
    category: "Romantic",
    effort: "Medium",
    timescale: "This Week",
    repeatMode: "No repeat",
    repeatEveryDays: 7,
    variableRepeatDays: "",
  },
  {
    title: "Cook their favorite meal",
    category: "Caring",
    effort: "Medium",
    timescale: "Flexible",
    repeatMode: "No repeat",
    repeatEveryDays: 7,
    variableRepeatDays: "",
  },
];

export const INITIAL_UPCOMING_GESTURES: UpcomingGesture[] = [];

export function formatUpcomingDate(input: CreateGestureInput): string {
  if (!input.dueDate) {
    return input.timescale;
  }

  const [yearText, monthText, dayText] = input.dueDate.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return input.timescale;
  }

  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function normalizeVariableRepeatDays(variableRepeatDays: string): string {
  const days = variableRepeatDays
    .split(",")
    .map((dayText) => Number.parseInt(dayText.trim(), 10))
    .filter((day) => Number.isInteger(day) && day > 0);

  if (days.length === 0) {
    return "";
  }

  const uniqueDays = Array.from(new Set(days)).sort((a, b) => a - b);
  return uniqueDays.join(", ");
}

export function formatRepeatSummary(input: Pick<CreateGestureInput, "repeatMode" | "repeatEveryDays" | "variableRepeatDays">): string {
  if (input.repeatMode === "No repeat") {
    return "No repeat";
  }

  if (input.repeatMode === "Repeat every N days") {
    const repeatEveryDays = Number.isInteger(input.repeatEveryDays) && input.repeatEveryDays > 0 ? input.repeatEveryDays : 1;
    return `Every ${repeatEveryDays} ${repeatEveryDays === 1 ? "day" : "days"}`;
  }

  const variableRepeatDays = normalizeVariableRepeatDays(input.variableRepeatDays);
  if (input.repeatMode === "Variable reward scheduling") {
    return variableRepeatDays ? `Variable reward days: ${variableRepeatDays}` : "Variable reward scheduling";
  }

  return variableRepeatDays ? `Variable days: ${variableRepeatDays}` : "Variable schedule";
}

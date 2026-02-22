"use client";

import { useMemo, useState } from "react";

import { Button, Card } from "@/app/components/PageShell";

const STORAGE_KEY = "sw26buildathon.notification-settings.v1";

const LEAD_TIME_OPTIONS = [
  { value: "morning-of", label: "Morning of event" },
  { value: "1-day", label: "1 day before" },
  { value: "2-days", label: "2 days before" },
  { value: "1-week", label: "1 week before" },
] as const;

const EMAIL_SCOPE_OPTIONS = [
  { value: "all", label: "All reminders" },
  { value: "special-dates", label: "Birthdays & anniversaries only" },
  { value: "custom", label: "Custom reminders only" },
] as const;

type LeadTime = (typeof LEAD_TIME_OPTIONS)[number]["value"];
type EmailScope = (typeof EMAIL_SCOPE_OPTIONS)[number]["value"];

type NotificationSettings = {
  eventReminders: boolean;
  aiSuggestions: boolean;
  weeklySummary: boolean;
  emailRemindersEnabled: boolean;
  emailAddress: string;
  leadTime: LeadTime;
  emailScope: EmailScope;
  includeEventDetails: boolean;
};

const DEFAULT_SETTINGS: NotificationSettings = {
  eventReminders: true,
  aiSuggestions: false,
  weeklySummary: true,
  emailRemindersEnabled: true,
  emailAddress: "",
  leadTime: "1-day",
  emailScope: "all",
  includeEventDetails: true,
};

function getInitialSettings(): NotificationSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return DEFAULT_SETTINGS;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<NotificationSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return DEFAULT_SETTINGS;
  }
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

type ToggleRowProps = {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

function ToggleRow({ label, description, checked, onChange, disabled = false }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className={`text-sm font-medium ${disabled ? "text-slate-500" : "text-slate-900"}`}>{label}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          disabled ? "cursor-not-allowed bg-slate-200/80" : checked ? "bg-accent" : "bg-slate-200"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

export function NotificationsSettingsCard() {
  const [settings, setSettings] = useState<NotificationSettings>(getInitialSettings);
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");
  const [emailError, setEmailError] = useState<string | null>(null);

  const reminderStatus = useMemo(() => {
    if (!settings.eventReminders) {
      return "Event reminders are off.";
    }

    if (!settings.emailRemindersEnabled) {
      return "Email reminders are off.";
    }

    if (!settings.emailAddress) {
      return "Add a destination email to activate delivery.";
    }

    return `Email reminders will go to ${settings.emailAddress}.`;
  }, [settings]);

  function updateSetting<Key extends keyof NotificationSettings>(key: Key, value: NotificationSettings[Key]) {
    setSaveState("idle");
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function saveSettings() {
    if (settings.eventReminders && settings.emailRemindersEnabled) {
      if (!settings.emailAddress || !isValidEmail(settings.emailAddress)) {
        setEmailError("Enter a valid email address before saving.");
        return;
      }
    }

    setEmailError(null);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaveState("saved");
  }

  const emailControlsDisabled = !settings.eventReminders || !settings.emailRemindersEnabled;

  return (
    <Card className="space-y-5">
      <ToggleRow
        label="Event Reminders"
        description="Get notified about upcoming birthdays and anniversaries."
        checked={settings.eventReminders}
        onChange={(value) => updateSetting("eventReminders", value)}
      />

      <ToggleRow
        label="AI Suggestions"
        description="Receive periodic gesture and task suggestions."
        checked={settings.aiSuggestions}
        onChange={(value) => updateSetting("aiSuggestions", value)}
      />

      <ToggleRow
        label="Weekly Summary"
        description="Get a weekly recap of your relationship activity."
        checked={settings.weeklySummary}
        onChange={(value) => updateSetting("weeklySummary", value)}
      />

      <div className="border-t border-slate-200 pt-5">
        <h3 className="text-sm font-semibold text-slate-900">Email Reminder Preferences</h3>
        <p className="mt-1 text-sm text-slate-500">{reminderStatus}</p>

        <div className="mt-4 space-y-4">
          <ToggleRow
            label="Send reminders by email"
            description="Receive event reminders in your inbox."
            checked={settings.emailRemindersEnabled}
            onChange={(value) => updateSetting("emailRemindersEnabled", value)}
            disabled={!settings.eventReminders}
          />

          <div>
            <label className="text-xs font-medium text-slate-500">Destination Email</label>
            <input
              type="email"
              value={settings.emailAddress}
              onChange={(event) => {
                setEmailError(null);
                updateSetting("emailAddress", event.target.value.trim());
              }}
              disabled={emailControlsDisabled}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
            {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-500">Send Timing</label>
              <select
                value={settings.leadTime}
                onChange={(event) => updateSetting("leadTime", event.target.value as LeadTime)}
                disabled={emailControlsDisabled}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                {LEAD_TIME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">Applies To</label>
              <select
                value={settings.emailScope}
                onChange={(event) => updateSetting("emailScope", event.target.value as EmailScope)}
                disabled={emailControlsDisabled}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                {EMAIL_SCOPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={settings.includeEventDetails}
              onChange={(event) => updateSetting("includeEventDetails", event.target.checked)}
              disabled={emailControlsDisabled}
              className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent disabled:cursor-not-allowed"
            />
            Include event details in reminder emails
          </label>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
        {saveState === "saved" && <p className="text-xs text-slate-500">Saved on this device.</p>}
        <Button variant="primary" size="sm" onClick={saveSettings}>
          Save Notification Settings
        </Button>
      </div>
    </Card>
  );
}

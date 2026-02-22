"use client";

import { useMemo, useState } from "react";
import { Button, Card } from "@/app/components/PageShell";
import type { NotificationSettings } from "@/app/lib/api-types";

type NotificationsSettingsCardProps = {
  initialSettings: NotificationSettings;
  onSave: (settings: NotificationSettings) => Promise<void>;
};

const LEAD_TIME_OPTIONS = [
  { value: "morning-of", label: "Morning of event" },
  { value: "1-day", label: "1 day before" },
  { value: "2-days", label: "2 days before" },
  { value: "1-week", label: "1 week before" },
] as const;

const EMAIL_SCOPE_OPTIONS = [
  { value: "all", label: "All reminders" },
  { value: "special-dates", label: "Birthdays and anniversaries only" },
  { value: "custom", label: "Custom reminders only" },
] as const;

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
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "left-6" : "left-1"}`} />
      </button>
    </div>
  );
}

export function NotificationsSettingsCard({ initialSettings, onSave }: NotificationsSettingsCardProps) {
  const [settings, setSettings] = useState<NotificationSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reminderStatus = useMemo(() => {
    if (!settings.event_reminders) return "Event reminders are off.";
    if (!settings.email_reminders_enabled) return "Email reminders are off.";
    if (!settings.email_address) return "Add a destination email to activate delivery.";
    return `Email reminders will go to ${settings.email_address}.`;
  }, [settings]);

  function updateSetting<K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) {
    setSaveState("idle");
    setErrorMessage(null);
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function saveSettings() {
    if (settings.event_reminders && settings.email_reminders_enabled) {
      const email = settings.email_address ?? "";
      if (!email || !isValidEmail(email)) {
        setErrorMessage("Enter a valid email address before saving.");
        return;
      }
    }

    setSaving(true);
    setErrorMessage(null);

    try {
      await onSave(settings);
      setSaveState("saved");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save notification settings.");
    } finally {
      setSaving(false);
    }
  }

  const emailControlsDisabled = !settings.event_reminders || !settings.email_reminders_enabled;

  return (
    <Card className="space-y-5">
      <ToggleRow
        label="Event Reminders"
        description="Get notified about upcoming birthdays and anniversaries."
        checked={settings.event_reminders}
        onChange={(value) => updateSetting("event_reminders", value)}
      />

      <ToggleRow
        label="AI Suggestions"
        description="Receive periodic gesture and task suggestions."
        checked={settings.ai_suggestions}
        onChange={(value) => updateSetting("ai_suggestions", value)}
      />

      <ToggleRow
        label="Weekly Summary"
        description="Get a weekly recap of your relationship activity."
        checked={settings.weekly_summary}
        onChange={(value) => updateSetting("weekly_summary", value)}
      />

      <div className="border-t border-slate-200 pt-5">
        <h3 className="text-sm font-semibold text-slate-900">Email Reminder Preferences</h3>
        <p className="mt-1 text-sm text-slate-500">{reminderStatus}</p>

        <div className="mt-4 space-y-4">
          <ToggleRow
            label="Send reminders by email"
            description="Receive event reminders in your inbox."
            checked={settings.email_reminders_enabled}
            onChange={(value) => updateSetting("email_reminders_enabled", value)}
            disabled={!settings.event_reminders}
          />

          <div>
            <label className="text-xs font-medium text-slate-500">Destination Email</label>
            <input
              type="email"
              value={settings.email_address ?? ""}
              onChange={(event) => updateSetting("email_address", event.target.value.trim())}
              disabled={emailControlsDisabled}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-500">Send Timing</label>
              <select
                value={settings.lead_time}
                onChange={(event) => updateSetting("lead_time", event.target.value)}
                disabled={emailControlsDisabled}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                {LEAD_TIME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">Applies To</label>
              <select
                value={settings.email_scope}
                onChange={(event) => updateSetting("email_scope", event.target.value)}
                disabled={emailControlsDisabled}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                {EMAIL_SCOPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={settings.include_event_details}
              onChange={(event) => updateSetting("include_event_details", event.target.checked)}
              disabled={emailControlsDisabled}
              className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent disabled:cursor-not-allowed"
            />
            Include event details in reminder emails
          </label>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
        {saveState === "saved" && <p className="text-xs text-slate-500">Saved.</p>}
        {errorMessage && <p className="text-xs text-red-600">{errorMessage}</p>}
        <Button variant="primary" size="sm" onClick={saveSettings} disabled={saving}>
          {saving ? "Saving..." : "Save Notification Settings"}
        </Button>
      </div>
    </Card>
  );
}

"use client";

import { type FormEvent, useEffect, useState } from "react";

import {
  type CreateGestureInput,
  GESTURE_CATEGORIES,
  GESTURE_DURATION_OPTIONS,
  GESTURE_EFFORT_LEVELS,
  GESTURE_REMINDER_OPTIONS,
  GESTURE_REPEAT_MODES,
  GESTURE_TIMESCALES,
  normalizeVariableRepeatDays,
} from "@/app/gestures/gesture-types";

type CreateGestureModalProps = {
  onClose: () => void;
  onCreate: (input: CreateGestureInput) => void;
};

const INPUT_BASE_CLASSNAME =
  "mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300";

const STANDARD_REPEAT_MODES = GESTURE_REPEAT_MODES.filter(
  (repeatMode) => repeatMode !== "Variable reward scheduling",
);

const DEFAULT_FORM_VALUES: CreateGestureInput = {
  title: "",
  category: "Daily",
  effort: "Low",
  timescale: "This Week",
  person: "",
  dueDate: "",
  duration: "15 min",
  reminder: "Morning of",
  repeatMode: "No repeat",
  repeatEveryDays: 7,
  variableRepeatDays: "",
  notes: "",
};

function cloneDefaultValues(): CreateGestureInput {
  return { ...DEFAULT_FORM_VALUES };
}

export function CreateGestureModal({ onClose, onCreate }: CreateGestureModalProps) {
  const [formValues, setFormValues] = useState<CreateGestureInput>(cloneDefaultValues);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    function handleEscapeKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscapeKeyDown);
    return () => {
      window.removeEventListener("keydown", handleEscapeKeyDown);
    };
  }, [onClose]);

  const shouldShowDateHint = formValues.timescale !== "Flexible";
  const isVariableRewardScheduling = formValues.repeatMode === "Variable reward scheduling";
  const selectedStandardRepeatMode = isVariableRewardScheduling ? "No repeat" : formValues.repeatMode;
  const shouldShowFixedRepeatDays = formValues.repeatMode === "Repeat every N days";
  const shouldShowVariableRepeatDays =
    formValues.repeatMode === "Variable schedule" || formValues.repeatMode === "Variable reward scheduling";
  const variableDaysLabel = formValues.repeatMode === "Variable reward scheduling"
    ? "Variable Reward Days"
    : "Variable Repeat Days";

  function updateField<FieldName extends keyof CreateGestureInput>(
    fieldName: FieldName,
    fieldValue: CreateGestureInput[FieldName],
  ): void {
    setFormValues((currentValues) => ({ ...currentValues, [fieldName]: fieldValue }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const title = formValues.title.trim();
    if (!title) {
      setErrorMessage("Gesture name is required.");
      return;
    }

    if (shouldShowFixedRepeatDays && (!Number.isInteger(formValues.repeatEveryDays) || formValues.repeatEveryDays < 1)) {
      setErrorMessage("Repeat interval must be at least 1 day.");
      return;
    }

    const normalizedVariableRepeatDays = normalizeVariableRepeatDays(formValues.variableRepeatDays);
    if (shouldShowVariableRepeatDays && !normalizedVariableRepeatDays) {
      setErrorMessage("Enter variable repeat days like 2, 5, 10.");
      return;
    }

    onCreate({
      ...formValues,
      title,
      person: formValues.person.trim(),
      repeatEveryDays: formValues.repeatEveryDays > 0 ? formValues.repeatEveryDays : 1,
      variableRepeatDays: shouldShowVariableRepeatDays ? normalizedVariableRepeatDays : "",
      notes: formValues.notes.trim(),
    });

    setErrorMessage("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close create gesture window"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/45"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-gesture-title"
        className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id="create-gesture-title" className="text-lg font-semibold text-slate-900">
              Create Gesture
            </h2>
            <p className="text-sm text-slate-500">Set the basics now, tune details later.</p>
          </div>
          <button
            type="button"
            aria-label="Close create gesture window"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="gesture-name" className="text-xs font-medium text-slate-500">
                Name
              </label>
              <input
                id="gesture-name"
                type="text"
                placeholder="Write a note before work"
                value={formValues.title}
                onChange={(event) => updateField("title", event.target.value)}
                className={INPUT_BASE_CLASSNAME}
              />
            </div>

            <div>
              <label htmlFor="gesture-timescale" className="text-xs font-medium text-slate-500">
                Timescale
              </label>
              <select
                id="gesture-timescale"
                value={formValues.timescale}
                onChange={(event) => updateField("timescale", event.target.value as CreateGestureInput["timescale"])}
                className={INPUT_BASE_CLASSNAME}
              >
                {GESTURE_TIMESCALES.map((timescale) => (
                  <option key={timescale} value={timescale}>
                    {timescale}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="gesture-effort" className="text-xs font-medium text-slate-500">
                Effort
              </label>
              <select
                id="gesture-effort"
                value={formValues.effort}
                onChange={(event) => updateField("effort", event.target.value as CreateGestureInput["effort"])}
                className={INPUT_BASE_CLASSNAME}
              >
                {GESTURE_EFFORT_LEVELS.map((effort) => (
                  <option key={effort} value={effort}>
                    {effort}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="gesture-category" className="text-xs font-medium text-slate-500">
                Category
              </label>
              <select
                id="gesture-category"
                value={formValues.category}
                onChange={(event) => updateField("category", event.target.value as CreateGestureInput["category"])}
                className={INPUT_BASE_CLASSNAME}
              >
                {GESTURE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="gesture-duration" className="text-xs font-medium text-slate-500">
                Duration
              </label>
              <select
                id="gesture-duration"
                value={formValues.duration}
                onChange={(event) => updateField("duration", event.target.value as CreateGestureInput["duration"])}
                className={INPUT_BASE_CLASSNAME}
              >
                {GESTURE_DURATION_OPTIONS.map((duration) => (
                  <option key={duration} value={duration}>
                    {duration}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="gesture-person" className="text-xs font-medium text-slate-500">
                Person
              </label>
              <input
                id="gesture-person"
                type="text"
                placeholder="Who is this for?"
                value={formValues.person}
                onChange={(event) => updateField("person", event.target.value)}
                className={INPUT_BASE_CLASSNAME}
              />
            </div>

            <div>
              <label htmlFor="gesture-reminder" className="text-xs font-medium text-slate-500">
                Reminder
              </label>
              <select
                id="gesture-reminder"
                value={formValues.reminder}
                onChange={(event) => updateField("reminder", event.target.value as CreateGestureInput["reminder"])}
                className={INPUT_BASE_CLASSNAME}
              >
                {GESTURE_REMINDER_OPTIONS.map((reminder) => (
                  <option key={reminder} value={reminder}>
                    {reminder}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="gesture-repeat-mode" className="text-xs font-medium text-slate-500">
                Repeat
              </label>
              <select
                id="gesture-repeat-mode"
                value={selectedStandardRepeatMode}
                disabled={isVariableRewardScheduling}
                onChange={(event) => updateField("repeatMode", event.target.value as CreateGestureInput["repeatMode"])}
                className={`${INPUT_BASE_CLASSNAME} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
              >
                {STANDARD_REPEAT_MODES.map((repeatMode) => (
                  <option key={repeatMode} value={repeatMode}>
                    {repeatMode}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-700">Variable reward scheduling</p>
                  <p className="text-xs text-slate-500">Use custom day intervals for reward scheduling</p>
                </div>
                <button
                  type="button"
                  aria-pressed={isVariableRewardScheduling}
                  onClick={() =>
                    updateField(
                      "repeatMode",
                      isVariableRewardScheduling ? "No repeat" : "Variable reward scheduling",
                    )
                  }
                  className={`inline-flex min-w-16 items-center justify-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    isVariableRewardScheduling
                      ? "bg-accent text-white hover:bg-accent-muted"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  {isVariableRewardScheduling ? "On" : "Off"}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="gesture-repeat-every-days" className="text-xs font-medium text-slate-500">
                Repeat Every (days)
              </label>
              <input
                id="gesture-repeat-every-days"
                type="number"
                min={1}
                step={1}
                disabled={!shouldShowFixedRepeatDays}
                value={formValues.repeatEveryDays > 0 ? formValues.repeatEveryDays : ""}
                onChange={(event) => {
                  const nextRepeatEveryDays = Number.parseInt(event.target.value, 10);
                  updateField("repeatEveryDays", Number.isNaN(nextRepeatEveryDays) ? 0 : nextRepeatEveryDays);
                }}
                className={`${INPUT_BASE_CLASSNAME} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
              />
            </div>

            {shouldShowVariableRepeatDays && (
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="gesture-variable-repeat-days" className="text-xs font-medium text-slate-500">
                    {variableDaysLabel}
                  </label>
                  <span className="text-xs text-slate-400">Comma-separated day intervals</span>
                </div>
                <input
                  id="gesture-variable-repeat-days"
                  type="text"
                  placeholder="2, 5, 10"
                  value={formValues.variableRepeatDays}
                  onChange={(event) => updateField("variableRepeatDays", event.target.value)}
                  className={INPUT_BASE_CLASSNAME}
                />
              </div>
            )}

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between">
                <label htmlFor="gesture-date" className="text-xs font-medium text-slate-500">
                  Target Date
                </label>
                {shouldShowDateHint && (
                  <span className="text-xs text-slate-400">Optional, overrides timescale label</span>
                )}
              </div>
              <input
                id="gesture-date"
                type="date"
                value={formValues.dueDate}
                onChange={(event) => updateField("dueDate", event.target.value)}
                className={INPUT_BASE_CLASSNAME}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="gesture-notes" className="text-xs font-medium text-slate-500">
                Notes
              </label>
              <textarea
                id="gesture-notes"
                rows={3}
                placeholder="Context, idea details, constraints..."
                value={formValues.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                className={INPUT_BASE_CLASSNAME}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
            <p className="text-sm text-rose-500">{errorMessage}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-muted"
              >
                Save Gesture
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { PageShell, Card, Section, EmptyState, Button } from "@/app/components/PageShell";
import { CreateGestureModal } from "@/app/gestures/components/CreateGestureModal";
import {
  formatRepeatSummary,
  formatUpcomingDate,
  GESTURE_CATEGORIES,
  GESTURE_EFFORT_LEVELS,
  INITIAL_SAVED_GESTURES,
  INITIAL_UPCOMING_GESTURES,
  type CreateGestureInput,
  type SavedGesture,
  type UpcomingGesture,
} from "@/app/gestures/gesture-types";

const recommendedToday: Array<{ title: string; reason: string; timing: string }> = [];

export default function GesturesPage() {
  const [savedSearchQuery, setSavedSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [savedGestures, setSavedGestures] = useState<SavedGesture[]>(() => INITIAL_SAVED_GESTURES);
  const [upcomingGestures, setUpcomingGestures] = useState<UpcomingGesture[]>(() => INITIAL_UPCOMING_GESTURES);

  const filteredSavedGestures = useMemo(() => {
    const query = savedSearchQuery.trim().toLowerCase();

    if (!query) {
      return savedGestures;
    }

    return savedGestures.filter((gesture) =>
      [
        gesture.title,
        gesture.category,
        gesture.effort,
        gesture.timescale,
        gesture.repeatMode,
        String(gesture.repeatEveryDays),
        gesture.variableRepeatDays,
        formatRepeatSummary(gesture),
        gesture.notes ?? "",
      ].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [savedSearchQuery, savedGestures]);

  function handleCreateGesture(input: CreateGestureInput): void {
    setSavedGestures((currentGestures) => [
      {
        title: input.title,
        category: input.category,
        effort: input.effort,
        timescale: input.timescale,
        repeatMode: input.repeatMode,
        repeatEveryDays: input.repeatEveryDays,
        variableRepeatDays: input.variableRepeatDays,
        notes: input.notes,
      },
      ...currentGestures,
    ]);

    if (input.timescale !== "Flexible" || input.dueDate) {
      setUpcomingGestures((currentGestures) => [
        {
          title: input.title,
          date: formatUpcomingDate(input),
          person: input.person || "Someone special",
          repeatSummary: formatRepeatSummary(input),
        },
        ...currentGestures,
      ]);
    }
  }

  return (
    <PageShell
      title="Gestures"
      actions={
        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Gesture
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Upcoming Gestures">
            {upcomingGestures.length === 0 ? (
              <Card padding="none">
                <EmptyState
                  title="No upcoming gestures"
                  description="Add a gesture to schedule it for later"
                />
              </Card>
            ) : (
              <div className="grid gap-4">
                {upcomingGestures.map((gesture) => (
                  <Card key={`${gesture.title}-${gesture.date}`}>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-medium text-slate-900">{gesture.title}</h4>
                        <p className="mt-1 text-sm text-slate-500">{gesture.person}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                          {gesture.date}
                        </span>
                        {gesture.repeatSummary !== "No repeat" && (
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                            {gesture.repeatSummary}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Section>

          <Section title="Recommended Today">
            {recommendedToday.length === 0 ? (
              <Card padding="none">
                <EmptyState
                  title="No recommendations yet"
                  description="Recommended gestures will appear after backend sync"
                />
              </Card>
            ) : (
              <div className="grid gap-4">
                {recommendedToday.map((idea) => (
                  <Card key={idea.title}>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-medium text-slate-900">{idea.title}</h4>
                        <p className="mt-1 text-sm text-slate-500">{idea.reason}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                        {idea.timing}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Filters">
            <Card className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500">Person</label>
                <select className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300">
                  <option>All People</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Category</label>
                <select className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300">
                  <option>All Categories</option>
                  {GESTURE_CATEGORIES.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Effort Level</label>
                <select className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300">
                  <option>Any Effort</option>
                  {GESTURE_EFFORT_LEVELS.map((effort) => (
                    <option key={effort}>{effort}</option>
                  ))}
                </select>
              </div>
            </Card>
          </Section>

          <Section
            title="Saved Gestures"
            action={
              <div className="relative w-64 max-w-full">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
                <input
                  type="search"
                  aria-label="Search saved gestures"
                  placeholder="Search gestures"
                  value={savedSearchQuery}
                  onChange={(event) => setSavedSearchQuery(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300"
                />
              </div>
            }
          >
            {filteredSavedGestures.length === 0 ? (
              <Card padding="none">
                <EmptyState
                  title="No saved gestures found"
                  description="Try a different search term"
                />
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredSavedGestures.map((idea) => {
                  const repeatSummary = formatRepeatSummary(idea);

                  return (
                    <Card key={`saved-${idea.title}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <h4 className="font-medium text-slate-900">{idea.title}</h4>
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                              {idea.category}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                              {idea.effort} effort
                            </span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                              {idea.timescale}
                            </span>
                            {repeatSummary !== "No repeat" && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                {repeatSummary}
                              </span>
                            )}
                          </div>
                          {idea.notes && <p className="text-xs text-slate-500">{idea.notes}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsCreateModalOpen(true)}
                          aria-label={`Add ${idea.title}`}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Section>
        </div>
      </div>

      {isCreateModalOpen && (
        <CreateGestureModal onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreateGesture} />
      )}
    </PageShell>
  );
}

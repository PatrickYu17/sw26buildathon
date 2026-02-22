"use client";

import { useMemo, useState, useCallback } from "react";
import { PageShell, Card, Section, EmptyState, Button } from "@/app/components/PageShell";
import { CreateGestureModal } from "@/app/gestures/components/CreateGestureModal";
import { GESTURE_CATEGORIES, GESTURE_EFFORT_LEVELS, type CreateGestureInput } from "@/app/gestures/gesture-types";
import { api } from "@/app/lib/api";
import { useApi } from "@/app/lib/hooks/use-api";

function formatDate(value: string | null): string {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString();
}

function formatRepeatSummary(repeatMode: string | null, repeatEveryDays: number | null): string {
  if (!repeatMode) return "No repeat";
  if (repeatMode === "Repeat every N days" && repeatEveryDays) {
    return `Every ${repeatEveryDays} day${repeatEveryDays === 1 ? "" : "s"}`;
  }
  return repeatMode;
}

export default function GesturesPage() {
  const [savedSearchQuery, setSavedSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterEffort, setFilterEffort] = useState("");
  const [filterPerson, setFilterPerson] = useState("");
  const [newTemplateTitle, setNewTemplateTitle] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("Daily");
  const [newTemplateEffort, setNewTemplateEffort] = useState("Low");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: gesturesData, refetch: refetchGestures } = useApi(
    () => api.gestures.list({ category: filterCategory || undefined, effort: filterEffort || undefined, person_id: filterPerson || undefined }),
    [filterCategory, filterEffort, filterPerson],
  );

  const { data: templatesData, refetch: refetchTemplates } = useApi(() => api.templates.list(), []);
  const { data: peopleData } = useApi(() => api.people.list(), []);
  const { data: overdueData } = useApi(() => api.gestures.overdue(), []);

  const allGestures = useMemo(() => gesturesData?.data ?? [], [gesturesData?.data]);
  const templates = useMemo(() => templatesData?.data ?? [], [templatesData?.data]);
  const people = useMemo(() => peopleData?.data ?? [], [peopleData?.data]);
  const overdueGestures = useMemo(() => overdueData?.data ?? [], [overdueData?.data]);
  const personNameById = useMemo(
    () => new Map(people.map((person) => [person.id, person.display_name])),
    [people],
  );

  const upcomingGestures = useMemo(() => allGestures.filter((g) => g.status === "pending"), [allGestures]);
  const completedGestures = useMemo(() => allGestures.filter((g) => g.status === "completed"), [allGestures]);

  const filteredTemplates = useMemo(() => {
    const q = savedSearchQuery.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((t) => [t.title, t.category, t.effort, t.description ?? ""].some((v) => v.toLowerCase().includes(q)));
  }, [savedSearchQuery, templates]);

  const handleCreateGesture = useCallback(
    async (input: CreateGestureInput) => {
      setError(null);
      try {
        await api.gestures.create({
          title: input.title,
          category: input.category,
          effort: input.effort,
          person_id: input.person || undefined,
          due_at: input.dueDate ? new Date(input.dueDate).toISOString() : undefined,
          repeat_mode: input.repeatMode !== "No repeat" ? input.repeatMode : undefined,
          repeat_every_days: input.repeatMode === "Repeat every N days" ? input.repeatEveryDays : undefined,
          notes: input.notes || undefined,
        });
        await refetchGestures();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create gesture.");
      }
    },
    [refetchGestures],
  );

  async function createTemplate() {
    if (!newTemplateTitle.trim()) return;
    setError(null);
    try {
      await api.templates.create({
        title: newTemplateTitle.trim(),
        category: newTemplateCategory,
        effort: newTemplateEffort,
        description: newTemplateDescription.trim() || undefined,
      });
      setNewTemplateTitle("");
      setNewTemplateDescription("");
      await refetchTemplates();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create template.");
    }
  }

  return (
    <PageShell
      title="Gestures"
      actions={<Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>Create Gesture</Button>}
    >
      {error && <Card className="mb-4 text-sm text-red-600">{error}</Card>}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Upcoming Gestures">
            {upcomingGestures.length === 0 ? (
              <Card padding="none"><EmptyState title="No upcoming gestures" description="Add a gesture to schedule it for later" /></Card>
            ) : (
              <div className="grid gap-4">
                {upcomingGestures.map((gesture) => (
                  <Card key={gesture.id}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900">{gesture.title}</h4>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">{gesture.status}</span>
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">{gesture.category}</span>
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">{gesture.effort} effort</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          Person: {gesture.person_id ? (personNameById.get(gesture.person_id) ?? "Unknown person") : "None"}
                        </p>
                        <p className="text-sm text-slate-600">Due: {formatDate(gesture.due_at)}</p>
                        <p className="text-sm text-slate-600">
                          Repeat: {formatRepeatSummary(gesture.repeat_mode, gesture.repeat_every_days)}
                        </p>
                        {gesture.notes && <p className="mt-1 text-sm text-slate-500">Notes: {gesture.notes}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="primary" size="sm" onClick={async () => { await api.gestures.complete(gesture.id); await refetchGestures(); }}>Done</Button>
                        <Button variant="ghost" size="sm" onClick={async () => { await api.gestures.skip(gesture.id); await refetchGestures(); }}>Skip</Button>
                        <Button variant="ghost" size="sm" onClick={async () => {
                          const nextTitle = window.prompt("Edit title", gesture.title);
                          if (nextTitle?.trim()) {
                            await api.gestures.update(gesture.id, { title: nextTitle.trim() });
                            await refetchGestures();
                          }
                        }}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={async () => { await api.gestures.delete(gesture.id); await refetchGestures(); }}>Delete</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Section>

          <Section title="Completed">
            {completedGestures.length === 0 ? (
              <Card padding="none"><EmptyState title="No completed gestures yet" description="Complete gestures to see them here" /></Card>
            ) : (
              <div className="grid gap-4">
                {completedGestures.slice(0, 10).map((gesture) => (
                  <Card key={gesture.id}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 line-through">{gesture.title}</h4>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-700">completed</span>
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">{gesture.category}</span>
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">{gesture.effort} effort</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          Person: {gesture.person_id ? (personNameById.get(gesture.person_id) ?? "Unknown person") : "None"}
                        </p>
                        <p className="text-sm text-slate-600">Completed: {formatDate(gesture.completed_at)}</p>
                        <p className="text-sm text-slate-600">Due: {formatDate(gesture.due_at)}</p>
                        <p className="text-sm text-slate-600">
                          Repeat: {formatRepeatSummary(gesture.repeat_mode, gesture.repeat_every_days)}
                        </p>
                        {gesture.notes && <p className="mt-1 text-sm text-slate-500">Notes: {gesture.notes}</p>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Section>

          <Section title="Overdue">
            {overdueGestures.length === 0 ? (
              <Card padding="none"><EmptyState title="No overdue gestures" description="Great pacing so far." /></Card>
            ) : (
              <div className="grid gap-2">
                {overdueGestures.map((gesture) => (
                  <Card key={gesture.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{gesture.title}</p>
                      <p className="mt-1 text-xs text-red-700">Overdue since {formatDate(gesture.due_at)}</p>
                      <p className="text-xs text-slate-600">
                        Person: {gesture.person_id ? (personNameById.get(gesture.person_id) ?? "Unknown person") : "None"}
                      </p>
                      <p className="text-xs text-slate-600">{gesture.category} - {gesture.effort} effort</p>
                      {gesture.notes && <p className="mt-1 text-xs text-slate-500">Notes: {gesture.notes}</p>}
                    </div>
                    <Button size="sm" onClick={async () => { await api.gestures.complete(gesture.id); await refetchGestures(); }}>Complete</Button>
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
                <select value={filterPerson} onChange={(e) => setFilterPerson(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300">
                  <option value="">All People</option>
                  {people.map((p) => <option key={p.id} value={p.id}>{p.display_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Category</label>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300">
                  <option value="">All Categories</option>
                  {GESTURE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Effort Level</label>
                <select value={filterEffort} onChange={(e) => setFilterEffort(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300">
                  <option value="">Any Effort</option>
                  {GESTURE_EFFORT_LEVELS.map((effort) => <option key={effort}>{effort}</option>)}
                </select>
              </div>
            </Card>
          </Section>

          <Section title="Saved Templates" action={<input type="search" aria-label="Search templates" placeholder="Search templates" value={savedSearchQuery} onChange={(e) => setSavedSearchQuery(e.target.value)} className="w-48 rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-sm text-slate-900 placeholder:text-slate-400" />}>
            <Card className="space-y-2">
              <input value={newTemplateTitle} onChange={(e) => setNewTemplateTitle(e.target.value)} placeholder="Template title" className="w-full rounded border border-slate-200 px-2 py-1 text-sm" />
              <select value={newTemplateCategory} onChange={(e) => setNewTemplateCategory(e.target.value)} className="w-full rounded border border-slate-200 px-2 py-1 text-sm">
                {GESTURE_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
              </select>
              <select value={newTemplateEffort} onChange={(e) => setNewTemplateEffort(e.target.value)} className="w-full rounded border border-slate-200 px-2 py-1 text-sm">
                {GESTURE_EFFORT_LEVELS.map((effort) => <option key={effort}>{effort}</option>)}
              </select>
              <textarea value={newTemplateDescription} onChange={(e) => setNewTemplateDescription(e.target.value)} placeholder="Template description" className="w-full rounded border border-slate-200 px-2 py-1 text-sm" rows={2} />
              <Button size="sm" onClick={() => void createTemplate()} disabled={!newTemplateTitle.trim()}>Save Template</Button>
            </Card>

            {filteredTemplates.length === 0 ? (
              <Card padding="none"><EmptyState title="No templates found" description="Create a template to reuse gestures" /></Card>
            ) : (
              <div className="mt-3 space-y-3">
                {filteredTemplates.map((template) => (
                  <Card key={template.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <h4 className="font-medium text-slate-900">{template.title}</h4>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{template.category}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{template.effort} effort</span>
                        </div>
                        {template.description && <p className="text-xs text-slate-500">{template.description}</p>}
                      </div>
                      <div className="flex flex-col gap-1">
                        <button type="button" onClick={async () => { await api.gestures.fromTemplate({ template_id: template.id }); await refetchGestures(); }} className="rounded-lg border border-slate-200 px-2 py-1 text-xs">Use</button>
                        <button type="button" onClick={async () => {
                          const nextTitle = window.prompt("Edit template title", template.title);
                          if (nextTitle?.trim()) {
                            await api.templates.update(template.id, { title: nextTitle.trim() });
                            await refetchTemplates();
                          }
                        }} className="rounded-lg border border-slate-200 px-2 py-1 text-xs">Edit</button>
                        <button type="button" onClick={async () => { await api.templates.delete(template.id); await refetchTemplates(); }} className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">Delete</button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>

      {isCreateModalOpen && (
        <CreateGestureModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateGesture}
          people={people}
        />
      )}
    </PageShell>
  );
}

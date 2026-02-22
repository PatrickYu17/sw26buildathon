"use client";

import { useState } from "react";
import { PageShell, Card, Section, EmptyState, Button } from "@/app/components/PageShell";
import { api } from "@/app/lib/api";
import { useApi } from "@/app/lib/hooks/use-api";

export default function PlansPage() {
  const [occasion, setOccasion] = useState("Just Because");
  const [budget, setBudget] = useState("Any Budget");
  const [generatedPlan, setGeneratedPlan] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: upcomingEventsData } = useApi(() => api.events.upcoming(10), []);
  const { data: templatesData } = useApi(() => api.templates.list(), []);
  const { data: gesturesData, refetch: refetchGestures } = useApi(() => api.gestures.upcoming(10), []);

  const upcomingEvents = upcomingEventsData?.data ?? [];
  const templates = templatesData?.data ?? [];
  const upcomingGestures = gesturesData?.data ?? [];

  async function generatePlan() {
    setCreating(true);
    setError(null);
    try {
      const prompt = `Generate a concrete relationship plan for occasion '${occasion}' with budget '${budget}'. Include 3 activity ideas and one suggested follow-up message.`;
      const res = await api.ai.chat({
        messages: [{ role: "user", content: prompt }],
        ai_mode: "plan_generator",
        context: {
          task: {
            occasion,
            budget,
          },
        },
      });
      setGeneratedPlan(res.content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate plan.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <PageShell
      title="Plans"
      subtitle="Plan dates, activities, and special occasions"
      actions={<Button variant="primary" onClick={() => void generatePlan()} disabled={creating}>{creating ? "Generating..." : "Generate Plan"}</Button>}
    >
      {error && <Card className="mb-4 text-sm text-red-600">{error}</Card>}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Upcoming Plans">
            <Card padding="none">
              {upcomingEvents.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{event.title}</p>
                        <p className="text-xs text-slate-500">{event.event_type || "Event"}</p>
                      </div>
                      <span className="text-xs text-slate-500">{new Date(event.start_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No upcoming plans" description="Create your first plan or get AI suggestions" />
              )}
            </Card>
          </Section>

          <Section title="Template-based Ideas">
            {templates.length === 0 ? (
              <Card padding="none"><EmptyState title="No gesture templates" description="Create templates in Gestures and reuse them here." /></Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {templates.slice(0, 8).map((template) => (
                  <Card key={template.id} className="group transition-all hover:border-slate-300 hover:shadow-md">
                    <div className="space-y-2">
                      <h4 className="font-medium text-slate-900">{template.title}</h4>
                      <p className="text-sm text-slate-500">{template.description || "No description"}</p>
                      <div className="flex gap-1.5">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{template.category}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{template.effort}</span>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={async () => {
                          await api.gestures.fromTemplate({ template_id: template.id });
                          await refetchGestures();
                        }}
                      >
                        Add to Upcoming
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Section>

          {generatedPlan && (
            <Section title="AI Plan">
              <Card className="whitespace-pre-wrap text-sm text-slate-800">{generatedPlan}</Card>
            </Section>
          )}
        </div>

        <div className="space-y-6">
          <Section title="AI Planner">
            <Card className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500">Occasion</label>
                <select value={occasion} onChange={(e) => setOccasion(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <option>Just Because</option>
                  <option>Anniversary</option>
                  <option>Birthday</option>
                  <option>Apology</option>
                  <option>Celebration</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Budget</label>
                <select value={budget} onChange={(e) => setBudget(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <option>Any Budget</option>
                  <option>Free</option>
                  <option>$</option>
                  <option>$$</option>
                  <option>$$$</option>
                </select>
              </div>
              <Button variant="primary" className="w-full" onClick={() => void generatePlan()} disabled={creating}>{creating ? "Generating..." : "Generate Plan"}</Button>
            </Card>
          </Section>

          <Section title="Upcoming Gesture Plans">
            <Card padding="none">
              {upcomingGestures.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {upcomingGestures.map((gesture) => (
                    <div key={gesture.id} className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-900">{gesture.title}</p>
                      <p className="text-xs text-slate-500">{gesture.category} - {gesture.effort}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No planned gestures" description="Use templates to build upcoming plans." />
              )}
            </Card>
          </Section>
        </div>
      </div>
    </PageShell>
  );
}

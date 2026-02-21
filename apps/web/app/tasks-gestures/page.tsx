import { PageShell, Card, Section, EmptyState, Button } from "@/app/components/PageShell";

export default function TasksAndGesturesPage() {
  return (
    <PageShell
      title="Tasks & Gestures"
      subtitle="Thoughtful ideas to nurture your relationships"
      actions={
        <Button variant="primary">
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Task
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          <Section title="Active Tasks">
            <Card padding="none">
              <EmptyState
                icon={
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                title="No active tasks"
                description="Create a task or pick from suggestions"
                action={<Button variant="secondary" size="sm">Browse Ideas</Button>}
              />
            </Card>
          </Section>

          <Section title="Gesture Ideas">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { title: "Send a good morning text", category: "Daily", effort: "Low" },
                { title: "Plan a surprise date", category: "Special", effort: "High" },
                { title: "Write a love note", category: "Romantic", effort: "Medium" },
                { title: "Cook their favorite meal", category: "Caring", effort: "Medium" },
              ].map((idea) => (
                <Card key={idea.title} className="group cursor-pointer transition-all hover:border-slate-300 hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-slate-900">{idea.title}</h4>
                      <div className="mt-2 flex gap-2">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {idea.category}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {idea.effort} effort
                        </span>
                      </div>
                    </div>
                    <button className="rounded-lg p-1.5 text-slate-400 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </Section>
        </div>

        {/* Sidebar */}
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
                  <option>Daily</option>
                  <option>Romantic</option>
                  <option>Special</option>
                  <option>Caring</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Effort Level</label>
                <select className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300">
                  <option>Any Effort</option>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
            </Card>
          </Section>

          <Section title="Completed">
            <Card padding="none">
              <EmptyState
                title="No completed tasks"
                description="Completed tasks will appear here"
              />
            </Card>
          </Section>
        </div>
      </div>
    </PageShell>
  );
}

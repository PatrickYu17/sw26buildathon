import { PageShell, Card, Section, EmptyState, Button } from "@/app/components/PageShell";

export default function PlansPage() {
  return (
    <PageShell
      title="Plans"
      subtitle="Plan dates, activities, and special occasions"
      actions={
        <Button variant="primary">
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Plan
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Plans List */}
        <div className="space-y-6 lg:col-span-2">
          <Section title="Upcoming Plans">
            <Card padding="none">
              <EmptyState
                icon={
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
                  </svg>
                }
                title="No upcoming plans"
                description="Create your first plan or get AI suggestions"
                action={<Button variant="secondary" size="sm">Get Suggestions</Button>}
              />
            </Card>
          </Section>

          <Section title="Plan Ideas">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { 
                  title: "Romantic Dinner", 
                  description: "A cozy dinner at a nice restaurant",
                  icon: "🍽️",
                  tags: ["Date Night", "Romantic"]
                },
                { 
                  title: "Movie Night", 
                  description: "Watch a movie together at home",
                  icon: "🎬",
                  tags: ["Casual", "At Home"]
                },
                { 
                  title: "Weekend Getaway", 
                  description: "A short trip to somewhere new",
                  icon: "✈️",
                  tags: ["Adventure", "Special"]
                },
                { 
                  title: "Picnic in the Park", 
                  description: "Enjoy good food and nature",
                  icon: "🧺",
                  tags: ["Outdoor", "Casual"]
                },
              ].map((idea) => (
                <Card key={idea.title} className="group cursor-pointer transition-all hover:border-slate-300 hover:shadow-md">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                      {idea.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">{idea.title}</h4>
                      <p className="mt-0.5 text-sm text-slate-500">{idea.description}</p>
                      <div className="mt-2 flex gap-1.5">
                        {idea.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Section title="AI Planner">
            <Card className="space-y-4">
              <p className="text-sm text-slate-500">
                Let AI help you plan the perfect date or activity based on your preferences.
              </p>
              <div>
                <label className="text-xs font-medium text-slate-500">What's the occasion?</label>
                <select className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300">
                  <option>Just Because</option>
                  <option>Anniversary</option>
                  <option>Birthday</option>
                  <option>Apology</option>
                  <option>Celebration</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Budget</label>
                <select className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300">
                  <option>Any Budget</option>
                  <option>Free</option>
                  <option>$</option>
                  <option>$$</option>
                  <option>$$$</option>
                </select>
              </div>
              <Button variant="primary" className="w-full">
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Generate Plan
              </Button>
            </Card>
          </Section>

          <Section title="Past Plans">
            <Card padding="none">
              <EmptyState
                title="No past plans"
                description="Your completed plans will appear here"
              />
            </Card>
          </Section>
        </div>
      </div>
    </PageShell>
  );
}

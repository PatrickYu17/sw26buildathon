import { PageShell, Card, Section, EmptyState, Button } from "@/app/components/PageShell";

export default function SchedulePage() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const currentDate = new Date();
  const currentDay = currentDate.getDate();

  return (
    <PageShell
      title="Schedule"
      subtitle="Dates, birthdays, anniversaries & reminders"
      actions={
        <Button variant="primary">
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Event
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-slate-900">February 2026</h3>
              <div className="flex gap-1">
                <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Day Headers */}
            <div className="mb-2 grid grid-cols-7 gap-1">
              {days.map((day) => (
                <div key={day} className="py-2 text-center text-xs font-medium text-slate-400">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                <button
                  key={day}
                  className={`aspect-square rounded-lg p-2 text-sm transition-colors ${
                    day === currentDay
                      ? "bg-slate-900 font-medium text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Upcoming Events Sidebar */}
        <div className="space-y-6">
          <Section title="Today">
            <Card padding="none">
              <EmptyState
                title="No events today"
                description="Enjoy your day!"
              />
            </Card>
          </Section>

          <Section title="This Week">
            <Card padding="none">
              <EmptyState
                icon={
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                }
                title="No upcoming events"
                description="Add birthdays and anniversaries"
              />
            </Card>
          </Section>

          <Section title="Categories">
            <Card className="space-y-2">
              {[
                { label: "Birthdays", color: "bg-pink-500" },
                { label: "Anniversaries", color: "bg-purple-500" },
                { label: "Date Nights", color: "bg-blue-500" },
                { label: "Reminders", color: "bg-amber-500" },
              ].map((cat) => (
                <div key={cat.label} className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${cat.color}`} />
                  <span className="text-sm text-slate-600">{cat.label}</span>
                </div>
              ))}
            </Card>
          </Section>
        </div>
      </div>
    </PageShell>
  );
}

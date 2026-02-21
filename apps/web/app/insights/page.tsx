import { PageShell, Card, Section, EmptyState } from "@/app/components/PageShell";

export default function InsightsPage() {
  return (
    <PageShell
      title="Insights"
      subtitle="Analytics and patterns in your relationships"
    >
      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Interactions", value: "0", change: null },
          { label: "Active Relationships", value: "0", change: null },
          { label: "Gestures This Month", value: "0", change: null },
          { label: "Streak Days", value: "0", change: null },
        ].map((stat) => (
          <Card key={stat.label}>
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">{stat.value}</p>
            {stat.change && (
              <p className="mt-1 text-sm text-green-600">{stat.change}</p>
            )}
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Activity Chart Placeholder */}
        <Section title="Activity Over Time">
          <Card className="h-64">
            <div className="flex h-full items-end justify-between gap-2 px-4 pb-4">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                <div key={day} className="flex flex-1 flex-col items-center gap-2">
                  <div 
                    className="w-full rounded-t bg-slate-200" 
                    style={{ height: `${Math.random() * 60 + 20}%` }}
                  />
                  <span className="text-xs text-slate-400">{day}</span>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* Relationship Health */}
        <Section title="Relationship Health">
          <Card padding="none">
            <EmptyState
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              }
              title="No data yet"
              description="Start tracking interactions to see relationship health scores"
            />
          </Card>
        </Section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* AI Insights */}
        <div className="lg:col-span-2">
          <Section title="AI Insights">
            <Card padding="none">
              <EmptyState
                icon={
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                }
                title="No insights yet"
                description="Add notes and track interactions to get personalized insights"
              />
            </Card>
          </Section>
        </div>

        {/* Top People */}
        <Section title="Top Connections">
          <Card padding="none">
            <EmptyState
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              }
              title="No connections yet"
              description="Your most active relationships will appear here"
            />
          </Card>
        </Section>
      </div>
    </PageShell>
  );
}

import { PageShell, Panel, PanelHeader, PanelBody, EmptyState, Button, StatCard } from "@/app/components/PageShell";
import { PersonDropdown } from "@/app/components/PersonDropdown";
import { redirect } from "next/navigation";
import { isAuthenticatedRequest } from "@/app/lib/auth-session";

export default async function Home() {
  const isAuthenticated = await isAuthenticatedRequest();

  if (!isAuthenticated) {
    redirect("/login");
  }

  return (
    <PageShell
      title="Dashboard"
      titleClassName="text-3xl"
      titleAccessory={
        <div className="mt-1 flex items-center gap-2 sm:mt-0 sm:ml-2">
          <PersonDropdown
            id="dashboard-person-selector"
            label="Select person"
            className="w-48"
            options={[
              { value: "", label: "Select Person", disabled: true },
              { value: "all", label: "All People" },
            ]}
          />
          <button
            type="button"
            disabled
            aria-label="Add person (coming soon)"
            title="Add person (coming soon)"
            className="inline-flex h-[38px] w-10 items-center justify-center rounded-none border border-border bg-accent-light/30 text-text-muted opacity-70"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      }
      actions={
        <Button variant="primary">
          <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.625c0-.621-.504-1.125-1.125-1.125h-9A1.125 1.125 0 004.5 5.625v12.75c0 .621.504 1.125 1.125 1.125h9c.621 0 1.125-.504 1.125-1.125V15m-3-3h7.5m0 0l-3-3m3 3l-3 3" />
          </svg>
          Log Out
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard 
            label="Days Since Last Gesture" 
            value={0}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard 
            label="Upcoming Tasks" 
            value={0}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            }
          />
          <StatCard 
            label="This Week" 
            value={0}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Main Grid */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-4 lg:col-span-2">
            {/* Suggested Actions */}
            <Panel>
              <PanelHeader>Thoughtful Gestures</PanelHeader>
              <EmptyState
                icon={
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                }
                title="Ideas will appear here"
                description="We'll suggest meaningful ways to connect with people you care about"
              />
            </Panel>

            {/* Preferences */}
            <div className="grid gap-4 md:grid-cols-2">
              <Panel>
                <PanelHeader>Likes</PanelHeader>
                <PanelBody>
                  <p className="text-sm text-text-muted">No likes added yet.</p>
                </PanelBody>
              </Panel>

              <Panel>
                <PanelHeader>Dislikes</PanelHeader>
                <PanelBody>
                  <p className="text-sm text-text-muted">No dislikes added yet.</p>
                </PanelBody>
              </Panel>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Upcoming Events */}
            <Panel>
              <PanelHeader>Coming Up</PanelHeader>
              <EmptyState
                icon={
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" />
                  </svg>
                }
                title="No events yet"
                description="Birthdays and special dates will show up here"
              />
            </Panel>

            <Panel>
              <PanelHeader>Quick Note</PanelHeader>
              <PanelBody className="space-y-3">
                <textarea
                  placeholder="Remember something sweet..."
                  className="w-full resize-none rounded-xl border border-border bg-accent-light/30 px-4 py-3 text-sm text-foreground placeholder:text-text-muted focus:border-accent focus:bg-white focus:outline-none transition-colors"
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button variant="primary" size="sm">Save</Button>
                </div>
              </PanelBody>
            </Panel>

          </div>
        </div>
      </div>
    </PageShell>
  );
}

import { PageShell, Card, Section, Button } from "@/app/components/PageShell";

export default function SettingsPage() {
  return (
    <PageShell
      title="Settings"
      subtitle="Manage your account and preferences"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Settings */}
        <div className="space-y-6 lg:col-span-2">
          <Section title="Profile">
            <Card className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-400">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <div>
                  <Button variant="secondary" size="sm">Upload Photo</Button>
                </div>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-slate-500">Name</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="primary">Save Changes</Button>
              </div>
            </Card>
          </Section>

          <Section title="Notifications">
            <Card className="space-y-4">
              {[
                { id: "reminders", label: "Event Reminders", description: "Get notified about upcoming birthdays and anniversaries" },
                { id: "suggestions", label: "AI Suggestions", description: "Receive periodic gesture and task suggestions" },
                { id: "weekly", label: "Weekly Summary", description: "Get a weekly recap of your relationship activity" },
              ].map((setting) => (
                <div key={setting.id} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{setting.label}</p>
                    <p className="text-sm text-slate-500">{setting.description}</p>
                  </div>
                  <button className="relative h-6 w-11 rounded-full bg-slate-200 transition-colors">
                    <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform" />
                  </button>
                </div>
              ))}
            </Card>
          </Section>

          <Section title="Preferences">
            <Card className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500">Theme</label>
                <select className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300">
                  <option>System</option>
                  <option>Light</option>
                  <option>Dark</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Language</label>
                <select className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300">
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
            </Card>
          </Section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Section title="Account">
            <Card className="space-y-3">
              <Button variant="ghost" className="w-full justify-start">
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
                Change Password
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                Export Data
              </Button>
              <hr className="border-slate-200" />
              <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700">
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Sign Out
              </Button>
            </Card>
          </Section>

          <Section title="Danger Zone">
            <Card className="border-red-200 bg-red-50/50">
              <p className="text-sm text-red-700">
                Permanently delete your account and all associated data.
              </p>
              <button className="mt-3 w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50">
                Delete Account
              </button>
            </Card>
          </Section>
        </div>
      </div>
    </PageShell>
  );
}

"use client";

import { useState, useCallback } from "react";
import { PageShell, Card, Section, Button } from "@/app/components/PageShell";
import { NotificationsSettingsCard } from "@/app/settings/components/NotificationsSettingsCard";
import { api } from "@/app/lib/api";
import { useApi } from "@/app/lib/hooks/use-api";

function applyThemePreference(theme: string) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
    root.setAttribute("data-theme", "dark");
    return;
  }
  if (theme === "light") {
    root.classList.add("light");
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
    return;
  }
  root.classList.remove("dark");
  root.classList.add("light");
  root.setAttribute("data-theme", "light");
}

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  const [theme, setTheme] = useState("system");
  const [prefsSaving, setPrefsSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState("");

  const { data: notificationsData, refetch: refetchNotifications } = useApi(
    () => api.settings.getNotifications(),
    [],
  );

  useApi(async () => {
    try {
      const res = await api.auth.me();
      if (!profileLoaded) {
        setName(res.user.name || "");
        setEmail(res.user.email || "");
        setProfileLoaded(true);
      }
    } catch {}
    return null;
  }, [profileLoaded]);

  useApi(async () => {
    try {
      const res = await api.settings.getPreferences();
      if (res.data) {
        const resolvedTheme = res.data.theme || "system";
        setTheme(resolvedTheme);
        applyThemePreference(resolvedTheme);
      }
    } catch {}
    return null;
  }, []);

  const handleSaveProfile = useCallback(async () => {
    setProfileSaving(true);
    setProfileMsg("");
    try {
      await api.settings.updateProfile({ name, email });
      setProfileMsg("Saved!");
    } catch (e) {
      setProfileMsg(e instanceof Error ? e.message : "Failed to save");
    }
    setProfileSaving(false);
  }, [name, email]);

  const handleSavePreferences = useCallback(async () => {
    setPrefsSaving(true);
    try {
      await api.settings.updatePreferences({ theme });
      applyThemePreference(theme);
    } catch {}
    setPrefsSaving(false);
  }, [theme]);

  const handleChangePassword = useCallback(async () => {
    setPasswordMsg("");
    try {
      await api.settings.changePassword({ current_password: currentPassword, new_password: newPassword });
      setPasswordMsg("Password changed!");
      setCurrentPassword("");
      setNewPassword("");
      setShowPasswordForm(false);
    } catch (e) {
      setPasswordMsg(e instanceof Error ? e.message : "Failed");
    }
  }, [currentPassword, newPassword]);

  const handleSignOut = useCallback(async () => {
    try {
      await api.auth.signOut();
      window.location.href = "/login";
    } catch {}
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    setDeleteMsg("");
    try {
      await api.settings.deleteAccount({ password: deletePassword });
      window.location.href = "/login";
    } catch (e) {
      setDeleteMsg(e instanceof Error ? e.message : "Failed");
    }
  }, [deletePassword]);

  return (
    <PageShell title="Settings" subtitle="Manage your account and preferences">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Profile">
            <Card className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-slate-500">Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                {profileMsg && <p className="text-xs text-slate-500">{profileMsg}</p>}
                <Button variant="primary" onClick={handleSaveProfile} disabled={profileSaving}>{profileSaving ? "Saving..." : "Save Changes"}</Button>
              </div>
            </Card>
          </Section>

          <Section title="Notifications">
            {notificationsData?.data ? (
              <NotificationsSettingsCard
                initialSettings={notificationsData.data}
                onSave={async (settings) => {
                  await api.settings.updateNotifications(settings);
                  await refetchNotifications();
                }}
              />
            ) : (
              <Card>Loading notifications...</Card>
            )}
          </Section>

          <Section title="Preferences">
            <Card className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500">Theme</label>
                <select value={theme} onChange={(e) => setTheme(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300">
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <div className="flex justify-end">
                <Button variant="primary" size="sm" onClick={handleSavePreferences} disabled={prefsSaving}>{prefsSaving ? "Saving..." : "Save"}</Button>
              </div>
            </Card>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Account">
            <Card className="space-y-3">
              {showPasswordForm ? (
                <div className="space-y-2">
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
                  {passwordMsg && <p className="text-xs text-red-600">{passwordMsg}</p>}
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" onClick={handleChangePassword}>Change</Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowPasswordForm(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button variant="ghost" className="w-full justify-start" onClick={() => setShowPasswordForm(true)}>Change Password</Button>
              )}
              <hr className="border-slate-200" />
              <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700" onClick={handleSignOut}>Sign Out</Button>
            </Card>
          </Section>

          <Section title="Danger Zone">
            <Card className="border-red-200 bg-red-50/50">
              <p className="text-sm text-red-700">Permanently delete your account and all associated data.</p>
              {showDeleteConfirm ? (
                <div className="mt-3 space-y-2">
                  <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder="Enter your password to confirm" className="w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm" />
                  {deleteMsg && <p className="text-xs text-red-600">{deleteMsg}</p>}
                  <div className="flex gap-2">
                    <button onClick={handleDeleteAccount} className="rounded-lg border border-red-300 bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700">Delete Forever</button>
                    <button onClick={() => setShowDeleteConfirm(false)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowDeleteConfirm(true)} className="mt-3 w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50">Delete Account</button>
              )}
            </Card>
          </Section>
        </div>
      </div>
    </PageShell>
  );
}

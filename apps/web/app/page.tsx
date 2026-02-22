"use client";

import { useCallback, useMemo, useState } from "react";
import { PageShell, Panel, PanelHeader, PanelBody, EmptyState, Button, StatCard, Card, Section } from "@/app/components/PageShell";
import { PersonDropdown } from "@/app/components/PersonDropdown";
import { api } from "@/app/lib/api";
import { useApi } from "@/app/lib/hooks/use-api";

export default function Home() {
  const [selectedPersonId, setSelectedPersonId] = useState<string>("all");
  const [quickNote, setQuickNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [newLike, setNewLike] = useState("");
  const [newDislike, setNewDislike] = useState("");
  const [newPersonName, setNewPersonName] = useState("");
  const [newNote, setNewNote] = useState("");
  const [notesSearch, setNotesSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: peopleData, refetch: refetchPeople } = useApi(() => api.people.list(), []);
  const { data: dashData, refetch: refetchDash } = useApi(
    () => api.dashboard.get(selectedPersonId !== "all" ? selectedPersonId : undefined),
    [selectedPersonId],
  );

  const { data: prefData, refetch: refetchPrefs } = useApi(
    () =>
      selectedPersonId && selectedPersonId !== "all"
        ? api.preferences.summary(selectedPersonId)
        : Promise.resolve({ data: { likes: [], dislikes: [] } }),
    [selectedPersonId],
  );

  const { data: notesData, refetch: refetchNotes } = useApi(
    () =>
      selectedPersonId && selectedPersonId !== "all"
        ? api.notes.list(selectedPersonId, { search: notesSearch || undefined, limit: 30 })
        : Promise.resolve({ data: [], total: 0 }),
    [selectedPersonId, notesSearch],
  );

  const { data: prefListData, refetch: refetchPrefList } = useApi(
    () =>
      selectedPersonId && selectedPersonId !== "all"
        ? api.preferences.list(selectedPersonId)
        : Promise.resolve({ data: [] }),
    [selectedPersonId],
  );

  const people = peopleData?.data ?? [];
  const dash = dashData?.data;
  const prefs = prefData?.data ?? { likes: [], dislikes: [] };
  const notes = notesData?.data ?? [];
  const prefItems = prefListData?.data ?? [];

  const personOptions = useMemo(
    () => [
      { value: "", label: "Select Person", disabled: true },
      { value: "all", label: "All People" },
      ...people.map((p) => ({ value: p.id, label: p.display_name })),
    ],
    [people],
  );

  const canUseSelectedPerson = Boolean(selectedPersonId && selectedPersonId !== "all");

  const handleSaveNote = useCallback(async () => {
    if (!quickNote.trim() || !canUseSelectedPerson) return;
    setSaving(true);
    setError(null);
    try {
      await api.notes.quick({ person_id: selectedPersonId, content: quickNote });
      setQuickNote("");
      await Promise.all([refetchDash(), refetchNotes()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save quick note.");
    }
    setSaving(false);
  }, [quickNote, canUseSelectedPerson, selectedPersonId, refetchDash, refetchNotes]);

  const handleAddPreference = useCallback(
    async (kind: "like" | "dislike", value: string) => {
      if (!value.trim() || !canUseSelectedPerson) return;
      setError(null);
      try {
        await api.preferences.create(selectedPersonId, { kind, value: value.trim() });
        if (kind === "like") setNewLike("");
        else setNewDislike("");
        await Promise.all([refetchPrefs(), refetchPrefList()]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add preference.");
      }
    },
    [canUseSelectedPerson, selectedPersonId, refetchPrefs, refetchPrefList],
  );

  const handleAddPerson = useCallback(async () => {
    if (!newPersonName.trim()) return;
    setError(null);
    try {
      await api.people.create({ display_name: newPersonName.trim() });
      setNewPersonName("");
      await refetchPeople();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create person.");
    }
  }, [newPersonName, refetchPeople]);

  const handleDeletePerson = useCallback(async () => {
    if (!canUseSelectedPerson) return;
    setError(null);
    try {
      await api.people.delete(selectedPersonId);
      setSelectedPersonId("all");
      await refetchPeople();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete person.");
    }
  }, [canUseSelectedPerson, selectedPersonId, refetchPeople]);

  const handleCreateNote = useCallback(async () => {
    if (!canUseSelectedPerson || !newNote.trim()) return;
    setError(null);
    try {
      await api.notes.create(selectedPersonId, { content: newNote.trim(), source: "manual" });
      setNewNote("");
      await Promise.all([refetchNotes(), refetchDash()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create note.");
    }
  }, [canUseSelectedPerson, newNote, selectedPersonId, refetchNotes, refetchDash]);

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
            options={personOptions}
            defaultValue="all"
            onChange={setSelectedPersonId}
          />
          <input
            type="text"
            value={newPersonName}
            onChange={(e) => setNewPersonName(e.target.value)}
            placeholder="Add person"
            className="h-[38px] w-32 border border-border px-2 text-sm focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && void handleAddPerson()}
          />
          <button type="button" onClick={() => void handleAddPerson()} className="inline-flex h-[38px] w-10 items-center justify-center rounded-none border border-border bg-accent text-white">+</button>
          {canUseSelectedPerson && (
            <button type="button" onClick={() => void handleDeletePerson()} className="inline-flex h-[38px] items-center justify-center rounded-none border border-red-200 bg-red-50 px-2 text-xs text-red-700">Delete</button>
          )}
        </div>
      }
    >
      {error && <Card className="mb-4 text-sm text-red-600">{error}</Card>}

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Days Since Last Gesture" value={dash?.stats?.days_since_last_gesture ?? 0} />
          <StatCard label="Upcoming Tasks" value={dash?.stats?.upcoming_task_count ?? 0} />
          <StatCard label="This Week" value={dash?.stats?.this_week_count ?? 0} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Panel>
              <PanelHeader>Thoughtful Gestures</PanelHeader>
              {(dash?.suggested_gestures?.length ?? 0) > 0 ? (
                <PanelBody className="space-y-2">
                  {dash?.suggested_gestures.map((gesture) => (
                    <div key={gesture.id} className="flex items-center justify-between rounded border border-border/50 p-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{gesture.title}</p>
                        <p className="text-xs text-text-muted">{gesture.category} - {gesture.effort}</p>
                      </div>
                      <Button variant="primary" size="sm" onClick={async () => { await api.gestures.complete(gesture.id); await refetchDash(); }}>Done</Button>
                    </div>
                  ))}
                </PanelBody>
              ) : (
                <EmptyState title="Ideas will appear here" description="We will suggest meaningful ways to connect." />
              )}
            </Panel>

            <div className="grid gap-4 md:grid-cols-2">
              <Panel>
                <PanelHeader>Likes</PanelHeader>
                <PanelBody>
                  {prefs.likes.length > 0 ? <ul className="space-y-1">{prefs.likes.map((like) => <li key={like} className="text-sm">{like}</li>)}</ul> : <p className="text-sm text-text-muted">No likes added yet.</p>}
                  {canUseSelectedPerson && (
                    <div className="mt-2 flex gap-1">
                      <input type="text" value={newLike} onChange={(e) => setNewLike(e.target.value)} placeholder="Add a like..." className="flex-1 border border-border px-2 py-1 text-sm focus:outline-none" onKeyDown={(e) => e.key === "Enter" && void handleAddPreference("like", newLike)} />
                      <Button variant="primary" size="sm" onClick={() => void handleAddPreference("like", newLike)}>+</Button>
                    </div>
                  )}
                </PanelBody>
              </Panel>

              <Panel>
                <PanelHeader>Dislikes</PanelHeader>
                <PanelBody>
                  {prefs.dislikes.length > 0 ? <ul className="space-y-1">{prefs.dislikes.map((dislike) => <li key={dislike} className="text-sm">{dislike}</li>)}</ul> : <p className="text-sm text-text-muted">No dislikes added yet.</p>}
                  {canUseSelectedPerson && (
                    <div className="mt-2 flex gap-1">
                      <input type="text" value={newDislike} onChange={(e) => setNewDislike(e.target.value)} placeholder="Add a dislike..." className="flex-1 border border-border px-2 py-1 text-sm focus:outline-none" onKeyDown={(e) => e.key === "Enter" && void handleAddPreference("dislike", newDislike)} />
                      <Button variant="primary" size="sm" onClick={() => void handleAddPreference("dislike", newDislike)}>+</Button>
                    </div>
                  )}
                </PanelBody>
              </Panel>
            </div>

            <Section title="Preferences Records">
              <Card padding="none">
                {prefItems.length === 0 ? (
                  <EmptyState title="No preference records" description="Create likes/dislikes to persist preference rows." />
                ) : (
                  <div className="divide-y divide-border">
                    {prefItems.map((pref) => (
                      <div key={pref.id} className="flex items-center justify-between px-4 py-2">
                        <p className="text-sm">{pref.kind}: {pref.value}</p>
                        <button
                          className="text-xs text-red-600"
                          onClick={async () => {
                            await api.preferences.delete(pref.id);
                            await Promise.all([refetchPrefList(), refetchPrefs()]);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </Section>

            <Section title="Notes">
              <Card className="space-y-3">
                {canUseSelectedPerson ? (
                  <>
                    <div className="flex gap-2">
                      <input
                        value={notesSearch}
                        onChange={(e) => setNotesSearch(e.target.value)}
                        placeholder="Search notes"
                        className="w-48 border border-border px-2 py-1 text-sm"
                      />
                      <input
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add note"
                        className="flex-1 border border-border px-2 py-1 text-sm"
                        onKeyDown={(e) => e.key === "Enter" && void handleCreateNote()}
                      />
                      <Button size="sm" onClick={() => void handleCreateNote()}>Add</Button>
                    </div>
                    <div className="space-y-2">
                      {notes.map((note) => (
                        <div key={note.id} className="rounded border border-border/50 p-2">
                          <p className="text-sm text-foreground">{note.content}</p>
                          <div className="mt-1 flex justify-end gap-2">
                            <button
                              className="text-xs text-slate-600"
                              onClick={async () => {
                                const updated = window.prompt("Edit note", note.content);
                                if (updated && updated.trim()) {
                                  await api.notes.update(note.id, { content: updated.trim() });
                                  await refetchNotes();
                                }
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="text-xs text-red-600"
                              onClick={async () => {
                                await api.notes.delete(note.id);
                                await refetchNotes();
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <EmptyState title="Select a person" description="Choose a person to manage notes." />
                )}
              </Card>
            </Section>
          </div>

          <div className="space-y-4">
            <Panel>
              <PanelHeader>Coming Up</PanelHeader>
              {(dash?.upcoming_events?.length ?? 0) > 0 ? (
                <PanelBody className="space-y-2">
                  {dash?.upcoming_events.map((event) => (
                    <div key={event.id} className="flex items-start justify-between">
                      <div><p className="text-sm font-medium text-foreground">{event.title}</p><p className="text-xs text-text-muted">{event.person?.display_name}</p></div>
                      <span className="text-xs text-text-muted">{new Date(event.start_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </PanelBody>
              ) : (
                <EmptyState title="No events yet" description="Birthdays and special dates will show up here" />
              )}
            </Panel>

            <Panel>
              <PanelHeader>Quick Note</PanelHeader>
              <PanelBody className="space-y-3">
                <textarea placeholder={canUseSelectedPerson ? "Remember something..." : "Select a person first..."} disabled={!canUseSelectedPerson} value={quickNote} onChange={(e) => setQuickNote(e.target.value)} className="w-full resize-none rounded-xl border border-border bg-accent-light/30 px-4 py-3 text-sm text-foreground placeholder:text-text-muted focus:border-accent focus:bg-white focus:outline-none transition-colors disabled:opacity-50" rows={3} />
                <div className="flex justify-end">
                  <Button variant="primary" size="sm" disabled={saving || !quickNote.trim() || !canUseSelectedPerson} onClick={() => void handleSaveNote()}>{saving ? "Saving..." : "Save"}</Button>
                </div>
              </PanelBody>
            </Panel>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

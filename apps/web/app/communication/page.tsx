"use client";

import { useState } from "react";
import { PageShell, Card, Section, EmptyState, Button } from "@/app/components/PageShell";
import { ConversationUploadPortal } from "@/app/communication/components/ConversationUploadPortal";
import { MarkdownContent } from "@/app/components/MarkdownContent";
import { api } from "@/app/lib/api";
import { useApi } from "@/app/lib/hooks/use-api";

export default function CommunicationPage() {
  const [conversationInput, setConversationInput] = useState("");
  const [messageType, setMessageType] = useState("Love Note");
  const [messageTone, setMessageTone] = useState("Warm");
  const [messageContext, setMessageContext] = useState("");
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingAnalyze, setLoadingAnalyze] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPersonForImport, setSelectedPersonForImport] = useState("");

  const { data: importsData, refetch: refetchImports } = useApi(() => api.imports.list({ limit: 15 }), []);
  const { data: peopleData } = useApi(() => api.people.list(), []);
  const imports = importsData?.data ?? [];
  const people = peopleData?.data ?? [];

  async function handleGenerate() {
    if (!messageContext.trim()) return;
    setLoadingGenerate(true);
    setError(null);

    try {
      const prompt = `Draft a ${messageTone.toLowerCase()} ${messageType.toLowerCase()} message. Context: ${messageContext.trim()}. Keep it concise and natural.`;
      const res = await api.ai.chat({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        ai_mode: "message_drafter",
        context: {
          task: {
            messageType,
            tone: messageTone,
          },
        },
      });
      setGeneratedMessage(res.content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate message.");
    } finally {
      setLoadingGenerate(false);
    }
  }

  async function handleAnalyze() {
    if (!conversationInput.trim()) return;
    setLoadingAnalyze(true);
    setError(null);

    try {
      const prompt = `Analyze this conversation and provide: 1) key themes 2) communication risks 3) actionable suggestions.\n\n${conversationInput}`;
      const res = await api.ai.chat({
        messages: [{ role: "user", content: prompt }],
        ai_mode: "conversation_analyst",
        context: {
          task: {
            analysisType: "themes-risks-suggestions",
          },
        },
      });
      setAnalysis(res.content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to analyze conversation.");
    } finally {
      setLoadingAnalyze(false);
    }
  }

  async function handleSaveImport() {
    if (!conversationInput.trim()) return;
    setLoadingImport(true);
    setError(null);

    try {
      await api.imports.upload({
        content: conversationInput,
        source: "communication-analyzer",
        person_id: selectedPersonForImport || undefined,
      });
      await refetchImports();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save import.");
    } finally {
      setLoadingImport(false);
    }
  }

  async function handleCreateNotes(importId: string, personId: string) {
    if (!personId) return;
    setError(null);
    try {
      await api.imports.createNotes(importId, { person_id: personId });
      await refetchImports();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create notes from import.");
    }
  }

  return (
    <PageShell title="Analysis" subtitle="Analyze conversations and improve how you communicate">
      {error && <Card className="mb-4 text-sm text-red-600">{error}</Card>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col">
          <h3 className="text-lg font-medium text-slate-900">Message Helper</h3>
          <p className="mt-1 text-sm text-slate-500">Get AI help crafting the perfect message</p>

          <div className="mt-4 space-y-4 flex-1">
            <div>
              <label className="text-xs font-medium text-slate-500">Type</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {["Love Note", "Apology", "Thank You", "Check-in", "Support"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setMessageType(type)}
                    className={`rounded-full border px-3 py-1.5 text-sm ${messageType === type ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">Context / What happened</label>
              <textarea
                value={messageContext}
                onChange={(event) => setMessageContext(event.target.value)}
                placeholder="Describe the situation or what you want to say..."
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300"
                rows={4}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">Tone</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {["Warm", "Sincere", "Playful", "Formal", "Casual"].map((tone) => (
                  <button
                    key={tone}
                    onClick={() => setMessageTone(tone)}
                    className={`rounded-full border px-3 py-1.5 text-sm ${messageTone === tone ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"}`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="primary" onClick={() => void handleGenerate()} disabled={loadingGenerate || !messageContext.trim()}>
              {loadingGenerate ? "Generating..." : "Generate Message"}
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col">
          <h3 className="text-lg font-medium text-slate-900">Generated Message</h3>
          <p className="mt-1 text-sm text-slate-500">Your AI-crafted message will appear here</p>

          <div className="mt-4 flex-1">
            {generatedMessage ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900">
                <MarkdownContent
                  content={generatedMessage}
                  className="whitespace-pre-wrap break-words [&_a]:underline [&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1 [&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:text-[15px] [&_h2]:font-semibold [&_h3]:mb-1 [&_h3]:font-semibold [&_ol]:ml-5 [&_ol]:list-decimal [&_p]:m-0 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-black/10 [&_pre]:p-2 [&_ul]:ml-5 [&_ul]:list-disc"
                />
              </div>
            ) : (
              <EmptyState title="No message yet" description="Fill in the form and click Generate" />
            )}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(generatedMessage || "")} disabled={!generatedMessage}>Copy</Button>
            <Button variant="secondary" size="sm" onClick={() => void handleGenerate()} disabled={loadingGenerate || !messageContext.trim()}>Regenerate</Button>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Section title="Upload Portal" description="Upload Instagram exports or text message transcripts and format them for analysis.">
          <ConversationUploadPortal onUseInAnalyzer={setConversationInput} />
        </Section>
      </div>

      <div className="mt-6">
        <Section title="Conversation Analyzer" description="Paste a conversation to get insights and suggestions">
          <Card className="space-y-4">
            <textarea
              placeholder="Paste your conversation here..."
              value={conversationInput}
              onChange={(event) => setConversationInput(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300"
              rows={6}
            />
            <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <select
                value={selectedPersonForImport}
                onChange={(e) => setSelectedPersonForImport(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">No person selected for import</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>{person.display_name}</option>
                ))}
              </select>
              <Button variant="secondary" onClick={() => void handleSaveImport()} disabled={loadingImport || !conversationInput.trim()}>
                {loadingImport ? "Saving..." : "Save as Import"}
              </Button>
              <Button variant="primary" onClick={() => void handleAnalyze()} disabled={loadingAnalyze || !conversationInput.trim()}>
                {loadingAnalyze ? "Analyzing..." : "Analyze"}
              </Button>
            </div>

            {analysis && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm whitespace-pre-wrap">
                {analysis}
              </div>
            )}
          </Card>
        </Section>
      </div>

      <div className="mt-6">
        <Section title="Recent Imports" description="Imported files saved to backend and available for note generation.">
          <Card padding="none">
            {imports.length === 0 ? (
              <EmptyState title="No imports yet" description="Upload or save a conversation to create import records." />
            ) : (
              <div className="divide-y divide-slate-100">
                {imports.map((record) => (
                  <div key={record.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{record.filename || "Conversation Import"}</p>
                        <p className="text-xs text-slate-500">{record.status} - notes created: {record.notes_created}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            const personId = e.target.value;
                            if (personId) {
                              void handleCreateNotes(record.id, personId);
                              e.target.value = "";
                            }
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                        >
                          <option value="">Create notes for...</option>
                          {people.map((person) => (
                            <option key={person.id} value={person.id}>{person.display_name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Section>
      </div>
    </PageShell>
  );
}

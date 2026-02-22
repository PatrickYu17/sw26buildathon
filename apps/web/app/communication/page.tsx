"use client";

import { useState } from "react";
import { PageShell, Card, Section, EmptyState, Button } from "@/app/components/PageShell";
import { ConversationUploadPortal } from "@/app/communication/components/ConversationUploadPortal";

export default function CommunicationPage() {
  const [conversationInput, setConversationInput] = useState("");

  return (
    <PageShell
      title="Analysis"
      subtitle="Analyze conversations and improve how you communicate"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Message Composer */}
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
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100"
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">Context / What happened</label>
              <textarea
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
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100"
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="primary">
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Generate Message
            </Button>
          </div>
        </Card>

        {/* Generated Output */}
        <Card className="flex flex-col">
          <h3 className="text-lg font-medium text-slate-900">Generated Message</h3>
          <p className="mt-1 text-sm text-slate-500">Your AI-crafted message will appear here</p>
          
          <div className="mt-4 flex-1">
            <EmptyState
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              }
              title="No message yet"
              description="Fill in the form and click Generate"
            />
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" size="sm">
              <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
              Copy
            </Button>
            <Button variant="secondary" size="sm">
              <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Regenerate
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Section
          title="Upload Portal"
          description="Upload Instagram exports or text message transcripts and format them for analysis."
        >
          <ConversationUploadPortal onUseInAnalyzer={setConversationInput} />
        </Section>
      </div>

      {/* Conversation Analyzer */}
      <div className="mt-6">
        <Section 
          title="Conversation Analyzer" 
          description="Paste a conversation to get insights and suggestions"
        >
          <Card className="space-y-4">
            <textarea
              placeholder="Paste your conversation here..."
              value={conversationInput}
              onChange={(event) => setConversationInput(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300"
              rows={6}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setConversationInput("")}
                disabled={!conversationInput.trim()}
              >
                Clear
              </Button>
              <Button variant="secondary">
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                Analyze
              </Button>
            </div>
          </Card>
        </Section>
      </div>
    </PageShell>
  );
}

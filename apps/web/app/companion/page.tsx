"use client";

import { useRef, useState } from "react";
import { PageShell, Card, EmptyState } from "@/app/components/PageShell";
import { PersonDropdown } from "@/app/components/PersonDropdown";

export default function CompanionPage() {
  const [askInput, setAskInput] = useState("");
  const askInputRef = useRef<HTMLInputElement | null>(null);
  const quickPrompts = [
    "Help me plan a date",
    "Suggest a thoughtful gesture",
    "How can I be more supportive?",
    "Draft an apology message",
  ];

  const handleQuickPromptClick = (prompt: string) => {
    setAskInput(prompt);
    askInputRef.current?.focus();
    askInputRef.current?.setSelectionRange(prompt.length, prompt.length);
  };

  return (
    <PageShell
      title="Coach"
    >
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Chat Area */}
        <div className="lg:col-span-3">
          <Card className="flex h-[calc(100vh-220px)] min-h-[400px] flex-col">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto">
              <EmptyState
                icon={
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                }
                title="Start a conversation"
                description="Ask for advice, get suggestions, or just chat about your relationships"
              />
            </div>

            {/* Input Area */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask your companion anything..."
                  value={askInput}
                  onChange={(event) => setAskInput(event.target.value)}
                  ref={askInputRef}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300"
                />
                <button className="flex items-center justify-center rounded-xl bg-slate-900 px-4 text-white transition-colors hover:bg-slate-800">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
                <button className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-slate-600 transition-colors hover:bg-slate-50">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h3 className="text-sm font-medium text-slate-900">Quick Prompts</h3>
            <div className="mt-3 space-y-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleQuickPromptClick(prompt)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-slate-900">Context</h3>
            <p className="mt-2 text-sm text-slate-500">
              Select a person to get personalized advice based on your history together.
            </p>
            <PersonDropdown
              id="companion-person-selector"
              label="Select person for companion context"
              className="mt-3"
              options={[
                { value: "", label: "Select Person", disabled: true },
                { value: "all", label: "All People" },
              ]}
            />
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

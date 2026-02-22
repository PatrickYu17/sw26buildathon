"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PageShell, Card, EmptyState, Button } from "@/app/components/PageShell";
import { PersonDropdown } from "@/app/components/PersonDropdown";
import { MarkdownContent } from "@/app/components/MarkdownContent";
import { api } from "@/app/lib/api";
import type { ChatBlock, ConversationMessage } from "@/app/lib/api-types";
import { useApi } from "@/app/lib/hooks/use-api";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
};

const quickPrompts = [
  "Help me plan a date",
  "Suggest a thoughtful gesture",
  "How can I be more supportive?",
  "Draft an apology message",
];

export default function CompanionPage() {
  const [askInput, setAskInput] = useState("");
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const askInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { data: conversationsData, refetch: refetchConversations } = useApi(
    () => api.conversations.list(),
    [],
  );

  const conversations = conversationsData?.conversations ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === currentConversationId) ?? null,
    [conversations, currentConversationId],
  );

  const handleQuickPromptClick = (prompt: string) => {
    setAskInput(prompt);
    askInputRef.current?.focus();
    askInputRef.current?.setSelectionRange(prompt.length, prompt.length);
  };

  const toPlainText = (content: string | ChatBlock[]): string => {
    if (typeof content === "string") return content;
    return content
      .map((block) => (block.type === "text" ? block.text : "[Image]"))
      .join("\n")
      .trim();
  };

  const toUiMessage = (message: ConversationMessage): UiMessage => ({
    id: message.id,
    role: message.role,
    content: toPlainText(message.content),
  });

  async function ensureConversationId(): Promise<string> {
    if (currentConversationId) return currentConversationId;
    const created = await api.conversations.create({
      title: askInput.slice(0, 50) || "New conversation",
      ai_mode: "relationship_coach",
    });
    setCurrentConversationId(created.id);
    await refetchConversations();
    return created.id;
  }

  async function sendMessage() {
    const content = askInput.trim();
    if (!content || sending) return;

    setSending(true);
    setError(null);
    setAskInput("");

    const userMessage: UiMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
    };
    const assistantId = `assistant-${Date.now()}`;

    setMessages((prev) => [...prev, userMessage, { id: assistantId, role: "assistant", content: "", streaming: true }]);

    try {
      const conversationId = await ensureConversationId();

      for await (const chunk of api.conversations.sendMessageStream(conversationId, { content })) {
        if (chunk.error) {
          throw new Error(chunk.error);
        }

        if (chunk.text) {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId
                ? { ...message, content: `${message.content}${chunk.text}` }
                : message,
            ),
          );
        }

        if (chunk.done) {
          setMessages((prev) => prev.map((message) => (message.id === assistantId ? { ...message, streaming: false } : message)));
        }
      }

      await refetchConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message.");
      setMessages((prev) => prev.map((message) => (message.id === assistantId ? { ...message, streaming: false } : message)));
    } finally {
      setSending(false);
    }
  }

  async function openConversation(conversationId: string) {
    setCurrentConversationId(conversationId);
    setLoadingConversation(true);
    setError(null);

    try {
      const result = await api.conversations.messages(conversationId);
      setMessages(result.messages.map(toUiMessage));
    } catch (err) {
      setMessages([]);
      setError(err instanceof Error ? err.message : "Failed to load conversation.");
    } finally {
      setLoadingConversation(false);
    }
  }

  function startNewConversation() {
    setCurrentConversationId(null);
    setMessages([]);
    setError(null);
    setAskInput("");
    askInputRef.current?.focus();
  }

  return (
    <PageShell title="Coach">
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card className="flex h-[calc(100vh-220px)] min-h-[400px] flex-col">
            <div className="flex-1 overflow-y-auto">
              {loadingConversation ? (
                <div className="p-4 text-sm text-slate-500">Loading conversation...</div>
              ) : messages.length === 0 ? (
                <EmptyState
                  title="Start a conversation"
                  description="Ask for advice, get suggestions, or chat about your relationships"
                />
              ) : (
                <div className="space-y-3 p-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                        message.role === "user"
                          ? "ml-auto bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-900"
                      }`}
                    >
                      <MarkdownContent
                        content={message.content || (message.streaming ? "..." : "")}
                        className={`whitespace-pre-wrap break-words [&_a]:underline [&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1 [&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:text-[15px] [&_h2]:font-semibold [&_h3]:mb-1 [&_h3]:font-semibold [&_ol]:ml-5 [&_ol]:list-decimal [&_p]:m-0 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-black/10 [&_pre]:p-2 [&_ul]:ml-5 [&_ul]:list-disc`}
                      />
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {error && <p className="px-3 py-2 text-xs text-red-600">{error}</p>}

            <div className="border-t border-slate-100 pt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask your companion anything..."
                  value={askInput}
                  onChange={(event) => setAskInput(event.target.value)}
                  ref={askInputRef}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300"
                />
                <button
                  onClick={() => void sendMessage()}
                  disabled={sending || loadingConversation || !askInput.trim()}
                  className="flex items-center justify-center rounded-xl bg-slate-900 px-4 text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-900">Conversations</h3>
              <Button variant="ghost" size="sm" onClick={startNewConversation}>New</Button>
            </div>
            <div className="space-y-2">
              {conversations.length === 0 && <p className="text-xs text-slate-500">No conversations yet.</p>}
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => void openConversation(conversation.id)}
                  disabled={loadingConversation}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                    currentConversationId === conversation.id
                      ? "border-slate-800 bg-slate-100"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <p className="font-medium text-slate-800">{conversation.title}</p>
                  <p className="text-xs text-slate-500">{new Date(conversation.updated_at).toLocaleString()}</p>
                </button>
              ))}
            </div>
          </Card>

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
            {selectedConversation && (
              <p className="mt-2 text-xs text-slate-500">Active: {selectedConversation.title}</p>
            )}
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

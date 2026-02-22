"use client";

import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Button, Card } from "@/app/components/PageShell";
import {
  type ConversationImportResult,
  type ConversationSource,
  formatConversationForAnalyzer,
  parseConversationContent,
} from "@/app/communication/lib/message-import";

type ConversationUploadPortalProps = {
  onUseInAnalyzer: (transcript: string) => void;
};

const SOURCE_OPTIONS: Array<{ value: ConversationSource; label: string; helper: string }> = [
  {
    value: "instagram",
    label: "Instagram DM",
    helper: "Best with Instagram export JSON or copied thread text",
  },
  {
    value: "text",
    label: "Text Messages",
    helper: "Use TXT/CSV exports or pasted SMS/iMessage transcripts",
  },
];

function acceptedFormatsFor(source: ConversationSource): string {
  return source === "instagram" ? ".json,.txt" : ".txt,.csv,.json";
}

export function ConversationUploadPortal({ onUseInAnalyzer }: ConversationUploadPortalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [source, setSource] = useState<ConversationSource>("instagram");
  const [importResult, setImportResult] = useState<ConversationImportResult | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isDragActive, setIsDragActive] = useState(false);

  const previewMessages = useMemo(() => {
    if (!importResult) {
      return [];
    }
    return importResult.messages.slice(0, 6);
  }, [importResult]);

  const handleConversationFile = async (file: File) => {
    setIsProcessing(true);
    setErrorMessage("");
    setImportResult(null);

    try {
      const rawContent = await file.text();
      const parsed = parseConversationContent(rawContent, source);

      if (parsed.messages.length === 0) {
        setErrorMessage(
          "No messages were detected. Try a different export file or switch source type."
        );
        setSelectedFileName(file.name);
        return;
      }

      setImportResult(parsed);
      setSelectedFileName(file.name);
    } catch {
      setErrorMessage("Upload failed. Please retry with a valid text or JSON file.");
      setSelectedFileName(file.name);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInput = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    await handleConversationFile(file);
    event.target.value = "";
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);

    const droppedFile = event.dataTransfer.files?.[0];
    if (!droppedFile) {
      return;
    }

    await handleConversationFile(droppedFile);
  };

  const handleUseInAnalyzer = () => {
    if (!importResult) {
      return;
    }
    const transcript = formatConversationForAnalyzer(importResult.messages);
    onUseInAnalyzer(transcript);
  };

  const resetImport = () => {
    setImportResult(null);
    setSelectedFileName("");
    setErrorMessage("");
  };

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SOURCE_OPTIONS.map((option) => {
          const isActive = source === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setSource(option.value);
                resetImport();
              }}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                isActive
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-slate-500">
        {SOURCE_OPTIONS.find((option) => option.value === source)?.helper}
      </p>

      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={handleDrop}
        className={`rounded-lg border-2 border-dashed px-5 py-8 text-center transition-colors ${
          isDragActive
            ? "border-slate-500 bg-slate-100"
            : "border-slate-300 bg-slate-50 hover:border-slate-400"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={acceptedFormatsFor(source)}
          onChange={handleFileInput}
        />
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v4.125c0 .621-.504 1.125-1.125 1.125H5.625A1.125 1.125 0 014.5 18.375V14.25m12-6.75L12 3m0 0L7.5 7.5M12 3v12"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-900">Drop a conversation export here</p>
        <p className="mt-1 text-xs text-slate-500">or click to browse ({acceptedFormatsFor(source)})</p>
      </div>

      {isProcessing && <p className="text-sm text-slate-500">Processing file...</p>}
      {selectedFileName && (
        <p className="text-xs text-slate-500">
          File: <span className="font-medium text-slate-700">{selectedFileName}</span>
        </p>
      )}
      {errorMessage && (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p>
      )}

      {importResult && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs text-slate-500">Messages</p>
              <p className="text-base font-semibold text-slate-900">{importResult.messages.length}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs text-slate-500">Participants</p>
              <p className="text-base font-semibold text-slate-900">{importResult.participants.length}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs text-slate-500">Source</p>
              <p className="text-base font-semibold capitalize text-slate-900">{importResult.source}</p>
            </div>
          </div>

          {importResult.participants.length > 0 && (
            <p className="text-xs text-slate-600">
              Participants: {importResult.participants.join(", ")}
            </p>
          )}

          {importResult.warnings.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {importResult.warnings.join(" ")}
            </div>
          )}

          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-3 py-2">
              <p className="text-xs font-medium text-slate-600">Preview</p>
            </div>
            <div className="max-h-56 overflow-auto px-3 py-2">
              {previewMessages.map((message, index) => (
                <div key={`${message.sender}-${index}`} className="mb-2 last:mb-0">
                  <p className="text-xs font-medium text-slate-700">{message.sender}</p>
                  <p className="text-sm text-slate-900 whitespace-pre-wrap">{message.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={resetImport}>
              Clear
            </Button>
            <Button variant="primary" size="sm" onClick={handleUseInAnalyzer}>
              Use in Analyzer
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

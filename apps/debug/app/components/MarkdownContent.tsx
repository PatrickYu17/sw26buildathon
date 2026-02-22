"use client";

import { useMemo } from "react";

type MarkdownContentProps = {
  content: string;
  className?: string;
};

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}

function safeHref(rawHref: string): string | null {
  try {
    const trimmed = rawHref.trim();
    if (!trimmed) return null;
    const parsed = new URL(trimmed, "https://example.com");
    const protocol = parsed.protocol.toLowerCase();
    if (protocol === "http:" || protocol === "https:" || protocol === "mailto:") {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
}

function renderInline(markdown: string): string {
  let escaped = escapeHtml(markdown);

  escaped = escaped.replace(/`([^`\n]+?)`/g, "<code>$1</code>");
  escaped = escaped.replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>");
  escaped = escaped.replace(/\*([^*\n]+?)\*/g, "<em>$1</em>");

  escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, href) => {
    const safeUrl = safeHref(href);
    if (!safeUrl) {
      return text;
    }
    return `<a href="${escapeAttribute(safeUrl)}" target="_blank" rel="noreferrer noopener">${text}</a>`;
  });

  return escaped;
}

function markdownToSafeHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length && lines[index].startsWith("```")) {
        index += 1;
      }
      const languageAttr = language ? ` data-language="${escapeAttribute(language)}"` : "";
      html.push(`<pre><code${languageAttr}>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      html.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`);
      index += 1;
      continue;
    }

    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index].startsWith("> ")) {
        quoteLines.push(lines[index].slice(2));
        index += 1;
      }
      html.push(`<blockquote>${quoteLines.map((quoteLine) => renderInline(quoteLine)).join("<br/>")}</blockquote>`);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^[-*]\s+/, ""));
        index += 1;
      }
      html.push(`<ul>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      html.push(`<ol>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ol>`);
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].startsWith("```") &&
      !/^(#{1,6})\s+/.test(lines[index]) &&
      !lines[index].startsWith("> ") &&
      !/^[-*]\s+/.test(lines[index]) &&
      !/^\d+\.\s+/.test(lines[index])
    ) {
      paragraphLines.push(lines[index]);
      index += 1;
    }

    html.push(`<p>${paragraphLines.map((paragraphLine) => renderInline(paragraphLine)).join("<br/>")}</p>`);
  }

  return html.join("");
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  const html = useMemo(() => markdownToSafeHtml(content), [content]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

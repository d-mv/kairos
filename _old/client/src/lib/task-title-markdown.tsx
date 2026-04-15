import type { ReactNode } from "react";

type TaskTitleToken =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "italic"; value: string }
  | { type: "link"; value: string; href: string };

const LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s]+)/g;
const EMPHASIS_PATTERN = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;

function pushTextWithEmphasis(tokens: TaskTitleToken[], value: string) {
  if (!value) return;

  let lastIndex = 0;
  for (const match of value.matchAll(EMPHASIS_PATTERN)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      tokens.push({ type: "text", value: value.slice(lastIndex, start) });
    }

    const segment = match[0];
    if (segment.startsWith("**") && segment.endsWith("**")) {
      tokens.push({ type: "bold", value: segment.slice(2, -2) });
    } else if (segment.startsWith("*") && segment.endsWith("*")) {
      tokens.push({ type: "italic", value: segment.slice(1, -1) });
    } else {
      tokens.push({ type: "text", value: segment });
    }

    lastIndex = start + segment.length;
  }

  if (lastIndex < value.length) {
    tokens.push({ type: "text", value: value.slice(lastIndex) });
  }
}

export function tokenizeTaskTitleMarkdown(title: string): TaskTitleToken[] {
  const tokens: TaskTitleToken[] = [];
  let lastIndex = 0;

  for (const match of title.matchAll(LINK_PATTERN)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      pushTextWithEmphasis(tokens, title.slice(lastIndex, start));
    }

    const markdownText = match[1];
    const markdownHref = match[2];
    const plainUrl = match[3];
    if (markdownText && markdownHref) {
      tokens.push({ type: "link", value: markdownText, href: markdownHref });
    } else if (plainUrl) {
      tokens.push({ type: "link", value: plainUrl, href: plainUrl });
    }

    lastIndex = start + match[0].length;
  }

  if (lastIndex < title.length) {
    pushTextWithEmphasis(tokens, title.slice(lastIndex));
  }

  return tokens;
}

export function renderTaskTitleMarkdown(title: string): ReactNode[] {
  return tokenizeTaskTitleMarkdown(title).map((token, index) => {
    const key = `${index}-${token.type}`;
    if (token.type === "bold") {
      return <strong key={key}>{token.value}</strong>;
    }

    if (token.type === "italic") {
      return <em key={key}>{token.value}</em>;
    }

    if (token.type === "link") {
      return (
        <a
          key={key}
          href={token.href}
          target="_blank"
          rel="noreferrer noopener"
          onClick={(event) => event.stopPropagation()}
          style={{ color: "inherit", textDecoration: "underline", textDecorationStyle: "dotted" }}
        >
          {token.value}
        </a>
      );
    }

    return <span key={key}>{token.value}</span>;
  });
}

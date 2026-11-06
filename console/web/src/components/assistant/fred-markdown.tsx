import Link from "next/link";
import type { ReactNode } from "react";

/** The small, safe slice of Markdown Fred writes: paragraphs, lists, pipe tables, headings as bold
 * lines, **bold**, `code` and links. Built as React elements, never as HTML, so nothing a model
 * writes can run. Console paths become in-app links; repo files cited in text link to GitHub. */

const REPO = "https://github.com/David-Chousal/S.C.O.U.T./blob/main/";
const INLINE = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)|\b((?:docs|console|firmware|shore|analytics|hardware|mechanical)\/[\w./-]+\.(?:md|js|ts|tsx|py|json|ino|cpp|h))\b/g;

function safeHref(href: string): { kind: "internal" | "external"; href: string } | null {
  if (/^\/(?!\/)[\w/?=&.#-]*$/.test(href)) return { kind: "internal", href };
  if (/^https:\/\/[\w.-]+\//.test(href)) return { kind: "external", href };
  if (/^(docs|console)\/[\w./-]+$/.test(href)) return { kind: "external", href: REPO + href };
  return null;
}

export function inline(text: string, keyBase = "i"): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let n = 0;
  for (const match of text.matchAll(INLINE)) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const key = `${keyBase}-${n++}`;
    const [, bold, code, label, href, file] = match;
    if (bold) out.push(<strong key={key}>{bold}</strong>);
    else if (code) out.push(<code key={key}>{code}</code>);
    else if (file) out.push(<a key={key} href={REPO + file} target="_blank" rel="noopener noreferrer">{file}</a>);
    else {
      const target = safeHref(href);
      if (!target) out.push(label);
      else if (target.kind === "internal") out.push(<Link key={key} href={target.href}>{label}</Link>);
      else out.push(<a key={key} href={target.href} target="_blank" rel="noopener noreferrer">{label}</a>);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const cells = (line: string) => line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

function table(lines: string[], key: string): ReactNode {
  const [head, , ...rows] = lines;
  return (
    <div className="sc-fred__table" key={key}>
      <table>
        <thead><tr>{cells(head).map((c, i) => <th key={i}>{inline(c, `${key}h${i}`)}</th>)}</tr></thead>
        <tbody>{rows.map((row, r) => <tr key={r}>{cells(row).map((c, i) => <td key={i}>{inline(c, `${key}r${r}c${i}`)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

/** Group lines into blocks, each a paragraph, a list or a table. */
export function FredMarkdown({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  const lines = text.replace(/\r/g, "").split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const key = `b${i}`;
    if (!line.trim()) { i++; continue; }
    if (/^\s*\|.*\|\s*$/.test(line) && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] ?? "")) {
      const start = i;
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) i++;
      blocks.push(table(lines.slice(start, i), key));
      continue;
    }
    const bullet = /^\s*(?:[-*]|\d+\.)\s+/;
    if (bullet.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items: string[] = [];
      while (i < lines.length && bullet.test(lines[i])) items.push(lines[i++].replace(bullet, ""));
      const children = items.map((item, n) => <li key={n}>{inline(item, `${key}l${n}`)}</li>);
      blocks.push(ordered ? <ol key={key}>{children}</ol> : <ul key={key}>{children}</ul>);
      continue;
    }
    const para: string[] = [lines[i++]];
    while (i < lines.length && lines[i].trim() && !bullet.test(lines[i]) && !/^\s*\|/.test(lines[i])) para.push(lines[i++]);
    const heading = /^#{1,6}\s+(.*)$/.exec(para[0] ?? "");
    blocks.push(heading
      ? <p key={key}><strong>{heading[1]}</strong>{para.length > 1 && <><br />{inline(para.slice(1).join(" "), key)}</>}</p>
      : <p key={key}>{inline(para.join(" "), key)}</p>);
  }
  return <>{blocks}</>;
}

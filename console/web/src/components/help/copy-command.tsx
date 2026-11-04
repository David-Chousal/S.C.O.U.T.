"use client";

import { useState } from "react";

interface CopyCommandProps {
  command: string;
}

/** A command block with a copy button, so nobody retypes a long line by hand. */
export function CopyCommand({ command }: CopyCommandProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    window.setTimeout(() => setStatus("idle"), 2000);
  }

  const label = status === "copied" ? "Copied" : status === "failed" ? "Select and copy" : "Copy";
  return (
    <div className="sc-guide__command">
      <pre><code>{command}</code></pre>
      <button type="button" className="sc-key sc-key--sm" onClick={copy} aria-live="polite">{label}</button>
    </div>
  );
}

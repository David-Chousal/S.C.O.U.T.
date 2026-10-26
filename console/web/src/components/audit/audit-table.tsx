"use client";

import { Banner } from "@/components/feedback/banner";
import { api } from "@/lib/api/client";
import type { AuditEntry } from "@/lib/api/types";
import { utc } from "@/lib/format";
import { useApi } from "@/lib/use-api";

function change(entry: AuditEntry): string {
  if (!entry.before_json && !entry.after_json) return "";
  return `${entry.before_json ?? "—"} → ${entry.after_json ?? "—"}`;
}

/** Every change in the console, newest first: who, what, and the value before and after. */
export function AuditTable() {
  const { data, error } = useApi<{ entries: AuditEntry[] }>(api.audit);
  if (error) return <Banner tone="failed">{error}</Banner>;
  if (!data) return <span className="sc-tag" aria-busy="true">Loading the log…</span>;
  return (
    <section className="sc-bay" aria-labelledby="audit-title">
      <div className="sc-bay__head"><h2 className="sc-bay__title" id="audit-title">Changes</h2><span className="sc-tag">Newest first · last 200</span></div>
      <div className="sc-table-wrap">
        <table className="sc-table">
          <thead><tr><th scope="col">When</th><th scope="col">Who</th><th scope="col">Action</th><th scope="col">Target</th><th scope="col">Change</th></tr></thead>
          <tbody>
            {data.entries.length === 0 && <tr><td colSpan={5} className="sc-help">Nothing yet.</td></tr>}
            {data.entries.map((entry) => (
              <tr key={entry.id}>
                <td className="n">{utc(entry.at)}</td>
                <td>{entry.actor_label}</td>
                <td><span className="sc-tag">{entry.action}</span></td>
                <td>{entry.target}</td>
                <td><span className="sub">{change(entry)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

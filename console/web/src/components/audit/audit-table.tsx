"use client";

import { Banner } from "@/components/feedback/banner";
import { api } from "@/lib/api/client";
import type { AuditEntry } from "@/lib/api/types";
import { actionLabel, changeLines, targetLabel } from "@/lib/audit-format";
import { useWhen } from "@/lib/preferences-context";
import { useApi } from "@/lib/use-api";

/** Every change in the console, newest first: who, what, and the value before and after. */
export function AuditTable() {
  const when = useWhen();
  const { data, error } = useApi<{ entries: AuditEntry[] }>(api.audit);
  if (error) return <Banner tone="failed">{error}</Banner>;
  if (!data) return <span className="sc-tag" aria-busy="true">Loading the log…</span>;
  return (
    <section className="sc-bay" aria-labelledby="audit-title">
      <div className="sc-bay__head"><h2 className="sc-bay__title" id="audit-title">Changes</h2><span className="sc-tag">Newest first · last 200</span></div>
      <div className="sc-table-wrap">
        <table className="sc-table sc-audit-table">
          <thead><tr><th scope="col">When</th><th scope="col">Who</th><th scope="col">Action</th><th scope="col">Target</th><th scope="col">Change</th></tr></thead>
          <tbody>
            {data.entries.length === 0 && <tr><td colSpan={5} className="sc-help">Nothing yet.</td></tr>}
            {data.entries.map((entry) => (
              <tr key={entry.id}>
                <td className="sc-audit-table__when">{when(entry.at)}</td>
                <td className="sc-audit-table__who">{entry.actor_label}</td>
                <td>{actionLabel(entry.action)}</td>
                <td>{targetLabel(entry)}</td>
                <td>{changeLines(entry).map((line) => <span key={line} className="sub">{line}</span>)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

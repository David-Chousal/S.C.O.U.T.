"use client";

import { Banner } from "@/components/feedback/banner";
import { api } from "@/lib/api/client";
import type { StorageReport } from "@/lib/api/types";
import { useApi } from "@/lib/use-api";

const FREE = { writes: 1_000_000, reads: 10_000_000, bytes: 10e9 };
const n = (value: number) => value.toLocaleString("en-US");
const mb = (bytes: number) => `${(bytes / 1e6).toFixed(bytes < 1e7 ? 2 : 0)} MB`;

/** Settings → Buoys, admins only: R2 use this month against the console's own ceilings, which
 * sit well under Cloudflare's free tier (worker/storage.js), and the newest nightly backup. */
export function StoragePanel() {
  const { data, error } = useApi<StorageReport>(api.storage);
  if (error) return <Banner tone="failed">{error}</Banner>;
  if (!data) return <span className="sc-tag" aria-busy="true">Loading file storage…</span>;
  const rows = [
    { label: "Writes this month", used: n(data.usage.writes), cap: n(data.budget.writesPerMonth), free: n(FREE.writes) },
    { label: "Reads this month", used: n(data.usage.reads), cap: n(data.budget.readsPerMonth), free: n(FREE.reads) },
    { label: "Stored", used: mb(data.usage.storedBytes), cap: mb(data.budget.storedBytes), free: mb(FREE.bytes) },
  ];
  return (
    <section className="sc-bay" aria-labelledby="storage-title">
      <div className="sc-bay__head"><h3 className="sc-bay__title" id="storage-title">File storage</h3><span className="sc-tag">Admins only · R2</span></div>
      {!data.bound && <Banner tone="caution">No R2 bucket is bound, so backups are not being written.</Banner>}
      <p className="sc-help">
        The console stops itself at these ceilings, well under Cloudflare&rsquo;s free tier, so R2 cannot run up a bill. Backups
        are deleted after 35 days and reports after 2.
      </p>
      <div className="sc-table-wrap">
        <table className="sc-table">
          <thead><tr><th scope="col">Use</th><th scope="col" className="n">Used</th><th scope="col" className="n">Console stops at</th><th scope="col" className="n">Free tier</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}><th scope="row">{row.label}</th><td className="n">{row.used}</td><td className="n">{row.cap}</td><td className="n">{row.free}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="sc-help">
        Newest backup: {data.lastBackup ? <span className="sc-num">{data.lastBackup.key} ({mb(data.lastBackup.bytes)})</span> : "none yet"}. It runs nightly at 10:30 UTC.
      </p>
    </section>
  );
}

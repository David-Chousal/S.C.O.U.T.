"use client";

import { useState } from "react";
import { Banner } from "@/components/feedback/banner";
import { useToast } from "@/components/feedback/toaster";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import type { Fleet, ReportItem, ReportList } from "@/lib/api/types";
import { useWhen } from "@/lib/preferences-context";
import { can, needs, useSession } from "@/lib/session";
import { useApi } from "@/lib/use-api";
import { ReportComposer } from "./report-composer";

function RecentReports({ reports, canDownload, now }: { reports: ReportItem[]; canDownload: boolean; now: number }) {
  const when = useWhen();
  const { show } = useToast();
  async function freshLink(report: ReportItem) {
    try {
      window.location.assign((await api.reportLink(report.id)).link);
    } catch (failure) {
      show({ tone: "failed", title: "No link", detail: failure instanceof Error ? failure.message : undefined });
    }
  }
  return (
    <section className="sc-bay" aria-labelledby="recent-title">
      <div className="sc-bay__head"><h2 className="sc-bay__title" id="recent-title">Your recent reports</h2><span className="sc-tag">Files kept 2 days</span></div>
      <div className="sc-list">
        {reports.length === 0 && <p className="sc-help">None yet.</p>}
        {reports.map((report) => {
          const kept = report.expires_at > now;
          return (
            <div key={report.id} className="sc-list__row">
              <span className="sc-list__main">
                <strong>{report.params.from.slice(0, 10)} to {report.params.to.slice(0, 10)}</strong>
                <span>{report.rows.toLocaleString("en-US")} readings · buoys {report.params.buoys.join(", ")} · made {when(report.created_at)}</span>
              </span>
              <span className="sc-list__end">
                {kept
                  ? <Key size="sm" icon="export" disabled={!canDownload} onClick={() => freshLink(report)}>Download</Key>
                  : <span className="sc-badge sc-badge--muted">Deleted</span>}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** The Reports page: make a CSV (stored briefly in R2) or open a printable report. */
export function ReportsBoard() {
  const { user } = useSession();
  const fleet = useApi<Fleet>(api.fleet);
  const list = useApi<ReportList>(api.reports);
  const [now] = useState(() => Date.now());
  const canDownload = can(user.role, "reports.write");

  if (fleet.error || list.error) return <Banner tone="failed">{fleet.error || list.error}</Banner>;
  if (!fleet.data || !list.data) return <span className="sc-tag" aria-busy="true">Loading…</span>;
  return (
    <>
      {!canDownload && <Banner tone="info" icon="lock">View only: CSV downloads need the {needs("reports.write")} role. The printable report works for everyone.</Banner>}
      <ReportComposer buoys={fleet.data.buoys} columns={list.data.columns} canDownload={canDownload}
        today={new Date(now).toISOString().slice(0, 10)}
        onCreated={(link) => { list.reload(); window.location.assign(link); }} />
      <RecentReports reports={list.data.reports} canDownload={canDownload} now={now} />
    </>
  );
}

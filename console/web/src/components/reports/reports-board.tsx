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
import { useViewOnlyNote } from "@/lib/view-only-note";
import { chooseStart, readDraft, type SavedLayout } from "@/lib/report/saved";
import { ReportBuilder } from "./builder/report-builder";

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
      <div className="sc-bay__head"><h2 className="sc-bay__title" id="recent-title">Recent CSVs</h2><span className="sc-tag">Files kept 2 days</span></div>
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

/** The Reports page: the report builder, with recent CSVs (stored briefly in R2) beside it. */
export function ReportsBoard() {
  const { user } = useSession();
  const fleet = useApi<Fleet>(api.fleet);
  const list = useApi<ReportList>(api.reports);
  const layouts = useApi<{ layouts: SavedLayout[] }>(api.reportLayouts);
  const [now] = useState(() => Date.now());
  const canDownload = can(user.role, "reports.write");
  useViewOnlyNote(canDownload ? null : `View only: CSV downloads need the ${needs("reports.write")} role. Previewing, printing and Download PDF work for everyone.`);

  const [start, setStart] = useState<ReturnType<typeof chooseStart> | null>(null);
  // Only a first load that failed replaces the page; a later refresh that fails keeps the editor.
  if (!fleet.data || !list.data || !layouts.data) {
    const error = fleet.error || list.error || layouts.error;
    return error ? <Banner tone="failed">{error}</Banner> : <span className="sc-tag" aria-busy="true">Loading…</span>;
  }
  // Decided once, when everything has loaded: later reloads of the lists must not reopen the page.
  const opened = start ?? chooseStart({ search: window.location.search, draft: readDraft(user.id), layouts: layouts.data.layouts,
    buoys: fleet.data.buoys.map((b) => b.buoy_id), now });
  if (!start) setStart(opened);
  return (
    <ReportBuilder buoys={fleet.data.buoys} columns={list.data.columns} canDownload={canDownload} canEdit={canDownload} now={now}
      start={opened} userId={user.id} layouts={layouts.data.layouts} onLayoutsChanged={layouts.reload} isAdmin={can(user.role, "reports.default")}
      onCreated={(link) => { list.reload(); window.location.assign(link); }}
      recent={<RecentReports reports={list.data.reports} canDownload={canDownload} now={now} />} />
  );
}

"use client";

import { useState, type ReactNode } from "react";
import { Dialog } from "@/components/overlays/dialog";
import { useToast } from "@/components/feedback/toaster";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import type { ReportDocument } from "@/lib/report/document";
import type { SavedLayout } from "@/lib/report/saved";
import { BUILT_IN_TEMPLATES, builtInDocument, fromTemplate } from "@/lib/report/templates";
import type { ReportVariables } from "@/lib/report/variables";

interface TemplatesTabProps {
  layouts: SavedLayout[];
  variables: ReportVariables;
  canEdit: boolean;
  isAdmin: boolean;
  /** True when the current report has changes that replacing it would lose. */
  dirty: boolean;
  onOpen: (doc: ReportDocument, reportId: string | null) => void;
  onLayoutsChanged: () => void;
}

interface Choice { label: string; doc: ReportDocument; reportId: string | null }

function Row({ name, detail, children }: { name: string; detail: string; children: ReactNode }) {
  return (
    <div className="sc-lib__item sc-lib__item--pick">
      <span className="sc-lib__text"><strong>{name}</strong><span className="sc-lib__desc">{detail}</span></span>
      <span className="sc-row sc-rb-row-keys">{children}</span>
    </div>
  );
}

const owner = (l: SavedLayout) => `${l.shared ? "Team" : "Only you"}${l.author ? ` · ${l.author}` : ""}${l.is_default ? " · default for new reports" : ""}`;

/** Saved reports to open, then templates to start from: the five built-ins, then the team's and your own. */
export function TemplatesTab({ layouts, variables, canEdit, isAdmin, dirty, onOpen, onLayoutsChanged }: TemplatesTabProps) {
  const { show } = useToast();
  const [pending, setPending] = useState<Choice | null>(null);
  const choose = (choice: Choice) => (dirty ? setPending(choice) : onOpen(choice.doc, choice.reportId));
  const reports = layouts.filter((l) => l.kind === "report");
  const templates = layouts.filter((l) => l.kind === "template");
  const act = async (work: () => Promise<unknown>, done: string) => {
    try {
      await work();
      onLayoutsChanged();
      show({ tone: "ok", title: done });
    } catch (failure) {
      show({ tone: "failed", title: "That did not work", detail: failure instanceof Error ? failure.message : undefined });
    }
  };

  return (
    <div className="sc-rb-templates">
      <h3 className="sc-label">Saved reports</h3>
      {reports.length === 0 && <p className="sc-help">None yet. Save this one from the toolbar.</p>}
      {reports.map((l) => (
        <Row key={l.id} name={l.name} detail={owner(l)}>
          <Key size="sm" onClick={() => choose({ label: l.name, doc: l.doc, reportId: l.id })}>Open</Key>
          {canEdit && <Key size="sm" iconOnly icon="trash" aria-label={`Delete ${l.name}`} onClick={() => act(() => api.deleteReportLayout(l.id), `Deleted “${l.name}”`)} />}
        </Row>
      ))}
      <h3 className="sc-label">Templates</h3>
      {BUILT_IN_TEMPLATES.map((t) => (
        <Row key={t.id} name={t.name} detail={t.description}>
          <Key size="sm" onClick={() => choose({ label: t.name, doc: builtInDocument(t, variables), reportId: null })}>Use</Key>
        </Row>
      ))}
      {templates.map((l) => (
        <Row key={l.id} name={l.name} detail={owner(l)}>
          <Key size="sm" onClick={() => choose({ label: l.name, doc: fromTemplate(l.doc, variables), reportId: null })}>Use</Key>
          {isAdmin && l.shared && (
            <Key size="sm" aria-pressed={l.is_default} onClick={() => act(() => api.setDefaultTemplate(l.id, !l.is_default),
              l.is_default ? "No default template now" : `“${l.name}” starts new reports`)}>{l.is_default ? "Default" : "Make default"}</Key>
          )}
          {canEdit && <Key size="sm" iconOnly icon="trash" aria-label={`Delete ${l.name}`} onClick={() => act(() => api.deleteReportLayout(l.id), `Deleted “${l.name}”`)} />}
        </Row>
      ))}
      <Dialog open={pending !== null} title="Replace this report?" onClose={() => setPending(null)}
        footer={<><Key onClick={() => setPending(null)}>Keep editing</Key>
          <Key variant="primary" onClick={() => { if (pending) onOpen(pending.doc, pending.reportId); setPending(null); }}>Replace</Key></>}>
        <p>The report on the page has changes that are not saved. Opening “{pending?.label}” replaces its layout; undo brings it back.</p>
      </Dialog>
    </div>
  );
}

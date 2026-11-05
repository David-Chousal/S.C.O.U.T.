"use client";

import { useState, type FormEvent } from "react";
import { Banner } from "@/components/feedback/banner";
import { FirstContact } from "@/components/status/first-contact";
import { Dialog } from "@/components/overlays/dialog";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import { lastHeard } from "@/lib/format";

/** When the fleet last heard from one buoy, or null if never. */
function heardFrom(buoyId: number): Promise<number | null> {
  return api.fleet().then((fleet) => {
    const buoy = fleet.buoys.find((each) => each.buoy_id === buoyId);
    return buoy ? lastHeard(buoy) : null;
  });
}

interface AddBuoyDialogProps {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

type Outcome = { tone: "ok"; title: string; buoyId: number } | { tone: "failed"; title: string; detail: string } | null;

/** Add a buoy by its ID, before its first packet arrives. The result shows in the dialog: a
 * success card, or why it was refused, with the form kept so it can be corrected. */
export function AddBuoyDialog({ open, onClose, onAdded }: AddBuoyDialogProps) {
  const [id, setId] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>(null);

  function close() {
    setId("");
    setLabel("");
    setOutcome(null);
    onClose();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const name = label.trim() || `SCOUT-${id.padStart(2, "0")}`;
    try {
      await api.addBuoy(Number(id), label.trim());
      setOutcome({ tone: "ok", title: `${name} added`, buoyId: Number(id) });
      onAdded();
    } catch (failure) {
      setOutcome({ tone: "failed", title: "Not added", detail: failure instanceof Error ? failure.message : "The console did not answer." });
    } finally {
      setSaving(false);
    }
  }

  if (outcome?.tone === "ok") {
    return (
      <Dialog open={open} title="Buoy added" onClose={close} footer={<Key variant="primary" onClick={close} data-autofocus>Done</Key>}>
        <Banner tone="ok" icon="check">
          <strong>{outcome.title}.</strong> Its settings can be set now, on Settings → Buoys.
        </Banner>
        <FirstContact read={() => heardFrom(outcome.buoyId)} onHeard={onAdded}
          waiting="Power it on near a shore station; it sends a first packet straight away, and this turns green within seconds." />
      </Dialog>
    );
  }

  return (
    <Dialog open={open} title="Add a buoy" onClose={close}>
      <form className="sc-fieldset" onSubmit={onSubmit}>
        {outcome?.tone === "failed" && (
          <Banner tone="failed"><strong>{outcome.title}.</strong> {outcome.detail}</Banner>
        )}
        <div className="sc-fieldset">
          <span className="sc-fieldset__label"><label className="sc-tag" htmlFor="add-buoy-id">Buoy ID</label></span>
          <input id="add-buoy-id" className="sc-input sc-input--mono" inputMode="numeric" pattern="[0-9]{1,5}" required
            data-autofocus value={id} aria-describedby="add-buoy-id-help" onChange={(event) => setId(event.target.value)} />
          <span id="add-buoy-id-help" className="sc-help">The number set as BUOY_ID in its firmware (1–65535).</span>
        </div>
        <div className="sc-fieldset">
          <span className="sc-fieldset__label"><label className="sc-tag" htmlFor="add-buoy-name">Name</label></span>
          <input id="add-buoy-name" className="sc-input" maxLength={40}
            placeholder={id ? `SCOUT-${id.padStart(2, "0")}` : "e.g. Reef north"}
            value={label} onChange={(event) => setLabel(event.target.value)} />
        </div>
        <Key type="submit" variant="primary" icon="plus" disabled={saving || !id}>{saving ? "Adding…" : "Add buoy"}</Key>
      </form>
    </Dialog>
  );
}

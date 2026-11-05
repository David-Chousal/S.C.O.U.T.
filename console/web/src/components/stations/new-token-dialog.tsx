"use client";

import { useState, type FormEvent } from "react";
import { Banner } from "@/components/feedback/banner";
import { Dialog } from "@/components/overlays/dialog";
import { FirstContact } from "@/components/status/first-contact";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";

interface Created {
  id: string;
  name: string;
  token: string;
}

interface NewTokenDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

/** When one shore station was last heard, or null if never. */
function stationHeard(id: string): Promise<number | null> {
  return api.devices().then((list) => list.devices.find((device) => device.id === id)?.last_seen_at ?? null);
}

/** Make a shore station's token: name it, copy the token (shown once), then watch it check in. */
export function NewTokenDialog({ open, onClose, onCreated }: NewTokenDialogProps) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<Created | null>(null);

  function close() {
    setName("");
    setError("");
    setCreated(null);
    onClose();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      setCreated(await api.createDevice(name.trim()));
      setError("");
      onCreated();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The console did not answer.");
    } finally {
      setSaving(false);
    }
  }

  if (created) {
    return (
      <Dialog open={open} title={`Token for ${created.name}`} onClose={close}
        footer={<Key variant="primary" onClick={close} data-autofocus>Done</Key>}>
        <Banner tone="info" icon="lock"><strong>Copy it now</strong>: it is shown only once.
          <code className="sc-secret">{created.token}</code></Banner>
        <FirstContact key={created.id} read={() => stationHeard(created.id)} onHeard={onCreated}
          waiting={<>Flash the station with this token and power it on; it checks in as soon as it joins WiFi.</>} />
      </Dialog>
    );
  }

  return (
    <Dialog open={open} title="New shore station token" onClose={close}>
      <form className="sc-fieldset" onSubmit={onSubmit}>
        {error && <Banner tone="failed"><strong>Not created.</strong> {error}</Banner>}
        <div className="sc-fieldset">
          <span className="sc-fieldset__label"><label className="sc-tag" htmlFor="new-token-name">Shore station name</label></span>
          <input id="new-token-name" className="sc-input" maxLength={60} required data-autofocus placeholder="e.g. Kaneohe shore"
            value={name} onChange={(event) => setName(event.target.value)} />
          <span className="sc-help">The station sends it as SCOUT_CONSOLE_TOKEN to push readings and read settings. The buoys&rsquo;
            radio keys stay on the station and never come here.</span>
        </div>
        <Key type="submit" variant="primary" icon="plus" disabled={saving || !name.trim()}>{saving ? "Creating…" : "Create token"}</Key>
      </form>
    </Dialog>
  );
}

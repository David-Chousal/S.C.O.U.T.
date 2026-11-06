"use client";

import Link from "next/link";
import { useState } from "react";
import { Banner } from "@/components/feedback/banner";
import { Dialog } from "@/components/overlays/dialog";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import type { Buoy } from "@/lib/api/types";

interface BuoyDialogProps {
  buoy: Buoy | null;
  onClose: () => void;
  onDone: () => void;
}

/** Disconnect a buoy: confirm first, then say how to reconnect it. */
export function DisconnectDialog({ buoy, onClose, onDone }: BuoyDialogProps) {
  const [done, setDone] = useState<Buoy | null>(null);
  const [error, setError] = useState("");
  const shown = done ?? buoy;

  async function disconnect() {
    if (!buoy) return;
    try {
      await api.disconnectBuoy(buoy.buoy_id);
      setError("");
      setDone(buoy);
      onDone();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Not disconnected.");
    }
  }

  function close() {
    setDone(null);
    setError("");
    onClose();
  }

  if (!shown) return null;
  return (
    <Dialog open title={done ? `${shown.label} is disconnected` : `Disconnect ${shown.label}?`} onClose={close}
      footer={done
        ? <Key variant="primary" onClick={close} data-autofocus>Done</Key>
        : <><Key onClick={close}>Cancel</Key><Key variant="primary" onClick={disconnect}>Disconnect</Key></>}>
      {done ? (
        <div className="sc-dialog__body">
          <p className="sc-help">The console no longer stores its packets or sends it settings. Its past readings stay.</p>
          <p className="sc-help"><strong>To reconnect it</strong>, choose <strong>Add buoy</strong> on Fleet and enter ID {shown.buoy_id}. Its readings are stored again from its next packet.</p>
          <Link className="sc-link" href="/help/#buoy" onClick={close}>How to add a buoy</Link>
        </div>
      ) : (
        <div className="sc-dialog__body">
          <p className="sc-help">
            The console stops storing its packets and no shore station sends it settings. The buoy itself keeps running: the
            console cannot reach its radio. Past readings stay, and you can reconnect it later.
          </p>
          {error && <Banner tone="failed">{error}</Banner>}
        </div>
      )}
    </Dialog>
  );
}

/** Delete a disconnected buoy from the console, with its settings and readings. */
export function DeleteBuoyDialog({ buoy, onClose, onDone }: BuoyDialogProps) {
  const [error, setError] = useState("");

  async function remove() {
    if (!buoy) return;
    try {
      await api.deleteBuoy(buoy.buoy_id);
      setError("");
      onDone();
      onClose();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Not deleted.");
    }
  }

  if (!buoy) return null;
  return (
    <Dialog open title={`Delete ${buoy.label}?`} onClose={onClose}
      footer={<><Key onClick={onClose}>Cancel</Key><Key variant="primary" onClick={remove}>Delete</Key></>}>
      <div className="sc-dialog__body">
        <p className="sc-help">
          It goes from the console with its requested settings and all its readings. The nightly backup keeps a copy for 35 days.
          If the buoy is still transmitting, it appears again the next time a shore station hears it.
        </p>
        {error && <Banner tone="failed">{error}</Banner>}
      </div>
    </Dialog>
  );
}

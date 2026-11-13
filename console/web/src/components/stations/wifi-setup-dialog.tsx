"use client";

import { useState } from "react";
import { Banner } from "@/components/feedback/banner";
import { Dialog } from "@/components/overlays/dialog";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import type { Device } from "@/lib/api/types";

interface WifiSetupDialogProps {
  device: Device | null;
  onClose: () => void;
  onDone: () => void;
}

/** A request stays live this long on the worker (device.js); the station acts on it within a minute. */
export const WIFI_SETUP_LIVE_MS = 15 * 60 * 1000;

/** Whether a Change WiFi request is still waiting for, or being acted on by, the station. */
export function wifiSetupPending(device: Device, now: number): boolean {
  return device.wifi_setup_requested_at !== null && now - device.wifi_setup_requested_at < WIFI_SETUP_LIVE_MS;
}

/** Change WiFi: ask an online station to open its SCOUT-Setup network, then say what to do on a phone. */
export function WifiSetupDialog({ device, onClose, onDone }: WifiSetupDialogProps) {
  const [sent, setSent] = useState<Device | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const shown = sent ?? device;

  async function send() {
    if (!device) return;
    setBusy(true);
    try {
      await api.requestWifiSetup(device.id);
      setError("");
      setSent(device);
      onDone();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Not sent.");
    } finally {
      setBusy(false);
    }
  }

  function close() {
    setSent(null);
    setError("");
    onClose();
  }

  if (!shown) return null;
  return (
    <Dialog open title={sent ? "Setup network on its way" : `Change ${shown.name}'s WiFi?`} onClose={close}
      footer={sent
        ? <Key variant="primary" onClick={close} data-autofocus>Done</Key>
        : <><Key onClick={close}>Cancel</Key><Key variant="primary" onClick={send} disabled={busy}>{busy ? "Sending…" : "Open setup network"}</Key></>}>
      {sent ? (
        <div className="sc-dialog__body">
          <p className="sc-help">Within a minute, <strong>{shown.name}</strong> opens a WiFi network named <strong>SCOUT-Setup-XXXX</strong>
            (four letters and digits at the end) for 10 minutes. It stays online on its current network meanwhile.</p>
          <p className="sc-help"><strong>On a phone near the station:</strong> join that network in WiFi settings, pick the new network on the
            page that opens, and save. Leave the token blank to keep the current one.</p>
        </div>
      ) : (
        <div className="sc-dialog__body">
          <p className="sc-help">The station keeps its current WiFi and opens its setup network for 10 minutes, so someone within WiFi range
            of it can move it to another network from a phone. Nothing changes unless they save a new network there.</p>
          <p className="sc-help">The setup network is open, with no password, while it is up.</p>
          {error && <Banner tone="failed">{error}</Banner>}
        </div>
      )}
    </Dialog>
  );
}

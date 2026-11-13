"use client";

import Link from "next/link";
import { useState } from "react";
import { Banner } from "@/components/feedback/banner";
import { Dialog } from "@/components/overlays/dialog";
import { Ago } from "@/components/ui/ago";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import type { Buoy, Device } from "@/lib/api/types";
import { useWhen } from "@/lib/preferences-context";

interface StationDialogProps {
  device: Device | null;
  onClose: () => void;
  onDone: () => void;
}

/** Revoke a station's token: confirm first, then say how to bring the station back. */
export function RevokeDialog({ device, onClose, onDone }: StationDialogProps) {
  const [done, setDone] = useState<Device | null>(null);
  const [error, setError] = useState("");
  const shown = done ?? device;

  async function revoke() {
    if (!device) return;
    try {
      await api.revokeDevice(device.id);
      setError("");
      setDone(device);
      onDone();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Not revoked.");
    }
  }

  function close() {
    setDone(null);
    setError("");
    onClose();
  }

  if (!shown) return null;
  return (
    <Dialog open title={done ? `${shown.name} is revoked` : `Revoke ${shown.name}?`} onClose={close}
      footer={done
        ? <Key variant="primary" onClick={close} data-autofocus>Done</Key>
        : <><Key onClick={close}>Cancel</Key><Key variant="primary" onClick={revoke}>Revoke</Key></>}>
      {done ? (
        <div className="sc-dialog__body">
          <p className="sc-help">Its token no longer works: it cannot push readings or fetch settings. Buoys it commanded need another station.</p>
          <p className="sc-help"><strong>To bring it back</strong>, make a new token with <strong>New token</strong> here. Then hold the
            station&rsquo;s <strong>BOOT</strong> button for 3 seconds, join its <strong>SCOUT-Setup</strong> network from a phone, and paste the
            token there.</p>
          <Link className="sc-link" href="/help/#shore" onClick={close}>How to connect a shore station</Link>
        </div>
      ) : (
        <div className="sc-dialog__body">
          <p className="sc-help">
            The station stops pushing readings and fetching settings at once, and any buoys it commands lose their route. The
            station itself keeps running until it is given a new token.
          </p>
          {error && <Banner tone="failed">{error}</Banner>}
        </div>
      )}
    </Dialog>
  );
}

/** Delete a revoked station's token from the list for good. */
export function DeleteStationDialog({ device, onClose, onDone }: StationDialogProps) {
  const [error, setError] = useState("");
  async function remove() {
    if (!device) return;
    try {
      await api.deleteDevice(device.id);
      setError("");
      onDone();
      onClose();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Not deleted.");
    }
  }
  if (!device) return null;
  return (
    <Dialog open title={`Delete ${device.name}?`} onClose={onClose}
      footer={<><Key onClick={onClose}>Cancel</Key><Key variant="primary" onClick={remove}>Delete</Key></>}>
      <div className="sc-dialog__body">
        <p className="sc-help">Its revoked token goes from this list. The readings it pushed stay, and the audit log keeps the record.</p>
        {error && <Banner tone="failed">{error}</Banner>}
      </div>
    </Dialog>
  );
}

interface StationInfoProps {
  device: Device | null;
  /** The buoys whose settings it sends now. */
  commands: Buoy[];
  /** It is the only active station, so it sends every buoy's settings. */
  onlyStation: boolean;
  onClose: () => void;
}

/** What the console knows about one station. */
export function StationInfoDialog({ device, commands, onlyStation, onClose }: StationInfoProps) {
  const when = useWhen();
  if (!device) return null;
  const rows: [string, React.ReactNode][] = [
    ["Token", device.revoked_at ? <>Revoked {when(device.revoked_at)}</> : "Active"],
    ["Made", when(device.created_at)],
    ["Last checked in", device.last_seen_at ? <Ago ms={device.last_seen_at} /> : "Never"],
    ["Sends settings to", device.revoked_at ? "No buoys (revoked)"
      : commands.length ? commands.map((b) => b.label).join(", ") + (onlyStation ? " (the only active station, so every buoy)" : "")
        : "No buoys"],
    ["How it connects", "Pushes each reading over WiFi with its token, and asks for settings changes every minute. Its WiFi is set from a phone on its SCOUT-Setup network."],
  ];
  return (
    <Dialog open title={device.name} onClose={onClose} footer={<Key variant="primary" onClick={onClose} data-autofocus>Done</Key>}>
      <dl className="sc-info">
        {rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
      <Link className="sc-link" href="/help/#shore" onClick={onClose}>How shore stations work</Link>
    </Dialog>
  );
}

"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Ago } from "@/components/ui/ago";
import { Icon } from "@/components/ui/icon";
import { usePoll } from "@/lib/use-poll";

interface FirstContactProps {
  /** When the device was last heard, or null if never. */
  read: () => Promise<number | null>;
  /** What to do while waiting, e.g. "Power it on near a shore station." */
  waiting: ReactNode;
  onHeard?: (heardAt: number) => void;
  intervalMs?: number;
}

/** A live check after adding a buoy or a shore station: asks the console every few seconds and
 * turns green the moment the device is first heard, so nobody has to wait and reload. */
export function FirstContact({ read, waiting, onHeard, intervalMs = 4000 }: FirstContactProps) {
  const [heardAt, setHeardAt] = useState<number | null>(null);
  const [unreachable, setUnreachable] = useState(false);

  const check = useCallback(() => {
    read().then(
      (value) => {
        setUnreachable(false);
        if (value === null) return;
        setHeardAt(value);
        onHeard?.(value);
      },
      () => setUnreachable(true),
    );
    // `read` and `onHeard` are rebuilt by the parent on every render; checking on their identity would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(check, [check]);
  usePoll(check, intervalMs, heardAt === null);

  if (heardAt !== null) {
    return (
      <div className="sc-contact sc-contact--ok" role="status">
        <Icon name="check" />
        <span><strong>Connected</strong> · first heard <Ago ms={heardAt} /></span>
      </div>
    );
  }
  return (
    <div className="sc-contact" role="status" aria-live="polite">
      <span className="sc-contact__pulse" aria-hidden="true" />
      <span>
        <strong>Listening for first contact…</strong> {waiting}
        {unreachable && <span className="sc-contact__note"> The console did not answer the last check; still trying.</span>}
      </span>
    </div>
  );
}

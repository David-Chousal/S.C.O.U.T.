"use client";

import { Dialog } from "@/components/overlays/dialog";
import { Key } from "@/components/ui/key";
import type { Estimates } from "@/lib/api/types";
import { lifeFor, months } from "@/lib/format";

interface TransmitConfirmProps {
  open: boolean;
  buoyLabel: string;
  from: number;
  to: number;
  sendTimes: string;
  estimates: Estimates;
  onCancel: () => void;
  onConfirm: () => void;
}

/** "Are you sure" before a transmit count changes: when it will send, and what the change does to
 * battery life on one and two D cells (estimates, listen window included). */
export function TransmitConfirm({ open, buoyLabel, from, to, sendTimes, estimates, onCancel, onConfirm }: TransmitConfirmProps) {
  const rows = [
    { label: `Now · ${from} a day`, count: from },
    { label: `After · ${to} a day`, count: to },
  ];
  return (
    <Dialog open={open} title={`Change ${buoyLabel} to ${to} a day?`} onClose={onCancel}
      footer={<>
        <Key onClick={onCancel}>Cancel</Key>
        <Key variant="primary" onClick={onConfirm} data-autofocus>Change to {to} a day</Key>
      </>}>
      <p className="sc-help">It would send at {sendTimes}. Fewer transmits mean older data between packets; they barely change
        battery life, because the radio is under half a percent of the daily draw.</p>
      <div className="sc-table-wrap">
        <table className="sc-table sc-life-table">
          <caption className="sc-tag sc-caption">Battery life, estimate</caption>
          <thead>
            <tr><th scope="col"><span className="sc-visually-hidden">Count</span></th>
              <th scope="col" className="n">2 D cells</th><th scope="col" className="n">1 D cell</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const two = lifeFor(estimates, row.count, 2, true);
              const one = lifeFor(estimates, row.count, 1, true);
              return (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td className="n">{months(two.best)}<span className="sub">{months(two.pessimistic)} worst case</span></td>
                  <td className="n">{months(one.best)}<span className="sub">{months(one.pessimistic)} worst case</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="sc-help">From the power budget&rsquo;s datasheet figures, including the 1 s listen window after each send. Not a
        measurement.</p>
    </Dialog>
  );
}

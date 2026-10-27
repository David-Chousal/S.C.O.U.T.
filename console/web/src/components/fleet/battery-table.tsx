import type { Estimates } from "@/lib/api/types";
import { lifeFor } from "@/lib/format";

/** Every option, both cell counts, best and pessimistic, with and without the listen window. */
export function BatteryTable({ estimates, listenWindow }: { estimates: Estimates; listenWindow: boolean }) {
  const cell = (days: number | undefined, mo: number | undefined) =>
    days === undefined ? "—" : `${days.toLocaleString("en-US")} d · ${mo?.toFixed(1)} mo`;
  return (
    <div className="sc-table-wrap">
      <table className="sc-table">
        <caption className="sc-tag sc-caption">{listenWindow ? "With" : "Without"} the 1 s listen window after each send</caption>
        <thead>
          <tr>
            <th scope="col">Transmits</th>
            <th scope="col" className="n">Best · 1 cell</th>
            <th scope="col" className="n">Best · 2 cells</th>
            <th scope="col" className="n">Pessimistic · 1 cell</th>
            <th scope="col" className="n">Pessimistic · 2 cells</th>
          </tr>
        </thead>
        <tbody>
          {estimates.allowed_tx_counts.map((n) => {
            const one = lifeFor(estimates, n, 1, listenWindow);
            const two = lifeFor(estimates, n, 2, listenWindow);
            return (
              <tr key={n}>
                <th scope="row">{n} a day</th>
                {[one.best, two.best, one.pessimistic, two.pessimistic].map((row, i) => (
                  <td key={i} className="n">{cell(row?.days, row?.months)}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

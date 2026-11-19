import { VARIABLES, variableLabel } from "@/lib/variables";

interface VariablesPanelProps { columns: string[]; chosen: string[]; onChange: (variables: string[]) => void }

/** Tick the variables a block shows; kept in the Worker's column order. */
export function VariablesPanel({ columns, chosen, onChange }: VariablesPanelProps) {
  const toggle = (c: string) => onChange(columns.filter((x) => (x === c ? !chosen.includes(c) : chosen.includes(x))));
  return (
    <fieldset className="sc-settings-choices">
      <legend className="sc-label">Variables</legend>
      {columns.map((c) => (
        <label key={c} className="sc-row">
          <input type="checkbox" checked={chosen.includes(c)} onChange={() => toggle(c)} />
          {variableLabel(c)}{VARIABLES[c]?.unit ? ` (${VARIABLES[c].unit})` : ""}
        </label>
      ))}
    </fieldset>
  );
}

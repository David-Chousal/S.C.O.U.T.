/** A row of mutually exclusive keys (aria-pressed), for small choices such as the theme. Each one is an
 * ordinary .sc-key, so it looks and moves like every other button; the chosen one stays pressed in. */
export function Segmented<T extends string>({ label, options, value, onChange }: {
  label: string; options: readonly { value: T; label: string }[]; value: T; onChange: (value: T) => void;
}) {
  return (
    <div className="sc-seg" role="group" aria-label={label}>
      {options.map((option) => (
        <button key={option.value} type="button" className="sc-key" aria-pressed={value === option.value} onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

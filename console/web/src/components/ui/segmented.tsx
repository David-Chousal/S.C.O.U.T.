/** A row of mutually exclusive keys (aria-pressed), for small choices such as the theme. The keys
 * are joined into one group and sized like .sc-key (size "sm" matches Key size="sm"); the chosen one
 * stays pressed in. */
export function Segmented<T extends string>({ label, options, value, onChange, size }: {
  label: string; options: readonly { value: T; label: string }[]; value: T; onChange: (value: T) => void; size?: "sm";
}) {
  return (
    <div className={size === "sm" ? "sc-seg sc-seg--sm" : "sc-seg"} role="group" aria-label={label}>
      {options.map((option) => (
        <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

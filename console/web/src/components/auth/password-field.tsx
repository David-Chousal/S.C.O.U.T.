"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";

interface PasswordFieldProps {
  label: string;
  autoComplete: "current-password" | "new-password";
  value: string;
  onChange: (value: string) => void;
  minLength?: number;
}

/** COR's password field: a show/hide toggle that says what it does. */
export function PasswordField({ label, autoComplete, value, onChange, minLength }: PasswordFieldProps) {
  const [shown, setShown] = useState(false);
  return (
    <label className="sc-fieldset">
      <span className="sc-fieldset__label"><span className="sc-tag">{label}</span></span>
      <span className="sc-input-wrap">
        <input className="sc-input sc-input--plain" name="password" type={shown ? "text" : "password"} autoComplete={autoComplete}
          required minLength={minLength} value={value} onChange={(event) => onChange(event.target.value)} />
        <button className="sc-input-wrap__end sc-input-wrap__toggle" type="button" aria-label={shown ? "Hide password" : "Show password"}
          aria-pressed={shown} onClick={() => setShown((s) => !s)}>
          <Icon name="eye" />
        </button>
      </span>
    </label>
  );
}

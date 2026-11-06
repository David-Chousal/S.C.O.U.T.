"use client";

import { useState, type FormEvent } from "react";
import { useToast } from "@/components/feedback/toaster";
import { Dialog } from "@/components/overlays/dialog";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import type { LinkIssued, Role } from "@/lib/api/types";
import { DeliveryNote } from "./delivery-note";

const ROLES: { value: Role; label: string; detail: string }[] = [
  { value: "guest", label: "Guest", detail: "Sees every page and setting; changes nothing." },
  { value: "member", label: "Member", detail: "Also changes buoy settings, such as the transmit count." },
  { value: "admin", label: "Admin", detail: "Also invites people, sets roles and manages shore stations." },
];

interface InviteDialogProps {
  open: boolean;
  onClose: () => void;
  onInvited: () => void;
}

/** Invite one person by email. The console emails the link when it can; either way the
 * single-use link is shown once, here, and never again. */
export function InviteDialog({ open, onClose, onInvited }: InviteDialogProps) {
  const { show } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [issued, setIssued] = useState<LinkIssued | null>(null);
  const [error, setError] = useState("");

  function close() {
    setEmail("");
    setRole("member");
    setIssued(null);
    setError("");
    onClose();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const result = await api.createInvite(email.trim(), role);
      setIssued(result);
      setError("");
      show({ tone: "ok", title: result.delivery === "sent" ? `Invite emailed to ${result.email}` : `Invite created for ${result.email}` });
      onInvited();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The invite was not created.");
    }
  }

  return (
    <Dialog open={open} title={issued ? (issued.delivery === "sent" ? "Invite sent" : "Send this link") : "Invite someone"} onClose={close}
      footer={issued ? <Key variant="primary" onClick={close}>Done</Key> : undefined}>
      {issued ? (
        <div className="sc-fieldset">
          <DeliveryNote delivery={issued.delivery} email={issued.email} />
          <span className="sc-help">The link works once, for 7 days, and is not shown again.</span>
          <code className="sc-secret">{issued.link}</code>
        </div>
      ) : (
        <form className="sc-fieldset" onSubmit={onSubmit}>
          <label className="sc-fieldset">
            <span className="sc-fieldset__label"><span className="sc-tag">Email</span></span>
            <input className="sc-input" type="email" required data-autofocus value={email}
              aria-invalid={error ? true : undefined} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <fieldset className="sc-invite-roles">
            <legend className="sc-tag">Role</legend>
            {ROLES.map((option) => (
              <label key={option.value} className="sc-tx-option sc-tip-host">
                <input type="radio" name="invite-role" value={option.value} checked={role === option.value}
                  aria-describedby={`invite-role-${option.value}-help`} onChange={() => setRole(option.value)} />
                <strong>{option.label}</strong>
                <span id={`invite-role-${option.value}-help`} className="sc-tip sc-tip--hover">{option.detail}</span>
              </label>
            ))}
          </fieldset>
          {error && <span className="sc-help sc-help--error" role="alert">{error}</span>}
          <Key type="submit" variant="primary">Create invite link</Key>
        </form>
      )}
    </Dialog>
  );
}

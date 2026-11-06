"use client";

import { useState } from "react";
import { Banner } from "@/components/feedback/banner";
import { useToast } from "@/components/feedback/toaster";
import { ActionMenu, type ActionMenuItem } from "@/components/overlays/action-menu";
import { Dialog } from "@/components/overlays/dialog";
import { initials } from "@/components/shell/account-menu";
import { HoldKey } from "@/components/ui/hold-key";
import { Key } from "@/components/ui/key";
import { Select, type SelectOption } from "@/components/ui/select";
import { api } from "@/lib/api/client";
import type { LinkIssued, Member, Role, Team } from "@/lib/api/types";
import { plural } from "@/lib/format";
import { can, ROLE_LABEL, useSession } from "@/lib/session";
import { useWhen } from "@/lib/preferences-context";
import { useApi } from "@/lib/use-api";
import { useViewOnlyNote } from "@/lib/view-only-note";
import { DeliveryNote } from "./delivery-note";
import { InviteDialog } from "./invite-dialog";

const ROLE_OPTIONS: SelectOption<Role>[] = [
  { value: "guest", label: "Guest" }, { value: "member", label: "Member" }, { value: "admin", label: "Admin" },
];

/** The Team page: people, roles, reset links, offboarding, and open invites. Admins change it;
 * everyone else sees all of it, controls disabled. */
export function TeamBoard() {
  const when = useWhen();
  const { user } = useSession();
  const { show } = useToast();
  const { data, error, reload } = useApi<Team>(api.team);
  const [inviting, setInviting] = useState(false);
  const [resetLink, setResetLink] = useState<LinkIssued | null>(null);
  const [removing, setRemoving] = useState<Member | null>(null);
  const canManage = can(user.role, "invites.write");
  useViewOnlyNote(canManage ? null : "View only: inviting people, changing roles and disabling accounts needs the admin role.");

  async function run(action: () => Promise<unknown>, ok: string) {
    try {
      await action();
      show({ tone: "ok", title: ok });
      reload();
    } catch (failure) {
      show({ tone: "failed", title: "Not changed", detail: failure instanceof Error ? failure.message : undefined });
    }
  }

  async function makeResetLink(member: Member) {
    try {
      setResetLink(await api.resetLink(member.id));
    } catch (failure) {
      show({ tone: "failed", title: "No reset link", detail: failure instanceof Error ? failure.message : undefined });
    }
  }

  /** A row's ⋯ menu: a reset link, and Remove. Removed people leave the list (the audit log keeps them). */
  function actionsFor(member: Member): ActionMenuItem[] {
    const items: ActionMenuItem[] = [];
    if (!member.self_signup) items.push({ label: "Reset link", icon: "lock", onSelect: () => makeResetLink(member) });
    if (member.id !== user.id) {
      items.push({ label: "Remove", icon: "trash", danger: true, onSelect: () => setRemoving(member) });
    }
    return items;
  }

  function confirmRemove() {
    if (!removing) return;
    const member = removing;
    setRemoving(null);
    void run(() => api.setDisabled(member.id, true), `Removed ${member.email}; their sessions ended`);
  }

  if (error) return <Banner tone="failed">{error}</Banner>;
  if (!data) return <span className="sc-tag" aria-busy="true">Loading the team…</span>;
  const admins = data.members.filter((m) => m.role === "admin" && !m.disabled).length;

  return (
    <>
      {resetLink && (
        <Banner tone="info" icon="lock" action={<Key size="sm" onClick={() => setResetLink(null)}>Done</Key>}>
          <strong>Password reset link for {resetLink.email}</strong>: it works once, for 24 hours, and is not shown again.{" "}
          <DeliveryNote delivery={resetLink.delivery} email={resetLink.email} />
          <code className="sc-secret">{resetLink.link}</code>
        </Banner>
      )}
      <section className="sc-bay" aria-labelledby="members-title">
        <div className="sc-bay__head">
          <h2 className="sc-bay__title" id="members-title">People</h2>
          <span className="sc-row">
            <span className="sc-tag">{plural(data.members.length, "person", "people")} · {plural(admins, "admin")}</span>
            <Key size="sm" variant="primary" icon="plus" disabled={!canManage} onClick={() => setInviting(true)}>Invite</Key>
          </span>
        </div>
        <div className="sc-table-wrap">
          <table className="sc-table sc-team-table">
            <colgroup><col /><col className="sc-team-table__role" /><col className="sc-team-table__actions" /></colgroup>
            <thead><tr><th scope="col">Person</th><th scope="col">Role</th><th scope="col"><span className="sc-visually-hidden">Actions</span></th></tr></thead>
            <tbody>
              {data.members.map((member) => {
                const you = member.id === user.id;
                return (
                  <tr key={member.id}>
                    <td>
                      <span className="sc-person">
                        <span className="sc-avatar" aria-hidden="true">{initials(member)}</span>
                        <span className="sc-list__main">
                          <strong>{member.name || member.email} {you && <span className="sc-tag">You</span>} {member.self_signup ? <span className="sc-badge sc-badge--muted">Self-signed-up</span> : null}</strong>
                          <span>{member.email}</span>
                        </span>
                      </span>
                    </td>
                    <td>
                      <Select className="sc-team-table__select" aria-label={`Role for ${member.email}`} value={member.role} options={ROLE_OPTIONS}
                        disabled={!canManage || Boolean(member.self_signup)}
                        title={member.self_signup ? "Signed in with just an email, so anyone could use it. Invite them to give them a role." : undefined}
                        onChange={(role) => run(() => api.setRole(member.id, role), `${member.email} is now ${ROLE_LABEL[role]}`)} />
                    </td>
                    <td className="n sc-team-table__menu">
                      <ActionMenu label={`Actions for ${member.name || member.email}`} items={actionsFor(member)} disabled={!canManage} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="sc-bay" aria-labelledby="invites-title">
        <div className="sc-bay__head">
          <h2 className="sc-bay__title" id="invites-title">Open invites</h2>
          <span className="sc-tag">{plural(data.invites.length, "invite")} · links expire after 7 days</span>
        </div>
        {data.invites.length === 0 ? <p className="sc-help">No open invites.</p> : (
          <div className="sc-list">
            {data.invites.map((invite) => (
              <div key={invite.id} className="sc-list__row">
                <span className="sc-list__main"><strong>{invite.email}</strong><span>{ROLE_LABEL[invite.role]} · expires {when(invite.expires_at)}</span></span>
                <span className="sc-list__end">
                  <HoldKey size="sm" label="Hold to revoke" holdLabel={`Hold to revoke the invite for ${invite.email}`} disabled={!canManage}
                    onConfirm={() => run(() => api.revokeInvite(invite.id), `Revoked the invite for ${invite.email}`)} />
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
      <InviteDialog open={inviting} onClose={() => setInviting(false)} onInvited={reload} />
      <Dialog open={removing !== null} title={`Remove ${removing?.name || removing?.email || ""}?`} onClose={() => setRemoving(null)}
        footer={<>
          <Key onClick={() => setRemoving(null)}>Cancel</Key>
          <Key variant="primary" onClick={confirmRemove} data-autofocus>Remove</Key>
        </>}>
        <p className="sc-help">
          They leave the People list, are signed out everywhere and can no longer sign in. What they changed stays in the audit
          log, which records the removal. To bring them back, invite their email again.
        </p>
      </Dialog>
    </>
  );
}

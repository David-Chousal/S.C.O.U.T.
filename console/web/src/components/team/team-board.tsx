"use client";

import { useState } from "react";
import { Banner } from "@/components/feedback/banner";
import { useToast } from "@/components/feedback/toaster";
import { initials } from "@/components/shell/sidebar";
import { HoldKey } from "@/components/ui/hold-key";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import type { Member, Role, Team } from "@/lib/api/types";
import { plural } from "@/lib/format";
import { can, ROLE_LABEL, useSession } from "@/lib/session";
import { useWhen } from "@/lib/preferences-context";
import { useApi } from "@/lib/use-api";
import { InviteDialog } from "./invite-dialog";

function signsInWith(member: Member): string {
  return [member.has_password && "password", member.has_github && "GitHub", member.has_google && "Google"].filter(Boolean).join(" · ") || "—";
}

/** The Team page: people, roles, reset links, offboarding, and open invites. Admins change it;
 * everyone else sees all of it, controls disabled. */
export function TeamBoard() {
  const when = useWhen();
  const { user } = useSession();
  const { show } = useToast();
  const { data, error, reload } = useApi<Team>(api.team);
  const [inviting, setInviting] = useState(false);
  const [resetLink, setResetLink] = useState<{ email: string; link: string } | null>(null);
  const canManage = can(user.role, "invites.write");

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
      const { link } = await api.resetLink(member.id);
      setResetLink({ email: member.email, link });
    } catch (failure) {
      show({ tone: "failed", title: "No reset link", detail: failure instanceof Error ? failure.message : undefined });
    }
  }

  if (error) return <Banner tone="failed">{error}</Banner>;
  if (!data) return <span className="sc-tag" aria-busy="true">Loading the team…</span>;
  const admins = data.members.filter((m) => m.role === "admin" && !m.disabled).length;

  return (
    <>
      {!canManage && <Banner tone="info" icon="lock">View only: inviting people, changing roles and disabling accounts needs the admin role.</Banner>}
      {resetLink && (
        <Banner tone="info" icon="lock" action={<Key size="sm" onClick={() => setResetLink(null)}>Done</Key>}>
          <strong>Password reset link for {resetLink.email}</strong>: send it yourself. It works once, for 24 hours, and is not shown again.
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
            <colgroup><col /><col className="sc-team-table__role" /><col className="sc-team-table__when" /><col className="sc-team-table__actions" /></colgroup>
            <thead><tr><th scope="col">Person</th><th scope="col">Role</th><th scope="col">Signs in with</th><th scope="col"><span className="sc-visually-hidden">Actions</span></th></tr></thead>
            <tbody>
              {data.members.map((member) => {
                const you = member.id === user.id;
                return (
                  <tr key={member.id}>
                    <td>
                      <span className="sc-person">
                        <span className="sc-avatar" aria-hidden="true">{initials(member)}</span>
                        <span className="sc-list__main">
                          <strong>{member.name || member.email} {you && <span className="sc-tag">You</span>} {member.disabled ? <span className="sc-badge sc-badge--muted">Disabled</span> : null}</strong>
                          <span>{member.email}</span>
                        </span>
                      </span>
                    </td>
                    <td>
                      <select className="sc-input sc-team-table__select" aria-label={`Role for ${member.email}`} value={member.role}
                        disabled={!canManage} onChange={(event) => run(() => api.setRole(member.id, event.target.value as Role), `${member.email} is now ${ROLE_LABEL[event.target.value as Role]}`)}>
                        <option value="guest">Guest</option>
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td><span className="sc-tag">{signsInWith(member)}</span></td>
                    <td className="n">
                      <span className="sc-row sc-team-actions">
                        <Key size="sm" disabled={!canManage} onClick={() => makeResetLink(member)}>Reset link</Key>
                        {member.disabled ? (
                          <Key size="sm" disabled={!canManage} onClick={() => run(() => api.setDisabled(member.id, false), `Re-enabled ${member.email}`)}>Enable</Key>
                        ) : (
                          <HoldKey size="sm" label="Hold to disable" holdLabel={`Hold to disable ${member.email}`} disabled={!canManage || you}
                            onConfirm={() => run(() => api.setDisabled(member.id, true), `Disabled ${member.email}; their sessions ended`)} />
                        )}
                      </span>
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
    </>
  );
}

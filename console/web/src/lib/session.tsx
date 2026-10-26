"use client";

// The signed-in user for every console page, and what their role may change. `can` mirrors
// console/worker/roles.js so controls render disabled for a role that cannot use them; the Worker
// still checks every write, so this is a courtesy, never the guard.

import { createContext, useContext } from "react";
import type { Role, Session } from "./api/types";

export type Action = "settings.write" | "buoys.add" | "invites.write" | "users.role" | "users.reset" | "users.disable" | "devices.write";

const RANK: Record<Role, number> = { guest: 0, member: 1, admin: 2 };
const NEEDS: Record<Action, Role> = {
  "settings.write": "member",
  "buoys.add": "admin",
  "invites.write": "admin",
  "users.role": "admin",
  "users.reset": "admin",
  "users.disable": "admin",
  "devices.write": "admin",
};

export const ROLE_LABEL: Record<Role, string> = { admin: "Admin", member: "Member", guest: "Guest · view only" };

export function can(role: Role, action: Action): boolean {
  return RANK[role] >= RANK[NEEDS[action]];
}

/** The role an action needs, for the "view only" note. */
export function needs(action: Action): Role {
  return NEEDS[action];
}

export const SessionContext = createContext<Session | null>(null);

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession must be used inside <AppShell>.");
  return session;
}

"use client";

import { useState, type FormEvent } from "react";
import { Banner } from "@/components/feedback/banner";
import { useToast } from "@/components/feedback/toaster";
import { Ago } from "@/components/ui/ago";
import { HoldKey } from "@/components/ui/hold-key";
import { Key } from "@/components/ui/key";
import { api } from "@/lib/api/client";
import type { ApiToken, TokenList } from "@/lib/api/types";
import { useWhen } from "@/lib/preferences-context";
import { can, needs, useSession } from "@/lib/session";
import { useApi } from "@/lib/use-api";

const SCOPE_HELP: Record<string, string> = {
  "read:telemetry": "read buoys, readings and settings",
  "write:settings": "request a transmit count (members and admins only)",
};

function NewToken({ list, allowed, onCreated }: { list: TokenList; allowed: boolean; onCreated: (token: string) => void }) {
  const { show } = useToast();
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>([]);
  const [days, setDays] = useState(30);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const { token } = await api.createToken(name.trim(), scopes, days);
      setName("");
      setScopes([]);
      onCreated(token);
    } catch (failure) {
      show({ tone: "failed", title: "Not created", detail: failure instanceof Error ? failure.message : undefined });
    }
  }

  const toggle = (scope: string) => setScopes((now) => (now.includes(scope) ? now.filter((s) => s !== scope) : [...now, scope]));
  return (
    <form className="sc-token-form" onSubmit={onSubmit}>
      <label className="sc-fieldset">
        <span className="sc-fieldset__label"><span className="sc-tag">Token name</span></span>
        <input className="sc-input" maxLength={60} required placeholder="e.g. analysis notebook" value={name}
          disabled={!allowed} onChange={(event) => setName(event.target.value)} />
      </label>
      <label className="sc-fieldset">
        <span className="sc-fieldset__label"><span className="sc-tag">Expires after</span></span>
        <select className="sc-input" value={days} disabled={!allowed} onChange={(event) => setDays(Number(event.target.value))}>
          {list.expiryDays.map((d) => <option key={d} value={d}>{d} days</option>)}
        </select>
      </label>
      <fieldset className="sc-settings-choices sc-token-form__wide">
        <legend className="sc-label">Scopes</legend>
        {list.scopes.map((scope) => (
          <label key={scope} className="sc-row">
            <input type="checkbox" checked={scopes.includes(scope)} disabled={!allowed} onChange={() => toggle(scope)} />
            <span><span className="sc-num">{scope}</span> <span className="sc-help">{SCOPE_HELP[scope]}</span></span>
          </label>
        ))}
      </fieldset>
      <div className="sc-token-form__wide">
        <Key type="submit" icon="plus" disabled={!allowed || scopes.length === 0}>Create token</Key>
      </div>
    </form>
  );
}

function TokenRow({ token, allowed, now, onRevoked }: { token: ApiToken; allowed: boolean; now: number; onRevoked: () => void }) {
  const when = useWhen();
  const { show } = useToast();
  const expired = token.expires_at <= now;
  async function revoke() {
    try {
      await api.revokeToken(token.id);
      show({ tone: "ok", title: `Revoked ${token.name}`, detail: "Anything using it gets 401 from now on." });
      onRevoked();
    } catch (failure) {
      show({ tone: "failed", title: "Not revoked", detail: failure instanceof Error ? failure.message : undefined });
    }
  }
  return (
    <div className="sc-list__row">
      <span className="sc-list__main">
        <strong>{token.name}</strong>
        <span>{token.scopes.replaceAll(" ", " · ")} · expires {when(token.expires_at)} · last used <Ago ms={token.last_used_at} /></span>
      </span>
      <span className="sc-list__end">
        {token.revoked_at || expired
          ? <span className="sc-badge sc-badge--muted">{token.revoked_at ? "Revoked" : "Expired"}</span>
          : <HoldKey size="sm" label="Hold to revoke" holdLabel={`Hold to revoke ${token.name}`} disabled={!allowed} onConfirm={revoke} />}
      </span>
    </div>
  );
}

/** The Developer page: personal API tokens and how to call the REST API with one. */
export function DeveloperBoard() {
  const { user } = useSession();
  const list = useApi<TokenList>(api.tokens);
  const [created, setCreated] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  const allowed = can(user.role, "tokens.write");

  if (list.error) return <Banner tone="failed">{list.error}</Banner>;
  if (!list.data) return <span className="sc-tag" aria-busy="true">Loading tokens…</span>;
  return (
    <>
      {!allowed && <Banner tone="info" icon="lock">View only: making API tokens needs the {needs("tokens.write")} role.</Banner>}
      <section className="sc-bay" aria-labelledby="tokens-title">
        <div className="sc-bay__head"><h2 className="sc-bay__title" id="tokens-title">Your API tokens</h2><span className="sc-tag">Shown once · stored hashed</span></div>
        {created && (
          <Banner tone="info" icon="lock" action={<Key size="sm" onClick={() => setCreated(null)}>Done</Key>}>
            <strong>Copy it now</strong>: it is shown only once.
            <code className="sc-secret">{created}</code>
          </Banner>
        )}
        <div className="sc-list">
          {list.data.tokens.length === 0 && <p className="sc-help">No tokens yet.</p>}
          {list.data.tokens.map((token) => <TokenRow key={token.id} token={token} allowed={allowed} now={now} onRevoked={list.reload} />)}
        </div>
        <NewToken list={list.data} allowed={allowed} onCreated={(token) => { setCreated(token); list.reload(); }} />
      </section>
      <section className="sc-bay" aria-labelledby="rest-title">
        <div className="sc-bay__head"><h2 className="sc-bay__title" id="rest-title">REST API</h2><span className="sc-tag">/api/v1</span></div>
        <p className="sc-help">
          Send the token as a bearer header. It acts with your current role, limited to its scopes. Every path, parameter and
          reply is described in <a className="sc-link" href="/api/v1/openapi.json">openapi.json</a>.
        </p>
        <code className="sc-secret">curl -H &quot;Authorization: Bearer sct_…&quot; {typeof window === "undefined" ? "" : window.location.origin}/api/v1/buoys/1/readings?limit=10</code>
      </section>
    </>
  );
}

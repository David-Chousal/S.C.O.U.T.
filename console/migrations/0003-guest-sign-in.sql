-- "Sign in as guest" (2026-10-30): a name and an email give a view-only guest account. Such an
-- account has no password and no verified identity, so anyone who types the email can use it.
-- 1 marks it: it can never be promoted, other people's emails are masked for it, and an invite
-- or a verified OAuth sign-in for the same email takes it over (and clears the flag).
-- Apply: wrangler d1 migrations apply scout-console --remote

ALTER TABLE users ADD COLUMN self_signup INTEGER NOT NULL DEFAULT 0;

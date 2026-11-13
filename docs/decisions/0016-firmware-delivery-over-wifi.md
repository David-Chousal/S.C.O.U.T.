# ADR-0016 — Firmware Reaches the Shore Station over WiFi from the Console

- **Status:** ✅ Accepted 2026-11-12 (David). Console side built on branch
  `firmware/sco-312-wifi-firmware-delivery`; not deployed; D1 migration `0016-firmware-jobs.sql`
  not applied remotely. The S3 side, the release tool's `upload` command and the S3's own WiFi
  update are not built yet
- **Date raised:** 2026-11-12 (David Chousal Cantu)
- **Owner:** CS lead (David Chousal Cantu)
- **Implements:** [SCO-312](https://linear.app/scout1/issue/SCO-312)
- **Amends:** [ADR-0008](0008-over-the-air-firmware-updates.md), which delivered the signed
  bundle to the shore station over USB only
- **Builds on:** [ADR-0012](0012-authenticated-console.md) (roles, API tokens, device tokens,
  audit log), [OTA design §10](../engineering/ota-firmware-update-design.md#10-as-built-2026-11-12)

> **Summary** — The developer signs a `.scoutfw` bundle on the release machine as before, then
> uploads it to the console with an admin's API token. The buoy's shore station finds it in a
> poll, downloads it over WiFi with its device token, checks the hash and the Ed25519 signature
> itself, and relays it over LoRa exactly as a USB-loaded bundle. After the first USB flash, no
> one has to be at the station to update a buoy. The console checks the bundle's layout and hash
> but never holds the signing key, so the trust model of ADR-0008 does not change. USB stays as
> a fallback.

---

## Context

ADR-0008 made the LoRa link two-way and the buoy updatable over the air, but the bundle still
reaches the shore ESP32-S3 through `shore/scripts/push_firmware.py` over USB. Every update
therefore needs someone at the station, which in Hawaii (Phase 6) means a trip to the pier. The
S3 already talks to the console over WiFi: it pushes readings and pulls requested settings with
a device token (SCO-237, SCO-298).

## Decision

1. **Upload:** `POST /api/v1/buoys/{id}/firmware` takes the bundle bytes. It needs a personal API
   token with the new **`write:firmware`** scope, and the token's owner must be an **admin**
   (new role action `firmware.write`). Any member may create a token with the scope, but only an
   admin's token can use it.
2. **The console checks the shape, not the signature:** magic, chunk size 128, flags 0, image
   1–224 KB (the buoy's application area from `0x8000`), length matching the manifest, the image's
   SHA-256 matching the manifest, and a target buoy equal to the one uploaded to (or 0, any). A
   version no higher than one already sent to that buoy (excluding canceled and rejected jobs) is
   refused. These checks give a fast, clear error on the laptop; they are not the security.
3. **Storage in D1** (`firmware_jobs`), not R2: R2 asks for a payment method, and a bundle is at
   most ~224 KB, well under D1's 2 MB value limit. The bytes are cleared once a job is final;
   the row stays as the record.
4. **One job at a time per buoy.** A new upload replaces a job the buoy has not accepted yet
   (`pending`, `staged`, `offering`); during `transferring` or `trial` it is refused. An admin
   can cancel the same three states.
5. **Shore pull:** `GET /api/device/firmware` lists live jobs for the buoys whose command station
   this is (the same routing as settings); `GET /api/device/firmware/{job}` returns the bytes;
   `POST /api/device/firmware/{job}/status` reports `staged`, `offering`, `transferring`, `trial`,
   `confirmed`, `rolled_back` or `rejected` with a short detail. A separate endpoint, not a new
   key in the settings reply, because the S3's settings parser assumes flat buoy objects.
6. **Audit:** upload and cancel are logged with the admin; the final state (`confirmed`,
   `rolled_back`, `rejected`) is logged as `device:<name>`.

## Why this is safe

The Ed25519 private key stays offline on the release machine (ADR-0008, design §5). The S3
verifies the signature before relaying anything, and the buoy verifies it again before flashing.
The buoy refuses any version not above the one it runs. Taking over the console, an admin
account or the network therefore lets an attacker resend only bundles the developer already
signed, and not downgrade a buoy. What it does allow is denial of service: canceling or
replacing a pending job, or holding an update back. That is accepted.

## Alternatives considered

- **SSH to the shore host and run `push_firmware.py` there.** Works only where the S3 hangs off
  a Linux host on a reachable network; the S3 can run alone on WiFi (SCO-310), and campus or
  hotel networks block inbound SSH. Rejected.
- **Verify the signature in the Worker too.** Would need the public key as a console variable
  (not secret) and adds nothing the S3 and buoy do not already check. Deferred; easy to add.
- **R2 for the bundles.** Needs a payment method on the Cloudflare account. Rejected.

## Consequences

- A larger console attack surface: an upload endpoint for bodies up to ~224 KB. Mitigated by
  admin-only tokens, a length check before the body is read, and the shape checks above.
- The S3 firmware must learn to poll, download, verify and report (SCO-312, not built). Its RAM
  and flash headroom for a ~95 KB bundle while WiFi and LoRa run is unmeasured.
- The S3's own firmware over WiFi (ESP-IDF OTA with two app partitions and a signature check) is
  part of SCO-312 but not of this console change; it needs one more USB flash for the partition
  table.
- All of this sits on the LoRa OTA path, which has **never run on hardware**; its bench test
  comes first so a failure is attributable.

## References

- [SCO-312](https://linear.app/scout1/issue/SCO-312), [SCO-197](https://linear.app/scout1/issue/SCO-197)
- [ADR-0008](0008-over-the-air-firmware-updates.md), [ADR-0012](0012-authenticated-console.md)
- [OTA firmware update design](../engineering/ota-firmware-update-design.md) §5 (keys), §10 (as built)
- `console/worker/firmware.js`, `console/migrations/0016-firmware-jobs.sql`, `console/test/firmware-test.js`

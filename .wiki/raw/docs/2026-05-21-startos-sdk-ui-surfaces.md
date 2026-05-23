---
title: StartOS SDK UI surfaces (start-sdk v0.4.0-beta.44)
type: docs
source: local node_modules + Start9Labs/start-os repo
date: 2026-05-21
quality: 5
confidence: high
tags: [startos, sdk, ui, interfaces]
summary: Inventory of every UI surface @start9labs/start-sdk exposes to packages.
---

# StartOS SDK UI surfaces

Source: `pool/node_modules/@start9labs/start-sdk/` (mirrors `Start9Labs/start-os/sdk/`).

## Service interface types

`ServiceInterfaceType = 'ui' | 'p2p' | 'api'` — `base/lib/types.d.ts:16`.

Frontend rendering (`Start9Labs/start-os/web/.../controls.component.ts:160-163, 74-80`):
- **`'ui'`** — renders a "Launch UI" button (`@tui.external-link` icon) that opens the URL in a **new browser tab**. Multiple `'ui'` interfaces become a dropdown.
- **`'api'`** — appears as copyable address rows only (Tor / LAN / IPv4 / public domain), no Launch button.
- **`'p2p'`** — same as `'api'` but typed differently for filtering.

**StartOS does NOT embed an iframe.** The package's docker image must ship its own HTTP server bound to the port `bindPort` exposed.

## Form inputs (`sdk.Action.withInput`)

Full `Value.*` builder set: `toggle | text | textarea | number | color | datetime | select | multiselect | object | file | union | list | hidden`, plus `dynamic*` variants. (`actions/input/builder/value.d.ts:45-720`).

This is the **only** form-based UI primitive — no general-purpose settings panels outside actions.

## Address auto-publication

`MultiHost.bindPort(port, { protocol, addSsl, preferredExternalPort, secure })` — `interfaces/Host.d.ts:91`. One bind auto-publishes:
- Tor `.onion`
- LAN `.local` (mDNS)
- IPv4 / IPv6
- ACME public domain (if configured)

Per-address SSL info shown via `getCertificate`.

## Manifest chrome

`manifest.ts` slots populate marketplace listing + service-page chrome:
`id, title, license, *Repo, *Site, donationUrl, docsUrl, description.{short,long}, alerts.{install,update,uninstall,restore,start,stop}, dependencies, hardwareRequirements, images`

## Health checks

`addDaemon({ ready: { display, fn } })` — display string appears as a status row.
`addHealthCheck(id, { ready, requires })` — secondary status rows.
Built-in fns: `checkPortListening`, `checkWebUrl`, `runHealthScript`.

## Logs

Daemon stdout/stderr → StartOS Logs viewer.
JS sandbox `console.info` → same viewer.
**No SDK-provided SSE or websocket primitives.** A package wanting realtime UI must bake SSE/WS into its own HTTP server on a `'ui'`/`'api'` interface.

## Backups

`createBackup` — invocable from the Service page, not visual.

## Implication for SV2

Adding a UI requires:
1. An HTTP server inside each Docker image (or a separate container — see [[../articles/2026-05-21-startos-multi-container-pattern]]).
2. `MultiHost.bindPort(uiPort, { protocol: 'http' })` in `interfaces.ts`.
3. `createInterface({ type: 'ui', ... })`.

This yields a "Launch UI" button that opens in a new tab.

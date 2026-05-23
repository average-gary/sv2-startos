---
title: StartOS multi-container packaging — three archetypes
type: articles
source: review of 5 reference packages on github.com/Start9Labs
date: 2026-05-21
quality: 5
confidence: high
tags: [startos, packaging, multi-container, btcpayserver, mempool]
summary: Three patterns for serving a UI from a StartOS package. Dominant pattern is "binary serves its own HTTP".
---

# StartOS multi-container packaging — three archetypes

## Archetype 1 — Binary serves its own HTTP (single image)

Wrapper provides one image and one daemon; the upstream binary listens on `uiPort`.

**Examples:**
- `Start9Labs/hello-world-startos` — 80
- `Start9Labs/filebrowser-startos` — 8080 (uses `checkWebUrl` to `/health`)
- `Start9Labs/ride-the-lightning-startos` — 80, command `['node', 'rtl']`
- `Start9Labs/bitcoin-core-startos` — bitcoind itself listens on RPC

`interfaces.ts` is near-boilerplate:

```ts
const m = sdk.MultiHost.of(effects, 'main')
const o = await m.bindPort(uiPort, { protocol: 'http' })
const ui = sdk.createInterface(effects, { type: 'ui', id: 'ui', /*…*/ })
return [await o.export([ui])]
```

## Archetype 2 — Multi-image upstream stack

Pull multiple prebuilt upstream images via `dockerTag`, instantiate one `SubContainer` per image, chain `addDaemon` calls.

**Example: mempool-startos**
- `manifest.ts:18-37` — `mempool/frontend:v3.3.1`, `mempool/backend:v3.3.1`, `mariadb:10.4.32`
- `main.ts:126-150` — three `SubContainer.of(...)` calls; `addDaemon('webui', ...)` runs the upstream nginx-based frontend
- `interfaces.ts:6-23` — single `type: 'ui'` interface bound to frontend port; backend API is internal-only

**Example: btcpayserver-startos**
- 4 images: `btcpay`, `nbx`, `postgres`, `shopify`
- Chained: `addDaemon('postgres'...).addDaemon('nbxplorer'...).addDaemon('btcpay'...).addDaemon('shopify'...)` with `requires:` for ordering

## Archetype 3 — Custom-built binary with multiple interface types

Repo ships a top-level `Dockerfile`; the binary itself exposes multiple ports of different `ServiceInterfaceType`.

**Example: bitcoin-core-startos**
- `interfaces.ts:374-480` — `'api'` for RPC (8332), `'p2p'` for peer (8333), `'api'` for ZMQ, conditional `'ui'` for embedded i2pd console
- Mix of `protocol: 'http'`, `protocol: null` + `secure: { ssl: false }`, `addSsl: null`, `preferredExternalPort` overrides
- Top-level `Dockerfile` GPG-quorum-verifies upstream tarball, extracts binaries to `/opt/bitcoin/bin`

## Build pipeline

Pure-wrapper repos share a 2-line Makefile:
```make
ARCHES := x86 arm
include s9pk.mk
```
The vendored `s9pk.mk` reads `manifest.images[*].source.dockerTag` and pulls/saves them. Custom-build packages ship a top-level `Dockerfile`.

## SDK constraints

`Daemons.d.ts`: `addDaemon<Id, C extends SubContainer<Manifest> | null>` is fully chainable. `requires:` accepts prior daemon IDs for ordering. `addOneshot` for one-off init steps. `addHealthCheck` for non-process health gates. **No documented ceiling on daemon count.**

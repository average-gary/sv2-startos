---
title: "StartOS bitcoin-core-startos — TCP/P2P interface exposure pattern"
type: repos
source: "https://github.com/Start9Labs/bitcoin-core-startos/blob/31.x/startos/interfaces.ts"
date: 2026-06-03
quality: 5
credibility: high
relevance: direct
direction: opposes
evidence_strength: "code-inspection"
tags: [startos, networking, tor-onion, service-interface, bitcoind, p2p, counterfactual]
summary: "Reference Start9 package for the canonical 'expose a non-HTTP TCP port to remote clients' case — proves StartOS already provides a Tor + LAN + clearnet address bundle for bitcoind P2P/8333 with one bindPort call."
---

# bitcoin-core-startos — interfaces.ts (the closest analog to our SV2 case)

Source fetched via `gh api repos/Start9Labs/bitcoin-core-startos/contents/startos/interfaces.ts` on 2026-06-03 (branch `31.x`, sha `f1b765f`).

## Why this is the right comparator

bitcoin-core's P2P port (8333) is the closest semantic analog to our pool's downstream Stratum port (34254): a non-HTTP, raw-TCP, framed-binary protocol that a remote untrusted peer needs to reach. If StartOS already gives bitcoind a "pasteable address" UX for 8333, the same machinery already serves SV2.

## What the package does for the P2P port

```ts
// bitcoin-core-startos/startos/interfaces.ts
const peerMulti = sdk.MultiHost.of(effects, 'peer')
const peerMultiOrigin = await peerMulti.bindPort(peerPortInternal, {
  protocol: null,
  preferredExternalPort: peerPortExternal, // 8333
  addSsl: null,
  secure: { ssl: false },
})
const peer = sdk.createInterface(effects, {
  name: i18n('Peer Interface'),
  id: peerInterfaceId,
  description: i18n(
    'Listens for incoming connections from peers on the bitcoin network',
  ),
  type: 'p2p',
  masked: false,
  schemeOverride: { ssl: null, noSsl: null },
  username: null,
  path: '',
  query: {},
})
const peerReceipt = await peerMultiOrigin.export([peer])
```

`utils.ts`:
- `peerPortExternal = 8333`
- `peerPortInternal = 58333`

That's it. Zero per-protocol logic for Tor/LAN/clearnet. The SDK does the address fan-out.

## Compare to our pool (`pool/startos/interfaces.ts:6-12`)

```ts
const downstreamMulti = sdk.MultiHost.of(effects, 'downstream-multi')
const downstreamMultiOrigin = await downstreamMulti.bindPort(DOWNSTREAM_PORT, {
  protocol: null,
  addSsl: null,
  preferredExternalPort: DOWNSTREAM_PORT,
  secure: { ssl: false }
})
```

**These are byte-for-byte the same shape** — `protocol: null` + `secure: { ssl: false }` is the documented opt-out for "raw TCP, no TLS termination, just expose the port." The pool, translator, and jd-client `interfaces.ts` files all already use this pattern.

## What addresses get auto-published

Per `start-sdk` `Host.d.ts:91` and the StartOS docs (`/start-os/interfaces.html`):

- LAN mDNS (`<server>.local:<externalPort>`) — automatic, mDNS broadcast on LAN
- LAN IPv4 / IPv6 — automatic
- Tor onion — **only if the user installs the Tor service from the marketplace** (see [[2026-06-03-startos-networking-tor-clearnet-friction]])
- ACME / clearnet domain — only if the user configures a gateway + domain

## Implication for thesis

**Strongly opposes the "Iroh enables easy user setup" framing as a marginal win.** Bitcoin Core is already shipped on StartOS with the exact `bindPort` pattern we use, and Start9 users have been pasting `<onion>:8333` (or `<server>.local:8333`) into their own remote wallets for years. The infrastructure to do the equivalent for `<server>.local:34254` already exists in our `interfaces.ts` today — no Iroh code needed.

**However**: this also reveals a real gap. If the user does NOT install the Tor service, *and* their ISP does CGNAT, *and* they don't want to run a VPN, they have no remote-reach option for 34254. That sliver is exactly where Iroh's hole-punching could matter. See cross-ref to clearnet friction note.

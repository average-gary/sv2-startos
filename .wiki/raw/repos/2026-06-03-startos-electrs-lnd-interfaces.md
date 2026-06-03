---
title: "StartOS electrs & lnd — additional TCP service interface comparators"
type: repos
source: "https://github.com/Start9Labs/electrs-startos + https://github.com/Start9Labs/lnd-startos"
date: 2026-06-03
quality: 4
credibility: high
relevance: direct
direction: nuances
evidence_strength: "code-inspection"
tags: [startos, networking, electrs, lnd, p2p, api, service-interface, counterfactual]
summary: "Two more reference TCP-exposure patterns from Start9: electrs (one bindPort, addSsl=true via stunnel-style termination) and lnd (mixed gRPC/REST + p2p — masked: true exports query-string-encoded macaroons for one-tap pairing)."
---

# electrs-startos — single port, addSsl-as-side-channel

Branch fetched via `gh api repos/Start9Labs/electrs-startos/contents/startos/interfaces.ts` on 2026-06-03.

```ts
const multihost = sdk.MultiHost.of(effects, 'electrum')
const mainMultiOrigin = await multihost.bindPort(port, {
  protocol: null,
  addSsl: {
    preferredExternalPort: 50002,
    alpn: null,
    addXForwardedHeaders: false,
    auth: null,
  },
  preferredExternalPort: port, // 50001
  secure: null,
})
const main = sdk.createInterface(effects, {
  name: i18n('Main'),
  id: 'main',
  description: i18n('The main interface for accessing electrs'),
  type: 'api',
  // ...
})
```

Notable: a single `bindPort` produces **both** `:50001` (plain TCP) and `:50002` (StartOS-terminated TLS) URLs in the address table. The user picks one in their wallet. This is the SDK doing port-pair management — no separate interface, no extra container.

# lnd-startos — three interfaces, including a `masked: true` "lndconnect" pairing URL

```ts
// REST connect — the pasteable URL embeds the macaroon as a query param
const lndConnect = sdk.createInterface(effects, {
  name: i18n('REST LND Connect'),
  id: lndconnectRestId,
  description: i18n('Used for REST connections'),
  type: 'api',
  masked: true,
  schemeOverride: { ssl: 'lndconnect', noSsl: 'lndconnect' },
  username: null,
  path: '',
  query: { macaroon },
})
```

This is the most user-setup-ergonomic comparator we have. The user clicks "Copy" on the LND service page and gets a single `lndconnect://...?macaroon=...` URI containing:

1. The address (Tor / LAN / clearnet — whichever they tap)
2. The TLS cert (base64url, in `query.cert` for gRPC variant)
3. The auth macaroon (base64url, in `query.macaroon`)

Zelle, Zeus, Alby etc. accept that URI directly. **One copy, one paste, paired.**

The peer port (9735) and watchtower port (9911) are exposed identically to our `protocol: null, secure: { ssl: false }` pattern.

## Implication for thesis

**Nuances the thesis.** The lndconnect pattern is the existence proof that StartOS has a much higher ceiling for "easy user setup" than our current SV2 packages reach. We currently expose:
- pool: `<addr>:34254` (raw)
- translator: `<addr>:34255` (raw)
- jdc: `<addr>:34264` (raw)

…with no auth context bundled in the URI. A future-tense improvement that would actually move user-setup-ergonomics — without any Iroh code — is to mint a `sv2://` `schemeOverride` and embed the upstream noise pubkey as `query.public_key`, exactly like lndconnect does. That pattern is unrelated to transport choice (TCP vs Iroh) and is the highest-leverage UX improvement for the SV2 case.

The argument that "Iroh is the path to easy user setup" must therefore reckon with the fact that StartOS's setup ergonomics ceiling is determined by what gets baked into the `createInterface` URI, not by transport. Iroh nodeId pairing strings are *also* a candidate query-string payload, but they're additive — not replacement — vs the existing TCP fan-out.

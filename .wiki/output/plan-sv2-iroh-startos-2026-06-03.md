---
title: "SV2 + Iroh StartOS Bundle — design plan"
type: output
artifact: implementation-plan
date: 2026-06-03
status: proposed
fork: average-gary/sv2-apps@feat/iroh-transport
fork_head: 12a49efaee6979dc805c720c8ed7014046121baa
target_packages: [sv2-pool, sv2-tproxy, sv2-jd-client]
ships_with: [iroh-transport, iroh-transport-monitoring]
companion_thesis: theses/iroh-sv2-startos-ideal-candidate.md
tags: [implementation, startos, sv2, iroh, design]
updated: 2026-06-03
spec_uri_scheme: "stratum2+tcp://host:port/<authority_pubkey>"
spec_uri_source: "stratum-mining/sv2-spec § 4.7 (04-Protocol-Security.md)"
summary: "Phased plan to rebase the StartOS bundle onto feat/iroh-transport and surface Iroh as a first-class connectivity option alongside TCP+mDNS and TCP+Tor (the latter shipped with an experimental warning since SV2-over-Tor is untested)."
---

# SV2 + Iroh StartOS Bundle — design plan

## Decision (recorded for future readers)

Three connectivity modes ship as first-class options; the operator picks per service:

1. **TCP + mDNS** — `<server>.local:34254` for on-LAN miners. Zero config. Today's behavior. Iroh's `iroh-mdns-address-lookup` coexists with StartOS's mDNS, so on-LAN Iroh discovery is also zero-config.
2. **TCP + Tor onion** — `<xyz>.onion:34254` for off-LAN miners. ⚠️ **Experimental — untested. SV2 has never been verified end-to-end over Tor circuits.** The Configure action surfaces a "no guarantees" warning whenever a Tor-flavored upstream is selected or a Tor onion is added to a listener interface.
3. **Iroh** — NodeId-addressed, NAT-traversed, mDNS-discoverable on LAN. Off by default initially; flipped on per-service via Configure action.

**Connection strings follow the spec.** sv2-spec § 4.7 defines the canonical URI as `stratum2+tcp://host:port/<authority_pubkey>` (authority public key in the **path** component, base58-encoded). The SRI UI and `sv2-wizard` already use this. Our `interfaces.ts` mints this exact format. For Iroh we extend by analogy: `stratum2+iroh://<node-id>/<authority_pubkey>` (host/port replaced by the Iroh NodeId; path retains the authority pubkey).

Rationale: the thesis research ([[theses/iroh-sv2-startos-ideal-candidate]]) landed at "partially supported." Two findings the user corrected on review:

- StartOS already runs mDNS, and Iroh has `iroh-mdns-address-lookup` — they coexist cleanly on-LAN.
- SV2-over-Tor has not been verified anywhere. We ship it as an option behind an explicit "experimental, no guarantees" warning rather than as a measured baseline.

The fork remains the right basis (fresh, additive, dual-stack listeners, clean architectural seam). The bundle gets the Iroh upside without forcing it on users.

## What rolls forward from prior work

- **UI bundle (already shipped, commits `1b1d9a6..f2f8a5c`)** — Pioneer Hash dashboard sidecar per service; SV2 monitoring HTTP at `localhost:9090`; Field Station design system. → see [[output/playbook-startos-package-ui-2026-05-21]].
- **Existing StartOS files** unchanged in shape: `manifest.ts`, `interfaces.ts`, `main.ts`, `fileModels/config.toml.ts`, `actions/setConfig.ts`, `init/`, `install/` — additive edits only.
- **`DOWNSTREAM_PORT = 34254`** stays the canonical TCP port. Iroh listener does not reuse it.

## Architecture overview

### Per-service connectivity matrix

| Service          | TCP listen        | Tor onion     | Iroh listen     | Iroh dial (upstream) |
|---|---|---|---|---|
| `sv2-pool`       | 34254 (downstream)| via Tor pkg   | enabled by config (NodeId per-service) | n/a (pool is sink) |
| `sv2-tproxy`     | 34255 (sv1 miners)| n/a (sv1 over Tor is questionable, defer) | n/a — translator dials, doesn't listen on the upstream side | per-upstream `transport = "tcp"` or `"iroh"` |
| `sv2-jd-client`  | 34254 (downstream from translator) | via Tor pkg | enabled by config | per-upstream `transport = "tcp"` or `"iroh"` (dials sv2-pool) |

Notes:
- Pool's JDS subsystem (when enabled) gets its own Iroh listener if Iroh is enabled — same key, different ALPN (`sv2/jds/0`). The fork already wires this.
- Translator's downstream side (SV1-over-TCP from ASIC) is **fundamentally TCP-only** — SV1 spec doesn't admit transport pluggability. Iroh on the translator only helps the upstream-to-pool/JDC dial.

### Dual-stack listener semantics (already in fork)

Pool and JDS run TCP and Iroh listeners simultaneously when Iroh is enabled. A Start9 user's pool serves stock-TCP Antminers and NAT-traversed Iroh peers from one process. **No miner-side change required for legacy interop.**

### Dial semantics (also already in fork)

Outbound is single-transport per upstream entry (commit `b42c3dc2` removed `IrohThenTcp` fallback variants — fail loudly, not silently). To dial both, the operator configures **two `[[upstreams]]` entries**, one TCP and one Iroh, and the runtime fails over by index. We surface this in the Configure action UX explicitly.

## Phase 1 — Rebase and feature-gate

**Goal:** the bundle builds against `feat/iroh-transport` with Iroh **off by default**. No behavior change for existing installs.

### 1.1 Submodule pin

`sv2-apps/` submodule currently points at `de60df95` (upstream `release/v0.4.0`). Move to `12a49efa…` on `average-gary/sv2-apps@feat/iroh-transport`.

Open question: does the fork track upstream `release/v0.4.0` or `main`? The fork is 13 ahead / 13 behind upstream `main`, so this is **a behavior swap**, not just an additive layer. Audit the 13-behind commits before pinning. If any are bug fixes we need, ask the maintainer to rebase, or cherry-pick into a Pioneer Hash overlay branch.

### 1.2 Cargo features in `Makefile` per service

Each service's `Makefile` (or its inner Dockerfile) adds:

```make
CARGO_FEATURES ?= iroh-transport,iroh-transport-monitoring
# default-off variant:
# make build CARGO_FEATURES=
```

Default builds with the feature. The non-feature build remains bit-equivalent to upstream `main` (per fork survey, [[raw/repos/2026-06-03-fork-stratum-apps-cargo-toml]]).

### 1.3 Smoke test

After rebase, before exposing Iroh in the UI:
- `make all` produces three `.s9pk` files at the same arch coverage (x86_64 + aarch64) and roughly the same size as today (current: pool 111 MB, tproxy 111 MB, jdc 112 MB; iroh adds ~3–5 MB).
- Existing testnet config still starts the pool and accepts a TCP-only translator connection.
- `pool_sv2 --help` shows new `--iroh-config` flag (or whatever the fork exposed).

## Phase 2 — Config schema

Add an `[iroh]` block to each service's `fileModels/config.toml.ts`. Keep it `enabled: false` by default so Phase 1's smoke test continues to pass.

### 2.1 Pool — `pool/startos/fileModels/config.toml.ts`

Add to `shape`:

```ts
const iroh = object({
  enabled: boolean,
  // Persisted per-service Ed25519 secret key path (mode 0600).
  // Defaults to /data/iroh/pool.secret. Auto-generated on first start if missing.
  secret_key_path: string.optional(),
  // Discovery toggles. Defaults match Fedimint production config:
  // mdns + pkarr-resolve on; pkarr-publish off (StartOS sovereignty default);
  // mainline DHT off; n0 hosted DNS off.
  discovery: object({
    mdns: boolean,
    pkarr_publish: boolean,
    pkarr_resolve: boolean,
    mainline_dht: boolean,
    n0_dns: boolean,
  }),
  // Optional self-hosted iroh-relay URL. When unset, n0 hosted relays are used IFF n0_dns is on.
  // Sovereignty path: provide your own iroh-relay endpoint here.
  relay_url: string.optional(),
})

// in shape: ...
iroh,
```

### 2.2 Translator — `translator/startos/fileModels/config.toml.ts`

Each upstream gets a `transport` discriminator; Iroh upstream entries replace `address`+`port` with `node_id` and an optional inline ticket.

```ts
upstreams: array(
  literals(
    object({ transport: literal('tcp'), address: string, port: number, authority_pubkey: string }),
    object({ transport: literal('iroh'), node_id: string, ticket: string.optional(), authority_pubkey: string }),
  ),
),
iroh, // same shape as pool
```

The `aggregate_channels` flag and downstream block stay TCP-coupled (SV1 from ASIC).

### 2.3 JDC — `job-declaration-client/startos/fileModels/config.toml.ts`

Same pattern: `[iroh]` block + `transport`-tagged `[[upstreams]]`. JDC dials sv2-pool; sv2-pool may be on the same Start9 box (use mDNS NodeId discovery) or a remote Start9 (paste NodeId).

### 2.4 TOML rendering in `main.ts`

Each service's `main.ts` extends `renderConfig()` to emit:

```toml
[iroh]
enabled = true
secret_key_path = "/data/iroh/pool.secret"

[iroh.discovery]
mdns = true
pkarr_publish = false
pkarr_resolve = true
mainline_dht = false
n0_dns = false

# omit relay_url to use defaults; or:
# relay_url = "https://relay.example.com"
```

When `enabled = false`, omit the `[iroh.*]` blocks entirely so the upstream binary takes the no-iroh code path.

## Phase 3 — Surface NodeId / ticket in `interfaces.ts`

This is the operator-UX deliverable. The thesis flagged that StartOS's `MultiHost.bindPort` has no plug-in seam for `iroh-nodeId://` addresses, so we use the available primitive: a **second `createInterface`** with `masked: true`, hand-rolled URL composition, and Start9's existing copy-button affordance.

### 3.1 Add an Iroh interface per service

In `pool/startos/interfaces.ts`, after the existing `downstreamReceipt`:

```ts
// Iroh dial-string interface (visible only when [iroh].enabled is true).
// Read NodeId from /data/iroh/pool.public — written by the binary on first start.
const iroh = await readIrohPublic(effects, 'sv2-pool') // helper, returns null when iroh disabled
if (iroh) {
  const irohMulti = sdk.MultiHost.of(effects, 'iroh-multi')
  // bind a placeholder loopback port — required by the SDK; never accepts traffic
  const irohOrigin = await irohMulti.bindPort(34294, {
    protocol: null, addSsl: null, secure: { ssl: false },
    preferredExternalPort: 34294,
  })
  const irohInterface = sdk.createInterface(effects, {
    name: 'Pioneer Hash SV2 Pool — Iroh dial-string',
    id: 'pool-iroh',
    description: 'Paste this into a Start9 SV2 Translator or JD Client as an Iroh upstream.',
    type: 'api',
    masked: true,
    schemeOverride: { ssl: 'stratum2+iroh', noSsl: 'stratum2+iroh' },
    username: null,
    // sv2-spec § 4.7 puts the authority pubkey in the URL PATH (not query).
    // For the iroh variant we extend by analogy: <node-id> takes the host slot,
    // authority pubkey stays in the path. Some StartOS SDKs may not let us put
    // the NodeId in the host field directly; if that's the case, we fall back to
    // serving the dial-string via the Pioneer Hash dashboard "Connect" panel
    // and keep this interface as advisory copy.
    path: `/${iroh.authorityPk}`,
    query: { node_id: iroh.nodeId },
  })
  await irohOrigin.export([irohInterface])
}
```

The result is a `stratum2+iroh://<placeholder>:34294/<authority_pk>?node_id=<...>` URL surfaced in the StartOS service-page address table. The host portion is cosmetic; the dialing service's Configure action parses NodeId from `?node_id=` and authority pubkey from the path.

This is a deliberate hack on top of `MultiHost.bindPort` (the closed-set seam noted in [[raw/docs/2026-06-03-startos-multihost-bindport-source]]). When/if start-os SDK adds first-class non-IP-host interfaces, we collapse to a clean `stratum2+iroh://<node-id>/<authority_pk>` form.

### 3.2 Concurrent: ship the spec-defined `stratum2+tcp://` URI

The single biggest user-setup-ergonomics win, transport-independent. Per **sv2-spec § 4.7**:

```
stratum2+tcp://thepool.com:34254/9bXiEd8boQVhq7WddEcERUL5tyyJVFYdU8th3HfbNXK3Yw6GRXh
```

Authority public key is the URL **path** (base58, ~50 chars). The SRI UI (`stratum-mining/sv2-ui`) and `sv2-wizard` already render this; we match.

```ts
const sv2Uri = await sdk.createInterface(effects, {
  name: 'Pioneer Hash SV2 Pool — connect URI',
  id: 'pool-sv2-uri',
  type: 'api',
  masked: true,
  schemeOverride: { ssl: 'stratum2+tcp', noSsl: 'stratum2+tcp' },
  // Authority pubkey in the PATH per spec § 4.7 — not the query string.
  path: `/${config.authority_public_key}`,
  query: {},
  ...
})
```

Renders `stratum2+tcp://<server>.local:34254/<authority_pubkey>` — spec-conformant, copy-paste between Start9 boxes, parses cleanly with the SRI UI's existing parser. This ships regardless of whether Iroh is enabled.

## Phase 4 — Configure-action UX

`actions/setConfig.ts` gains:

- **Connectivity Mode** multi-select: `LAN-only (mDNS)` / `Public via Tor onion ⚠️` / `Public via Iroh`.
- When `Iroh` is selected, show:
  - Discovery toggles (advanced, defaults pre-set per Fedimint conventions)
  - Optional `Custom relay URL` (sovereignty path)
  - "Regenerate Iroh secret key" button (destructive — warns it changes NodeId)
- For tproxy/jdc: per-upstream **transport picker** (TCP / Iroh / Tor onion) inline in the existing upstreams list editor.
- For tproxy/jdc: a "Paste connection URI" helper that splits a `stratum2+tcp://host:port/<authority_pubkey>` or `stratum2+iroh://<node-id>/<authority_pubkey>` URL into the appropriate config fields automatically.

### 4.1 Tor warning banner — every Tor surface

Whenever the operator selects Tor onion mode for a listener, picks `transport: tor` for an upstream, or pastes an `.onion` host into an upstream entry, render this warning prominently (red/amber, dismissable but reappears every Configure session):

> ⚠️ **Experimental: SV2 over Tor is untested.**
>
> Stratum V2 has not been verified end-to-end over Tor circuits anywhere we know of. Latency, share-submission timing, circuit churn, and Noise NX handshake behavior under Tor are all unknown. **No guarantees** — share loss, stale work, or silent disconnects are plausible failure modes.
>
> If you turn this on, please file a GitHub issue with what worked and what didn't. Your bug report is data nobody else has.

Wired into `setConfig.ts` as an `info` field on the radio/picker option and as a `validate`-time warning when an `.onion` address is detected in an upstream entry.

## Phase 5 — Health checks and metrics

### 5.1 Health check additions to `main.ts`

```ts
.addHealthCheck('iroh-listener', {
  ready: {
    display: 'Iroh transport',
    fn: async () => {
      if (!config.iroh.enabled) return { result: 'disabled' as const }
      // poll the iroh metrics endpoint exposed by iroh-transport-monitoring feature
      // expected: /metrics shows iroh_endpoints{role="pool"} 1
      return checkIrohMetrics(subcontainer)
    },
  },
  requires: ['primary'],
})
```

### 5.2 UI sidecar surface

The Pioneer Hash dashboard already polls `localhost:9090`. Add an Iroh Status card per service:

- NodeId (truncated, copy button)
- Connection mode currently used: `direct hole-punched` / `relayed via <url>` / `local mDNS`
- Hole-punch attempts, success rate (from iroh metrics)
- Active peer count, peers by transport

Bundle size delta is small: the SV2 monitoring HTTP API needs to surface iroh's existing prometheus metrics through a new path. Upstream's `iroh-transport-monitoring` cargo feature already does the metric collection.

## Phase 6 — Removed

Originally proposed: a measurement track to verify SV2 over Tor end-to-end. **Removed at user direction** — Tor ships as an experimental option behind a "no guarantees" warning (Phase 4.1) instead of as a measured baseline. If a user wants to attempt the measurement, that's a downstream decision; the package doesn't gate on it.

## Phase 7 — Default ship configuration

For the first release with this code:

- Pool: TCP+mDNS on, Iroh on (with mdns + pkarr_resolve discovery only, no n0 DNS, no DHT, no pkarr publish), Tor onion off (operator opt-in, gated by the experimental warning).
- Translator: TCP-only by default; per-upstream Iroh available in the Configure action; Tor available with warning.
- JDC: TCP-only by default; per-upstream Iroh available in the Configure action; Tor available with warning.

Rationale: pool is the inbound side; turning Iroh on by default is low-cost and showcases the "no router config" win without changing any TCP behavior. The dialing services keep TCP defaults so existing user configs migrate cleanly.

Discovery default rationale: mDNS + pkarr-resolve covers same-LAN and "I have a NodeId pasted in" cases. n0 DNS / mainline DHT are off by default to honor StartOS's sovereignty ethos and avoid leaking interface IPs (issue #3074, [[raw/articles/2026-06-03-iroh-ticket-privacy-leak]]).

## Risks acknowledged

These came out of the thesis research and remain real even though we're shipping:

- **n0 relay operator concentration** — single small company, one historical outage. Mitigation: ship `relay_url` config so operators can point at a self-hosted iroh-relay. (Tor is **not** a sovereignty fallback — Phase 4.1 makes clear it's untested for SV2.)
- **Iroh v1.0 not yet GA** — pinned at `1.0.0-rc.1`. Mitigation: each upstream-fork rebase requires re-running the smoke test; a feature-flag toggle to `iroh-transport=false` is always available as a kill-switch.
- **Default tickets leak interface IPs** — mitigation: ship a "Display NodeId-only" mode in interfaces.ts (don't synthesize full Display tickets). Operators paste NodeId; discovery resolves the rest.
- **Symmetric-NAT mitigation deferred past v1.0** — mitigation: relay path works regardless; document the relay tail-latency cost (~14× TTFB per issue #4134) in the Configure action notes.
- **First-of-its-kind on Start9** — mitigation: explicit "experimental" badge on the Iroh toggle for the first 1–2 releases; prominent issue link for bug reports.

## Phasing summary

| Phase | What | Blocks the next |
|---|---|---|
| 1 | Submodule rebase + feature-gate | yes |
| 2 | Config schema + TOML rendering, Iroh defaulted off | yes |
| 3 | Iroh dial-string interface in `interfaces.ts` + spec-defined `stratum2+tcp://` URI | partially (URI ships first) |
| 4 | Configure-action UX (incl. Tor untested-warning) | needs phases 2 + 3 |
| 5 | Health checks + UI sidecar Iroh card | needs phase 1 |
| 6 | (Removed — was Tor measurement; replaced by Phase 4.1 warning) | — |
| 7 | Default-on for pool inbound; release | needs all above |

## Resolved decisions (this session)

1. **Submodule pin policy** — fork's `feat/iroh-transport` directly is the canonical branch; submodule URL is `https://github.com/average-gary/sv2-apps.git` with `branch = feat/iroh-transport`. Upstream `stratum-mining/sv2-apps` is added as a second remote (`upstream`) for sync.
2. **Wrapper repo home** — `https://github.com/average-gary/sv2-startos` (single repo, three packages as subdirs). All three `manifest.ts` `wrapperRepo` fields point here.
3. **URI scheme** — `stratum2+tcp://host:port/<authority_pubkey>` per sv2-spec § 4.7. Authority pubkey is the **path** component, not a query param.
4. **Tor handling** — first-class option, but every Tor surface in the Configure action shows the experimental warning (Phase 4.1). No measurement gating.

## Companions

- [[theses/iroh-sv2-startos-ideal-candidate]] — verdict + evidence ledger, includes the corrections from this conversation
- [[output/thesis-iroh-sv2-startos-2026-06-03]] — cross-path synthesis
- [[output/playbook-startos-package-ui-2026-05-21]] — UI bundle that already shipped, integrates with phase 5
- [[output/plan-pioneer-hash-sv2-ui-2026-05-21]] — UI implementation spec

---
title: SV2 StartOS Package Knowledge Base
type: wiki
created: 2026-05-21
updated: 2026-06-03
sources: 32
articles: 0
theses: 1
status: implemented
---

# SV2 StartOS Package Knowledge Base

Local research wiki for the `sv2-startos` repo — Stratum V2 (pool, translator, jd-client) packaged for StartOS / Start9.

## Question of record

**How do we add a UI to the SV2 StartOS packages?** → **Answered & shipped** in commits `1b1d9a6..f2f8a5c`.

→ See [[output/playbook-startos-package-ui-2026-05-21]] for the playbook and [[output/plan-pioneer-hash-sv2-ui-2026-05-21]] for the implemented spec.

## Active thesis (2026-06-03)

**Is `average-gary/sv2-apps@feat/iroh-transport` an ideal candidate for the SV2 StartOS packages?** → **Partially Supported / Mixed**, confidence **medium**.

→ See [[theses/iroh-sv2-startos-ideal-candidate]] (verdict + evidence ledger), [[output/thesis-iroh-sv2-startos-2026-06-03]] (cross-path synthesis), and [[output/plan-sv2-iroh-startos-2026-06-03]] (the implementation plan — ship anyway with three-mode connectivity).

Headline: the fork is fresh and additive, but "ideal" overreaches. We're shipping it anyway with **three first-class connectivity modes** — TCP+mDNS, TCP+Tor, Iroh — Iroh on-by-default for the pool inbound, operator-opt-in elsewhere. SV2-over-Tor will be measured for the first time in the process.

## Headline finding (2026-06-03 — thesis)

`feat/iroh-transport` is well-engineered and TCP-compatible; **the architectural seam in stratum-core is clean** (zero socket coupling outside `network_helpers`). But the Iroh value prop only realizes for Start9-to-Start9 deployments — zero ASIC firmwares, zero production pools, and zero upstream RFC engagement on Iroh today. Default Iroh tickets leak interface IPs; symmetric-NAT mitigation deferred past v1.0. Counterfactual on StartOS is closer than assumed.

## Headline finding (2026-05-21 — UI)

Upstream `stratum-mining/sv2-ui` is **already being built** as a TypeScript UI against the same OpenAPI 0.1.0 spec we just wired up via `monitoring_address`. Bundling it as a Caddy sidecar is the path of least resistance.

## Sources

### UI track (2026-05-21)

- `raw/docs/2026-05-21-startos-sdk-ui-surfaces.md` — every UI surface @start9labs/start-sdk exposes
- `raw/docs/2026-05-21-sv2-monitoring-http-api.md` — full endpoint inventory of upstream's HTTP API
- `raw/articles/2026-05-21-startos-multi-container-pattern.md` — three packaging archetypes from real .s9pk examples
- `raw/articles/2026-05-21-startos-ui-integration-paths.md` — embed / sidecar / external comparison
- `raw/articles/2026-05-21-sv2-ui-information-architecture.md` — what to show per service
- `raw/repos/2026-05-21-stratum-mining-sv2-ui-upstream.md` — upstream's own UI repo

### Iroh-transport thesis track (2026-06-03)

26 sources across 5 parallel research paths — see [[output/thesis-iroh-sv2-startos-2026-06-03]] for the categorized list with one-line summaries.

- Path 1 (fork survey): 5 `repos/` sources — branch metadata, Cargo features, iroh module architecture, role integration, upstream engagement
- Path 2 (Iroh UX): 7 sources — endpoints/discovery, ticket format, dumbpipe/sendme, hole-punch failure issues, repo health, vs Tailscale/Tor, ticket privacy leak
- Path 3 (StartOS networking): 4 sources — bitcoin-core/electrs/lnd interfaces, Tor/clearnet friction, MultiHost.bindPort source
- Path 4 (SV2 interop): 7 sources — spec transport requirements, dual-stack listener, RFC #1935, transport-abstraction branch, ASIC firmware/pool deployment, stratum-core decoupling, translator topology
- Path 5 (production cases): 6 sources — Iroh relay outage, Paycode deployment, StartTunnel, libp2p hole-punch paper, Tailscale baseline, Iroh ecosystem

## Outputs

- `output/playbook-startos-package-ui-2026-05-21.md` — actionable playbook (high-level decision tree)
- `output/plan-pioneer-hash-sv2-ui-2026-05-21.md` — implementation **spec** for the custom Pioneer Hash UI
- `output/thesis-iroh-sv2-startos-2026-06-03.md` — cross-path synthesis for the Iroh-transport thesis (verdict: partially supported)
- `output/plan-sv2-iroh-startos-2026-06-03.md` — implementation plan: ship Iroh as first-class option in the StartOS bundle (TCP+mDNS / TCP+Tor / Iroh)

## Theses

- `theses/iroh-sv2-startos-ideal-candidate.md` — Iroh-transport fork as ideal StartOS basis. **Status:** completed. **Verdict:** partially-supported. **Confidence:** medium.

## Source counts

| Type | Count |
|---|---|
| docs | 5 |
| articles | 11 |
| repos | 14 |
| papers | 1 |
| data | 0 |
| **theses** | **1** |

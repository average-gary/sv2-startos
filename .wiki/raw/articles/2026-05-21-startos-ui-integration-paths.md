---
title: StartOS UI integration paths — comparison
type: articles
source: synthesis from BTCPay/Mempool patterns + start-sdk Daemons.d.ts + sv2-apps Cargo deps
date: 2026-05-21
verified: 2026-05-26
volatility: hot
quality: 5
confidence: high
tags: [startos, ui, integration, sidecar, embedded]
summary: Three integration paths compared. Recommendation: sidecar first, embed later via upstream PR.
---

# StartOS UI integration paths

## Path 1 — Embed UI in the existing Rust binary

Add `rust-embed` + an `axum` static-file route to `pool_sv2` / `translator_sv2` / `jd_client_sv2`. UI built in a separate `frontend-builder` Docker stage that emits `dist/` consumed by `rust-embed` at compile time.

**Critical evidence**: `sv2-apps/stratum-apps/Cargo.toml:62` already has `monitoring = ["serde_json", "axum", "prometheus", "utoipa", "utoipa-swagger-ui"]`. The HTTP server at `monitoring/http_server.rs` already does `Router::new().merge(SwaggerUi::new(...))` — adding a `/ui` static route is a trivial extension of an existing accepted pattern.

## Path 2 — Sidecar container

Add a second image (caddy/nginx/Node) to each `manifest.images`. New `SubContainer.of(...)` + `addDaemon('ui', { requires: ['primary'] })` in `main.ts`. Sidecar serves the UI bundle and proxies `/api/*` to `pool_sv2:9090` over the inter-container bridge.

**Precedent**: `btcpayserver-startos` runs 4 daemons (postgres, nbxplorer, btcpay, shopify) via chained `addDaemon` calls with `requires:` ordering. SDK `Daemons.d.ts` confirms no documented daemon-count ceiling.

## Path 3 — External / link-out

Pure interface declaration pointing at `monitoring_address`. User sees raw JSON. `/swagger-ui` already gives them an interactive explorer.

## Comparison

| Axis | Path 1: Embed | Path 2: Sidecar | Path 3: External |
|---|---|---|---|
| **Build complexity** | Low: `rust-embed` + axum static. Frontend stage in Dockerfile. | Medium: 2nd image + 2nd `SubContainer` + 2nd daemon + Caddyfile/nginx.conf | Trivial |
| **Ship size** | +2-10 MB gzipped SPA in binary | +20 MB (caddy:alpine) to +180 MB (node:alpine) per package | 0 MB |
| **Update cadence** | UI change → full Rust rebuild + binary version bump | UI sidecar versioned independently — bump UI image tag without `pool_sv2` rebuild | N/A |
| **StartOS-fit** | Native (one daemon, one interface) | Native (BTCPay precedent) | Native but ugly |
| **Tor/LAN/SSL** | Single interface, one onion, one cert | Two interfaces possible (separate UI / API onions) or combined | Raw API |
| **Reverse-proxy** | None (axum handles `/api/*` and `/`) | Required in sidecar (caddy/nginx) | None |
| **Dev effort** | ~1 week incl. upstream PR | ~3 days, downstream-only | ~2 hours |
| **Upstream PR risk** | Medium — feature-flagged should land easily | None | None |

## Recommendation

**Start with Path 2 (sidecar). Open Path 1 as a parallel upstream PR.**

Path 2 wins for first iteration because:
- Zero upstream coordination — all changes stay in `pool/`, `translator/`, `jd-client/`
- UI iterates independently of Rust rebuild during design-heavy phase
- BTCPay-startos is a copy-pasteable template
- `monitoring_address` already exposes the data

**Concrete first iteration:**
1. Add `caddy: { source: { dockerTag: 'caddy:2-alpine' } }` to each manifest's `images`
2. Bake `stratum-mining/sv2-ui` (or our own SPA) + Caddyfile into a `caddy-ui` image
3. `main.ts`: after the existing `pool_sv2` daemon, `.addDaemon('ui', { subcontainer: caddySub, requires: ['primary'] })`
4. Add a second `MultiHost` interface for port 80 with `type: 'ui'`

**Parallel track:** open an upstream PR adding a feature-gated `--ui` flag using `rust-embed` + `axum` route on the existing monitoring server. Once merged, retire the sidecar. This lets us ship a UI now without blocking on upstream review.

## See also

- [[2026-05-21-startos-multi-container-pattern]] — daemon multiplexing reference
- [[../docs/2026-05-21-sv2-monitoring-http-api]] — what the API already exposes
- [[../repos/2026-05-21-stratum-mining-sv2-ui-upstream]] — possibly bundleable upstream UI

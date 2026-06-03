---
title: "stratum-apps/Cargo.toml on feat/iroh-transport: feature flags and iroh deps"
type: repos
source: "https://github.com/average-gary/sv2-apps/blob/feat/iroh-transport/stratum-apps/Cargo.toml"
date: 2026-06-03
quality: 5
credibility: high
relevance: direct
direction: supports
evidence_strength: "direct-code-inspection"
tags: [iroh, sv2-apps, fork-survey, cargo, feature-flags, iroh-1.0-rc.1]
summary: "Iroh is wired in as an OPTIONAL feature (`iroh-transport`); upstream's plain TCP build is unaffected unless the feature is enabled, mitigating much of the divergence risk."
---

## Key dependencies added

```toml
# Transport-trait abstraction (always required; used by `network_helpers::transport`).
async-trait   = { version = "0.1" }

# Iroh transport optional dependencies
iroh          = { version = "1.0.0-rc.1", default-features = false, features = ["tls-ring"], optional = true }
iroh-base     = { version = "1.0.0-rc.1", default-features = false, optional = true }
iroh-mdns-address-lookup     = { version = "0.3", optional = true }   # LAN mDNS discovery
iroh-mainline-address-lookup = { version = "0.3", optional = true }   # BitTorrent mainline DHT
arc-swap      = { version = "1.7",  optional = true }
data-encoding = { version = "2.6",  optional = true }
```

## Feature flags introduced

```toml
# Iroh transport (alternative to plain TCP for SV2 connections)
iroh-transport = [
    "dep:iroh",
    "dep:iroh-base",
    "dep:iroh-mdns-address-lookup",
    "dep:iroh-mainline-address-lookup",
    "dep:arc-swap",
    "dep:data-encoding",
    "network",
]

# Iroh transport with Prometheus observability.
iroh-transport-monitoring = ["iroh-transport", "monitoring"]
```

The `default = ["network", "fallback-coordinator", "config", "std"]` set is **unchanged**, meaning a stock build of the fork produces the same binary surface as upstream. Iroh is purely additive behind a feature flag.

`pool-apps/pool/Cargo.toml` mirrors the pattern — its `iroh-transport = ["stratum-apps/iroh-transport", "jd_server_sv2/iroh-transport"]` propagates through.

## Notable choices

- Iroh is pinned at **1.0.0-rc.1** (Release Candidate, not 1.0 final). One commit (`9084fc70`) ports from `0.91 → 1.0.0-rc.0`; another (`c5c35c8e`) bumps to `rc.1`. Maintainer has tracked at least two iroh API breaks, indicating willingness to chase the moving target.
- `default-features = false, features = ["tls-ring"]` — explicit TLS backend pick, avoids dragging native-tls.
- DHT was decoupled in iroh 1.0-rc and re-introduced here via `iroh-mainline-address-lookup` 0.3 — matches the commit "iroh(discovery): wire mDNS local + mainline DHT, both on by default."
- `arc-swap` for lock-free admission policy reads (per `iroh/admission.rs`).

## Implication for thesis

Strongly supports the "easy to deploy" thesis variable in one specific sense: a StartOS package can build the fork with `--features iroh-transport` for the full iroh stack, or build without it to get a normal TCP-only sv2-apps that's bit-identical to upstream behaviour. The optional-feature framing is also exactly the shape a future upstream PR would take — it's not a destructive rewrite. Counter-signal: depending on `iroh = "1.0.0-rc.1"` (a release candidate) means the StartOS package will need rebuilds when iroh GAs and breaks API again.

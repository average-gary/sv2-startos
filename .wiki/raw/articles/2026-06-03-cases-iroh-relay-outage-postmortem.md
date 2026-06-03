---
title: "Iroh Relay Outage Post-Mortem (Nov 2024) — n0 first outage"
type: articles
source: "https://www.iroh.computer/blog/relay-down-a-post-mortem"
date: 2026-06-03
quality: 5
credibility: high
relevance: direct
direction: nuances
evidence_strength: "maintainer-statement"
tags: [iroh, p2p, relay, outage, postmortem, reliability, case-study]
summary: "n0's only public outage post-mortem: the relay infrastructure that iroh peers fall back to when hole-punching fails went fully down for ~6h on 5 Nov 2024 due to memory leaks, log-disk exhaustion, and a 12h detection delay."
---

# Iroh Relay Outage Post-Mortem — November 2024

This is the only published incident report from n0/iroh, the company that maintains the iroh transport that `average-gary/sv2-apps@feat/iroh-transport` depends on. It is directly relevant to the StartOS deployment thesis because StartOS users sit behind home NATs — exactly the population that needs hole-punching, and exactly the population whose connections fall back to n0's public relay mesh when hole-punching fails.

## Timeline (5 Nov 2024)

| Time (GMT) | Event |
|---|---|
| 11:00 | Degraded performance begins (unnoticed) |
| 17:00 | Complete failure of new hole-punched connections |
| 22:50 | n0 team discovers the issue (~12h after onset) |
| 23:01 | Service restored (server capacity 4x'd, logs cleared) |

## Root cause chain

1. Traffic surged on relay servers handling ~100k concurrent connections.
2. Memory accumulated without being released — n0 explicitly notes "Rust's memory safety guarantees do not mitigate memory leaks." Two leaks were later identified in Tokio task and thread management.
3. Connection failures triggered excessive logging.
4. Unbounded logs filled disk, blocking automated recovery.
5. No alerting was in place — the team did not notice the degradation for ~12 hours.

## Impact scope

- Existing direct (hole-punched) connections: unaffected.
- Existing relayed connections: unaffected.
- New connections requiring hole-punch coordination or relay: **broken** for ~6 hours of total failure plus several hours of degradation.

## Remediation (post-incident)

- Added alerting and metrics (had none before).
- Migrated underpowered relay infrastructure.
- Added load-shedding.
- Ran load-simulation, which surfaced the two Tokio leaks.

## Implication for thesis

**Nuanced — leans against on the operational side.** Three things matter for the StartOS thesis:

1. **Single-vendor relay dependency is real.** A StartOS box behind CGNAT or a strict NAT, running an iroh-backed SV2 service, would have lost the ability to accept *new* peer connections during this window. Existing flows survived, which is the saving grace for a long-lived mining proxy connection — but pool-discovery / new-peer-onboarding would have stalled.
2. **n0's operational maturity in Nov 2024 was low** — no alerting, no load-shedding, no metrics on the relay path. They have since fixed this, but the incident is from ~18 months before the proposed StartOS shipping window. The "first outage" framing implies a young ops practice.
3. **The fallback story matters more than peak performance.** For a service shipped to non-technical Bitcoin users who don't read post-mortems, an outage of n0-operated infrastructure is functionally identical to "my mining went down" — and n0 is one company. Compare to Tor (decentralized directory authorities + thousands of relays) or Tailscale (commercial SLA with redundant DERP).

This is not disqualifying — Tailscale, Cloudflare, and AWS all have public outages. But it is the strongest single piece of evidence that the iroh transport adds an external dependency whose reliability StartOS users will inherit without consenting to it.

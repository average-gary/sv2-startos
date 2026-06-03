---
title: "n0-computer/iroh — repo health, v1.0.0-rc.1 release"
type: repos
source: "https://github.com/n0-computer/iroh"
date: 2026-06-03
quality: 5
credibility: high
relevance: direct
direction: supports
evidence_strength: "production-data"
tags: [iroh, repo-health, license, v1.0, n0-computer]
summary: "Iroh hit v1.0.0-rc.1 on 2026-05-27 with 8.7k stars, dual MIT/Apache-2.0 license, and active maintenance — the project is past the 'experimental' phase and approaching API stability."
---

## Repo metrics (snapshot 2026-06-03)

- **Stars**: 8,672
- **Forks**: 415
- **Open issues**: 140
- **License**: dual MIT / Apache-2.0 (StartOS-compatible)
- **Latest pushed**: 2026-06-03 (active daily)
- **Latest release**: `v1.0.0-rc.1 — "The last one"` published 2026-05-27 (one week before research)
- **Tagline**: "IP addresses break, dial keys instead. Modular networking stack in Rust."

## v1.0.0-rc.1 highlights

- "Configurable path selection" lands as a breaking change.
- "Noq patch to support holepunching when server is behind a hard NAT (#4254)" — symmetric-NAT-on-server case fixed.
- Updated to noq@1.0.0-rc.1 (n0's own QUIC implementation).
- Endpoint closing is now near-instant when peer already closed remotely; ~1 RTT otherwise.
- Stability fixes for `RemoteStateActor` race conditions surfaced under load (issue #4265).
- Note: `unstable-custom-transports` features are explicitly NOT covered by 1.0 stability guarantees.

## Companion projects (same org)

- `n0-computer/sendme` — 1,031 stars, Apache-2.0, scp-replacement built on iroh-blobs.
- `n0-computer/dumbpipe` — 627 stars, Unix-pipes-between-devices.
- `n0-computer/iroh-blobs`, `iroh-gossip`, `iroh-docs`, `iroh-roq` — pluggable protocols.

## Implication for thesis

Repo health is **a positive signal for the thesis**: an actively-maintained, dual-licensed, near-1.0 Rust networking library is a defensible foundation for a Start9 service. The rate of breaking changes between 0.95 → 1.0 (multiple per release) means sv2-apps' choice to track `feat/iroh-transport` has dependency-pinning implications, but post-1.0 the surface should stabilize. Critically, **1.0 ships without symmetric-NAT mitigation** — that's deferred to post-1.0 work. So at the moment the StartOS app would be deploying on, the long-tail-NAT story is still weak.

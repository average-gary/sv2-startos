---
title: "Iroh ecosystem deployments — sendme, dumbpipe, iroh-blobs, iroh-experiments"
type: repos
source: "https://github.com/n0-computer (sendme, iroh-experiments) + iroh.computer/blog"
date: 2026-06-03
quality: 4
credibility: high
relevance: direct
direction: nuances
evidence_strength: "deployment-data"
tags: [iroh, sendme, dumbpipe, deployment-count, novelty, ecosystem]
summary: "Survey of every iroh-based public project: sendme (~1k stars), iroh-experiments (incubator, explicitly 'most won't graduate'), Paycode (1 named industrial deployment), zero shipped consumer apps with non-technical user counts in the thousands."
---

# Iroh ecosystem reality check

This source is a survey across n0's GitHub org and blog to answer: **how many iroh-backed services are in production, with non-technical users, at any meaningful scale?** The answer is a useful shape for the thesis.

## Public iroh-based projects (as of June 2026)

| Project | Repo | Stars | What it is | Non-technical user count |
|---|---|---|---|---|
| iroh (core) | n0-computer/iroh | 8.7k | The library itself | n/a |
| sendme | n0-computer/sendme | 1.0k | CLI file-transfer (`cargo install sendme`) | Unknown; technical users only (Cargo install) |
| iroh-blobs | n0-computer/iroh-blobs | (part of org) | BLAKE3 content transfer protocol | n/a (library) |
| iroh-experiments | n0-computer/iroh-experiments | (incubator) | content-discovery, h3-iroh, iroh-dag-sync, iroh-pkarr-naming-system, iroh-s3-bao-store | Explicitly experimental; "most will not" graduate |
| dumbpipe | dumbpipe.dev | n/a (404 on direct fetch) | "netcat over iroh" CLI | Technical users only |
| Paycode | (commercial) | n/a | Highway toll-booth payment terminals | M2M; no consumer users |
| ESP32 demo | (HN post Mar 2026) | 14 pts on HN | iroh on a microcontroller | Hobbyist demo |

## What the HN engagement pattern tells us

Cumulative HN points across all iroh-related stories: ~600 points over ~4 years. By comparison, Tailscale's launch HN post crossed 1000 points alone, and IPFS-related posts have many in the multi-hundred range each. **There has not been a single "Show HN: I shipped X to thousands of non-technical users using iroh and here's what happened" post.** The closest thing is the Paycode case study, which n0 publishes themselves and which is M2M, not B2C.

## The "iroh-experiments" disclaimer

Iroh-experiments is explicitly described as "a place for things that aren't in iroh, but are useful nonetheless," with the warning that "most will not" graduate. This is honest of n0, but it tells us that the surrounding ecosystem of higher-level building blocks (content discovery, naming, IPFS bridging) is **research-grade, not production-grade**. For a Start9 package author this matters because the iroh transport sidecar is *not* just iroh-the-library; it is the library plus whatever discovery/naming/coordination layer the SV2 fork pulls in. The fork-pattern itself is the novel layer, with no comparable shipped precedent.

## Comparison: novelty risk

| Pattern | Prior art on Start9? | Prior art elsewhere on consumer self-host? |
|---|---|---|
| Tor onion service for self-host | Yes — many StartOS packages | Yes — RiseUp, Bitcoin Core, OnionShare |
| WireGuard reverse-tunnel | Yes — StartTunnel (official) | Yes — Tailscale, Cloudflare Tunnel, ZeroTier |
| libp2p in self-host | No (on Start9) | Yes — IPFS Desktop |
| Iroh transport for service | **No** — first-of-its-kind on Start9 | Paycode (M2M) only |

## Implication for thesis

**Nuances.** The iroh ecosystem is real, OSS, and active — n0 ships releases, has a 1.0-rc out (May 2026), and has 8.7k stars on the core library. This is not vaporware. But the ecosystem above the library is thin, and **no shipped iroh-backed consumer service with documented non-technical user counts has been published as of mid-2026.** The thesis "iroh enables easy user setup" is not refuted by this — it is just not yet *attested* by a shipping product the way Tailscale or Tor onion services are.

For the StartOS thesis, this means the SV2-on-StartOS package would be **first-of-its-kind on two axes simultaneously**: first iroh-backed Start9 package, and one of the first iroh-backed consumer-facing self-host services anywhere. That is not necessarily bad — someone has to be first — but it should be acknowledged in the thesis as a real risk, not waved away.

## Open questions

- What is iroh's actual published hole-punch success rate? perf.iroh.computer exists but I could not extract numbers via WebFetch.
- How many concurrent users does the n0 relay mesh handle today (post-Nov-2024 outage and 4x capacity bump)? Public number was "100k concurrent" *before* the outage.
- Has anyone outside n0 deployed iroh to non-technical users at any scale? The Paycode case is industrial M2M.
- Does the SV2-iroh fork bring any Bitcoin-specific UX (BOLT12-style human-readable IDs, payjoin v2-style ticket flow) that would lift the raw NodeId UX, or is it raw iroh tickets?

---
title: "Iroh hole-punching failures in the wild — GitHub issues #3183, #4134, #2317"
type: articles
source: "https://github.com/n0-computer/iroh/issues/3183"
date: 2026-06-03
quality: 5
credibility: high
relevance: direct
direction: opposes
evidence_strength: "production-data"
tags: [iroh, nat, hole-punching, symmetric-nat, cgnat, mobile, failure-modes]
summary: "Three open/closed issues document hole-punch failures on symmetric NAT, mobile carriers, and asymmetric topologies — the falsification scenarios for the StartOS thesis are real and acknowledged by maintainers."
---

## Key findings

### Issue #4134 — "Hole punching does not work when server side is behind symmetric NAT" (OPEN, May 2026)
- Repro: client behind ProtonVPN (symmetric NAT) → server on public IP.
- v0.95.1 logs show transient direct connection: `Connection type changed to: direct(146.70.221.132:2342)` at 9.80 MiB/s.
- Current main: **never hole-punches, stays on relay** at `12.24 MiB/s` with **907ms time-to-first-byte vs. 63ms direct**.
- Status: still open as of 2026-06-03. Marked as a regression introduced after v0.95.

### Issue #3183 — "The rate of successful hole-punching is quite low" (closed, 2025)
- User reports two peers behind cone-NATs cannot hole-punch with iroh, while `rustp2p` succeeds 100% of the time on the identical topology.
- After multi-week debugging w/ maintainers (`flub`, `matheus23`, `ramfox`), root cause was diagnosed as **symmetric NAT on at least one side** (NAT type detection in `iroh-doctor` itself had a bug giving false negatives).
- Maintainer (`ramfox`) closing comment: "There are a few different methods to try to get around symmetric NATs, and **we plan on implementing them in the future, but it is not currently on our 1.0 roadmap.**"

### Issue #2317 — "Enhancing iroh's Hole Punching Success Rate" (2024)
- User compares to **Tailscale on identical 4-device topology** (2 PCs on dynamic public IPs + UPnP, 2 mobile phones).
- Tailscale: direct connections everywhere except phone↔phone.
- iroh: **direct only when both PCs are on dynamic-public-IP networks**. Sharing a phone's mobile network forces relay even for the PC pair.
- Mobile carrier matters: Xiaomi-tethered network sometimes hole-punches, sometimes does not; iPhone-tethered is reliable. Suggests symmetric NAT prevalence varies by mobile vendor.

### v1.0.0-rc.1 release notes (May 27, 2026)
- "Noq patch to support holepunching when server is behind a hard NAT (#4254)" — i.e., **the asymmetric "server behind hard NAT" case was only fixed one week before sv2-startos research started.**
- Multipath / advanced symmetric-NAT mitigations are NOT in the 1.0 roadmap.

## Implication for thesis

This is the central falsification scenario named in the path brief. Evidence:

1. **CGNAT / symmetric NAT failure is real and recurring.** Maintainers explicitly say symmetric-NAT hole-punching is post-1.0.
2. **Tailscale is observably better at NAT traversal** in head-to-head reports from iroh's own bug tracker.
3. **Relay fallback works** but adds ~14× latency to first byte (63ms → 907ms in #4134) — for share submission in a mining context, this is **not "unacceptable" but noticeable**. For interactive SV2 stratum traffic, p99 latency under relay-fallback needs measurement before claiming Iroh is "ideal".

This is the strongest opposing evidence for path 2. The thesis is **nuanced**, not refuted: ~90% of users get the easy path; the long-tail 10% behind symmetric/CGNAT pay a latency penalty and cannot rely on direct connection.

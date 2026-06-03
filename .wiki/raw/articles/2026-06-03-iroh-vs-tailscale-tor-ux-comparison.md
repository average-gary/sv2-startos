---
title: "Iroh vs Tailscale vs Tor v3 — UX and NAT-traversal comparison"
type: articles
source: "https://tailscale.com/blog/how-nat-traversal-works"
date: 2026-06-03
quality: 4
credibility: high
relevance: direct
direction: nuances
evidence_strength: "third-party-blog"
tags: [iroh, tailscale, tor, comparison, ux, nat-traversal, share-artefact]
summary: "On share-artefact length Iroh (~52 chars EndpointID) ties Tor v3 onion (~56 chars); on hole-punch reliability Iroh trails Tailscale per iroh's own issue tracker."
---

## Share-artefact comparison

| System         | What user shares                                | Length  | Notes |
| -------------- | ----------------------------------------------- | ------- | ----- |
| Tor v3 onion   | `xxxxx…xxxxx.onion` (56 chars + `:port`)        | ~62     | 256-bit Ed25519 pubkey + version + checksum, base32 |
| Iroh EndpointID (with discovery) | z32-encoded Ed25519 pubkey      | ~52     | requires DNS pkarr / DHT / mDNS reachability |
| Iroh full ticket | typed-prefix + base32 endpoint info          | 128–296 | leaks every interface IP unless filtered |
| Tailscale MagicDNS | `<host>.<tailnet>.ts.net`                   | ~25–40  | requires Tailscale account / coordination server |
| Clearnet IP+port | `1.2.3.4:8443`                              | ~21     | requires DDNS + port-forward + cert |

## NAT-traversal comparison

- **Tailscale's own claim** (engineering blog "How NAT traversal works"): "you could get a direct connection over 90% of the time" with basic techniques; relays guarantee connectivity for the rest. With **two symmetric NATs** the birthday-paradox math drops success to ~0.01% in 20s.
- **Iroh's own claim** (docs/concepts/nat-traversal): "roughly 9 out of 10 network configurations allow a direct connection."
- **Head-to-head report** (iroh issue #2317, user testing on identical hardware): Tailscale establishes direct PC↔PC across mobile-tethered networks where iroh falls back to relay. Maintainers confirm symmetric-NAT mitigation is **not in iroh's 1.0 roadmap**.
- **Tor**: hole-punching not applicable — Tor onion services always work over Tor's circuits regardless of NAT, at the cost of ~hundreds of ms latency per hop.

## Latency / behaviour notes

- iroh issue #4134 (open as of 2026-06-03): when relay fallback is used, time-to-first-byte was **907 ms vs 63 ms direct** for the same workload — a **~14× latency penalty** for users who can't hole-punch.
- Iroh relay nodes (n0 default): `aps1-1.relay.iroh.network`, `euw1-1`, `use1-1`. Three regions. No published SLA. Alternate self-hosted via `iroh-relay` binary.
- Both Iroh and Tailscale do **connection migration** — flow survives IP changes. Tor onion services do not migrate (HS descriptors are sticky to the keypair, not to IP, so this is implicit).

## Implication for thesis

The thesis "Iroh enables easy user setup" benchmarks against three different status-quos:

- **vs Tor v3 onion**: roughly **a wash** on share-artefact length; Iroh has lower steady-state latency when hole-punch succeeds; Tor has 100% reliability across all NAT types. For mining share submission, latency matters → Iroh is **categorically better when it works**, neutral or worse when it falls back to relay.
- **vs port-forward + DDNS**: Iroh is **clearly easier** — no router config, no cert provisioning, survives IP change. This is a strong support point for the thesis.
- **vs Tailscale**: Tailscale wins on UX (shorter MagicDNS names, better hole-punching) but loses on sovereignty (requires Tailscale's coordination server / account). Iroh's pkarr-based discovery is the closer-to-Tailscale-but-decentralized story.

**Net**: thesis is supported when the alternative is port-forwarding, nuanced when the alternative is Tor v3, and weakly opposed when the alternative is Tailscale. For Start9's privacy-conscious user base, "Tor v3 already works fine" is the realistic comparator.

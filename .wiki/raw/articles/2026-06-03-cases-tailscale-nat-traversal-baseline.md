---
title: "Tailscale 'How NAT Traversal Works' — the consumer-overlay UX baseline"
type: articles
source: "https://tailscale.com/blog/how-nat-traversal-works"
date: 2026-06-03
quality: 4
credibility: high
relevance: indirect
direction: opposes
evidence_strength: "third-party-blog"
tags: [tailscale, nat, holepunching, derp, overlay, ux, comparison]
summary: "Tailscale's canonical NAT-traversal post — frames the engineering baseline (~90% direct, the rest via DERP) that any iroh deployment for non-technical users is implicitly compared to, and Tailscale has shipped this UX to millions while iroh has not."
---

# Tailscale's NAT-traversal baseline — the consumer overlay that already won

Tailscale's "How NAT Traversal Works" post, by David Anderson, is the most cited single piece on consumer-grade NAT traversal. It is directly relevant to the StartOS/iroh thesis because Tailscale has already solved the problem the iroh transport claims to solve — exposing a self-hosted service to peers across NAT boundaries — and shipped it to millions of non-technical users.

## Key claims (from the post)

- With a complete NAT-traversal toolkit (STUN, simultaneous-open, port-mapping protocols UPnP/NAT-PMP/PCP, IPv6 fallback, ICE-style candidate selection, and the "birthday paradox" approach for hard NATs), a developer "could get a direct connection over 90% of the time."
- Tailscale's DERP relay is positioned as the safety net for the remaining ~10% — including any network that "blocks UDP entirely."
- Tailscale's actual measured success rate is not in the post, but the architecture (a global mesh of DERP relays operated by Tailscale Inc.) is described.

## Why this is the relevant comparison for StartOS

| Property | Tailscale | n0/iroh |
|---|---|---|
| Hole-punch technique | STUN+ICE+UPnP+IPv6+birthday paradox | QUIC-based DCUTR-style holepunch |
| Relay operator | Tailscale Inc. (commercial) | n0 (small Rust shop) |
| Relay coverage | Multi-region DERP mesh | n0 relay mesh |
| Public reliability data | Status page, SOC2 | One outage post-mortem, perf.iroh.computer |
| Consumer onboarding | Email signup → install → magic | Paste 60-byte ticket |
| Non-technical user count | Millions (Tailscale Inc claims) | Unknown; likely <10k of self-hosters |
| SLA | Yes (commercial tiers) | None |
| OSS | Headscale (3rd-party server) is OSS; client OSS | Fully OSS (Apache+MIT) |

## What Tailscale got right that iroh doesn't yet have

1. **Onboarding-as-account-flow.** Tailscale's UX is "click a thing, log in, you're on the tailnet." iroh's UX is "the developer hands you a ticket, you paste it." For a Bitcoin miner using StartOS, the iroh UX is closer to the existing Tor onion-pasting mental model — which works for Bitcoin users but is *not* what Tailscale-style consumers expect.
2. **Identity model.** Tailscale's identity is your existing Google/Microsoft/GitHub login. iroh's identity is a NodeId (a public key the user never sees a name for). For a non-technical user, "who am I connecting to?" is harder to answer with iroh.
3. **Operational maturity.** Tailscale operates at scale. n0's first outage was ~18 months ago (Nov 2024). For a service that StartOS users will leave running for months, operational maturity of the relay operator is load-bearing.
4. **MagicDNS / human-readable naming.** Tailscale gives you `mining-rig.tail-net.ts.net`. iroh gives you a ~52-character base32 NodeId. For SV2's "share this with the pool" use case the NodeId is fine; for a generic self-host UX it is not.

## What iroh has that Tailscale doesn't (steelman)

- **Fully OSS by default**, no commercial license tiers, no proprietary control plane.
- **No central account** — a NodeId is generated locally; no Tailscale Inc. equivalent exists.
- **Dial-by-key** maps cleanly onto Bitcoin/SV2 mental models where keys are already first-class.
- **No login.** For users who refuse third-party accounts (a meaningful fraction of the self-host audience), this is a hard requirement that Tailscale literally cannot meet (Headscale exists but adds setup burden).

## Implication for thesis

**Opposes — but partially.** Tailscale represents a shipped, working consumer overlay for the same UX problem. If "easy user setup" is the load-bearing claim of the StartOS/iroh thesis, Tailscale is the existence proof that the problem is *already solved* for non-Bitcoin self-hosters — making iroh's pitch "we solve this without the commercial vendor and without the login." That is a real positioning, but it is a *narrower* claim than "iroh is the ideal overlay for StartOS."

The honest framing: iroh wins on "no third-party account, no commercial vendor, key-based identity that matches Bitcoin culture." Iroh loses on "operational maturity, naming, onboarding ergonomics, scale-tested relay infrastructure." For SV2 specifically — a Bitcoin-native, key-already-present audience — the win/loss balance favors iroh. For StartOS generically, Tailscale-style is closer to what consumers expect.

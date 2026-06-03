---
title: "Start9 StartTunnel — official Start9-maintained WireGuard VPN as the canonical 'remote access' answer"
type: repos
source: "https://github.com/start9labs/start-tunnel"
date: 2026-06-03
quality: 4
credibility: high
relevance: direct
direction: opposes
evidence_strength: "deployment-data"
tags: [start9, startos, wireguard, vpn, overlay, prior-art, ux]
summary: "Start9 ships an official WireGuard-based reverse-tunnel tool (StartTunnel) as their answer to the 'expose my self-hosted service to the internet' problem — direct evidence that Start9 has already chosen WireGuard, not a P2P overlay, for self-host UX, and an Iroh-on-StartOS package would be first-of-its-kind."
---

# StartTunnel: Start9's chosen self-host overlay

StartTunnel (`Start9Labs/start-tunnel`) is the Start9-maintained, officially supported tool for "exposing a StartOS service to the internet without port-forwarding". This is **the same UX problem an iroh transport solves** — and Start9 has already shipped an answer.

## What StartTunnel is

- Self-hosted WireGuard VPN, deployed on a user-owned VPS (Debian 12+).
- Web UI initialized via `start-tunnel web init`.
- Designed for reverse-tunneling personal servers behind NAT to a clearnet IP the user controls.
- Explicitly positioned as a privacy-respecting alternative to Cloudflare Tunnel and Tailscale.

## What this means for the thesis

This is the most important single data point against the "iroh is the natural fit for StartOS" framing, for three reasons:

### 1. Start9 has already made an architectural choice for the same problem

The problem the iroh transport claims to solve for SV2 is structurally identical to "expose a service from behind NAT" — the problem StartTunnel solves. Start9's chosen solution is **WireGuard with a user-owned VPS endpoint**, not a P2P overlay. That is a deliberate architectural decision, repeated across their stack. An iroh-backed package would be introducing a *fourth* connectivity model to the platform (`.local` / Tor / StartTunnel-WireGuard / iroh-relay-mesh), each with its own failure modes and user-facing strings.

### 2. The "user-owned infrastructure" pattern is the StartOS aesthetic

StartTunnel requires the user to own a VPS. This is *more* friction than iroh ("just paste a ticket"), but it aligns with the broader Start9 pattern of "the user owns every component." Iroh's relay fallback violates this: when hole-punching fails, the connection runs through n0-operated infrastructure that the user does not control and cannot replace without shipping a custom relay roster. (Iroh does support BYO relays, but no StartOS package documentation attests to this configuration.)

### 3. Start9 has 1,871 stars on start-os; 146 repos; zero of them mention iroh

A targeted search across Start9Labs' GitHub org surfaces no iroh, libp2p, or P2P-overlay code. The platform's overlay vocabulary is `.local` mDNS, Tor onion services, and WireGuard. Shipping an iroh-transported SV2 package would be **first-of-its-kind on Start9** — there is no prior art for an iroh-backed Start9 service package. This is novelty risk: package authors, reviewers, and users would all be exercising a new code path with no in-platform precedent.

## Counter-argument (steelman)

StartTunnel solves a different problem at a different cost:
- Requires a VPS (cost + setup).
- Requires WireGuard client install on every device that wants to reach the service.
- Doesn't help with peer-to-peer flows where both ends are home boxes (e.g., two miners pooling).

Iroh genuinely beats StartTunnel on the *peer-to-peer-between-two-home-boxes* axis. If the SV2 use case is "my StartOS box talks to *your* StartOS box," then StartTunnel is the wrong tool and iroh is the right one. But if the SV2 use case is "my StartOS box talks to a public pool," StartTunnel-style "the pool runs a public endpoint, I just connect" is the simpler model and is already supported.

## Implication for thesis

**Opposes the strong form of the thesis** ("iroh is the *ideal* candidate"). The thesis needs to either:
- Show that the SV2 use case requires P2P-between-home-boxes (not just remote access), which would justify iroh over StartTunnel, OR
- Acknowledge that the iroh transport is a novelty on Start9 and budget for the integration work that established overlays (Tor, WireGuard) get for free from existing Start9 docs and patterns.

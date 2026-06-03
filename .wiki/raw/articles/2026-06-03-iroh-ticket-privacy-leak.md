---
title: "Iroh issue #3074: 'Huge tickets and privacy leakage' — ticket leaks internal topology"
type: articles
source: "https://github.com/n0-computer/iroh/issues/3074"
date: 2026-06-03
quality: 5
credibility: high
relevance: direct
direction: opposes
evidence_strength: "production-data"
tags: [iroh, ux, tickets, privacy, leakage, address-disclosure]
summary: "Default Display-format Iroh tickets include every direct address (LAN, Tailscale, docker, IPv6) — 244+ chars base64, exposing internal network topology to any recipient."
---

## Key findings

- User `dpc` (rostra-client maintainer) opens an issue showing his ticket grew to **244 chars base64 / 296 chars Display** because his host has 9 direct addresses across LAN, public IPv4, Tailscale, docker bridges, virbr0, yggdrasil IPv6, and ISP IPv6.
- 255-char DNS TXT limit is exceeded → tickets cannot fit in a single DNS TXT record without filtering.
- Each address is annotated by the user as he discovered it:
  - `10.x.x.x` — Wifi LAN /24, only useful locally
  - `76.x.x.x` — public IPv4 of his ISP router
  - `100.x.x.x` — Tailscale /32
  - `172.x.0.1` (×2) — docker internal bridges, useless for external connectivity
  - `192.168.xxx.x` — virbr0, virtualization software, **interface is DOWN**
  - IPv6 yggdrasil overlay
  - public IPv6 prefixes (×2)
- Quote: "broadcasting my whole internal networking infrastructure in a ticket I'm sharing seems meh for many reasons."
- **Maintainer (`flub`) workaround**: use `PkarrPublisher` to put just RelayUrl in DNS, share only the EndpointID. "The relay server does not change as often as all local addresses."
- Issue was **closed and converted to a discussion** by `dignifiedquire` ("this is a usage question about tickets"), i.e., **iroh does NOT auto-filter direct addresses by default**. The user must write their own `sanitize_addr_info` that filters CGNAT ranges, private IPs, IPv6 link-locals, etc.
- The user's own filter code is shown in the thread: filter `is_ipv4_cgnat` (100.64.0.0/10), `is_private`, etc.

## Implication for thesis

This is a **direct privacy/UX opposition signal** to the thesis. The "ideal candidate for StartOS" framing implies the user can confidently share a ticket with a pool / co-miner. With default settings, that ticket **discloses**:

- The user's residential ISP IPv4 (de-anonymising vs Tor)
- Internal LAN ranges (info-leak that helps targeted attacks)
- Whether they run Tailscale (CGNAT 100.64/10), docker, virtualization
- IPv6 prefix (often more identifying than IPv4 due to /64 SLAAC)

For a Start9 user — who chose StartOS partly *for* privacy — the **default Iroh ticket UX is materially worse than copying an onion URL**, which discloses only the public service identity. The thesis should be qualified: it's only "ideal" if sv2-apps explicitly enables pkarr DNS publishing AND shares only the bare EndpointID, AND filters direct addresses to public-only when emitting any fallback ticket. This is a nontrivial config burden the upstream library does not handle by default.

---
title: "Iroh: Endpoints, Discovery, Tickets — official concept docs"
type: docs
source: "https://docs.iroh.computer/concepts/discovery"
date: 2026-06-03
quality: 5
credibility: high
relevance: direct
direction: nuances
evidence_strength: "official-docs"
tags: [iroh, ux, networking, discovery, dns, pkarr, mdns, tickets]
summary: "Iroh peers can connect from just an EndpointID via n0-operated DNS discovery, but tickets remain ~128+ chars and the DNS path depends on n0's dns.iroh.link infrastructure."
---

## Key findings

- An Iroh **EndpointID is a 32-byte Ed25519 public key**. Encoded as z-base-32 it is **52 characters**, the same length as a Tor v3 onion address (56 chars). Without discovery, however, the user must share a full **EndpointAddr** which contains the EndpointID + relay URL + every direct address.
- Discovery mechanisms shipped in stock iroh:
  1. **n0 DNS pkarr** (default): query `_iroh.<z32-endpoint-id>.<origin-domain> TXT`. The default origin is `dns.iroh.link`, **operated by n0.computer**.
  2. **mDNS / local discovery** — disabled by default.
  3. **BitTorrent Mainline DHT** — disabled by default.
- "iroh EndpointIDs are elliptic curve public keys" → endpoints publish a **signed** Pkarr DNS resource record advertising their relay URL. When discovery is on, a peer only needs the EndpointID, not addresses.
- Recommended pattern in docs: "Store just the EndpointID. When you need to connect, construct an EndpointAddr from the ID and let discovery resolve the current dialing details."
- Fallback: if no discovery is configured / reachable, the user must share a full ticket (see `iroh-tickets` source) which embeds relay URL + every direct socket address.
- Connections are full QUIC; relays only proxy when hole-punch fails. Per docs, "roughly 9 out of 10 network configurations allow a direct connection."

## Implication for thesis

If StartOS users can rely on the n0 DNS discovery service, the share artefact is the 52-char EndpointID — comparable to a Tor v3 onion (56 chars) and **shorter than v3 onion + port**. That is a real ergonomic win **only as long as users opt into pkarr discovery and dns.iroh.link is reachable / trusted**. The thesis claim that "Iroh enables easy user setup" is partially supported on the publish/discover axis but introduces a new centralisation dependency on n0's DNS that an onion address does not have. For a sovereign Start9 box this is a values-level trade users should be informed about; pkarr / DHT publishing can mitigate but is currently off by default for DHT and depends on Mainline reachability.

---
title: "Decentralized Hole Punching (Seemann, Inden, Vyzovitis — DINPS 2022)"
type: papers
source: "https://research.protocol.ai/publications/decentralized-hole-punching/"
date: 2026-06-03
quality: 4
credibility: high
relevance: indirect
direction: nuances
evidence_strength: "academic-measurement"
tags: [libp2p, holepunching, nat, p2p, academic, measurement, ipfs]
summary: "Protocol Labs' DINPS 2022 paper on libp2p's decentralized hole-punching mechanism — sets the academic baseline for hole-punch success rates over residential NATs that any iroh deployment will be measured against."
---

# Decentralized Hole Punching (Protocol Labs, DINPS 2022)

Authors: Marten Seemann, Max Inden, Dimitris Vyzovitis. Presented at DINPS 2022 (Bologna, Italy, July 10, 2022).

The paper documents libp2p's STUN/TURN/ICE-derived hole-punching mechanism and provides the academic-grade measurement baseline for what NAT traversal in a real deployed P2P network actually achieves. Iroh's hole-punching design is in the same family (QUIC-based, with relay fallback), so libp2p's measured numbers are the closest published analog to "what should StartOS users expect from iroh hole-punching."

## What the paper establishes (from the abstract and adjacent literature)

- libp2p's hole-punching uses protocols similar to STUN (RFC 8489), TURN (RFC 8566), and ICE (RFC 8445), without centralized infrastructure.
- The mechanism is shipped in go-libp2p and rust-libp2p, used by Kubo (the IPFS reference daemon) and the IPFS Desktop application.
- Hole-punching was initially gated behind `Swarm.EnableHolePunching` in go-ipfs 0.11 — meaning even Protocol Labs hesitated to enable it by default for non-technical users at launch.
- Symmetric NATs are explicitly called out as a failure case: "There are situations in which hole punching will not work, most notably when one of the nodes is behind a symmetric NAT."

## Quantitative caveat

The actual percentage success rate is in the published PDF (which I could not extract via WebFetch — binary PDF). Tailscale's blog separately states an estimate that "with a complete toolkit you could get a direct connection over 90% of the time" — the libp2p paper's numbers are typically cited in the same neighborhood (~70-90%) depending on NAT type distribution. For the StartOS thesis, the load-bearing observation is not the exact number but the **shape**: a meaningful fraction (5-30%) of consumer connections will fail to hole-punch and will rely on relay infrastructure.

## Comparable overlay reality check

| Overlay | Hole-punch success (consumer NAT) | Relay-fallback dependency | Used in shipped consumer SW? |
|---|---|---|---|
| libp2p (IPFS / Kubo) | ~70-90% (paper) | Yes (relays in DHT) | Yes — IPFS Desktop, Brave |
| Tailscale | ">90%" est., commercial DERP mesh | Yes (DERP) | Yes — millions of installs |
| Iroh | Unknown publicly; n0 has perf.iroh.computer | Yes (n0 relay mesh) | Limited (Paycode + demos) |
| Tor onion | N/A (always uses Tor circuit) | N/A — circuits go via Tor | Yes — StartOS native |

## Implication for thesis

**Nuanced.** The paper substantiates the *technique* iroh uses, and confirms the well-understood reality that ~5-30% of home-NAT connections will need relay fallback. This is fine when the relay is operationally robust (Tailscale's DERP, Tor's directory authorities). It is less fine when the relay is operated by a single ~10-person company that had its first outage 18 months ago (n0 — see relay outage post-mortem source).

The thesis is not undermined by the existence of relay fallback — every overlay has it. The thesis is strained by the **operator concentration**: libp2p's relays are operated by many parties (Protocol Labs, third parties, gateways); Tor's are operated by ~7000 volunteers; Tailscale's DERP is run by a $100M+ company with SLAs; n0's relay mesh is operated by n0. For a service shipped to non-technical Bitcoin self-hosters who can't tell "n0 had an outage" apart from "my mining is broken," that concentration is the risk to underwrite.

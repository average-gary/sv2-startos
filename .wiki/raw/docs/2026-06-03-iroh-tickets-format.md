---
title: "Iroh: Ticket format and length (official concepts/tickets)"
type: docs
source: "https://docs.iroh.computer/concepts/tickets"
date: 2026-06-03
quality: 5
credibility: high
relevance: direct
direction: opposes
evidence_strength: "official-docs"
tags: [iroh, ux, tickets, copy-paste, encoding]
summary: "Stock iroh tickets are ~128+ character base32-lowercase strings packing relay URL plus all direct addresses; no native short-code mechanism exists."
---

## Key findings

- Tickets are **long base32-lowercase strings** with an ASCII type prefix (`doc`, `endpoint`, `blob`, `node`).
- Official example shown in the docs is **128 characters**:

  ```
  docaaacarwhmusoqf362j3jpzrehzkw3bqamcp2mmbhn3fmag3mzzfjp4beahj2v7aezhojvfqi5wltr4vxymgzqnctryyup327ct7iy4s5noxy6aaa
  ```

- Real-world capture from a fresh `dumbpipe listen` invocation (n0's own demo tool, see `iroh-dumbpipe-sendme-ux` source):

  ```
  nodeecsxraxjtqtneathgplh6d5nb2rsnxpfulmkec2rvhwv3hh6m4rdgaibamaeqwjaegplgayaycueiom6wmbqcjqaibavg5hiaaaaaaaaaaabaau7wmbq
  ```

  → **132 characters** with the `node` prefix. This is what a user actually copies to wire two machines together.

- Three components encoded:
  1. ASCII prefix indicating ticket type
  2. Postcard-encoded endpoint data: NodeId + relay URL + **every direct address (every interface, every protocol)**
  3. Optional application-specific data (doc IDs, blob hashes, etc.)

- **No short-code or short-URL native mechanism**. The only viewer is the ticket explorer at `ticket.iroh.computer`, which is a debug visualizer, not a shortener.

- Issue #3074 ("Huge tickets and privacy leakage") shows production users discovering that tickets can exceed **244 chars base64 / 296 chars Display** when a host has multiple interfaces (LAN, Tailscale, docker bridges, IPv6) — and that this **leaks internal network topology** to anyone receiving the ticket. The maintainer's recommendation was to use pkarr DNS publishing and only put RelayUrl in the ticket. That is a sound workaround but is not the default user experience.

## Implication for thesis

This is the strongest piece of evidence **against** the "Iroh = easy user setup" claim if discovery is not configured. **132-char copy-paste is materially worse than the 56-char Tor v3 onion** the user would otherwise share. Worse, the default Display ticket leaks every IP the host owns — a posture problem for a privacy-conscious StartOS user base. The ergonomic win the thesis claims only materialises if sv2-apps **(a) enables n0 DNS discovery by default and (b) instructs the user to share only the 52-char EndpointID**, not a Display-format ticket. The current sv2-apps fork should be examined for which path it takes.

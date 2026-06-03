---
title: "Iroh in practice: dumbpipe and sendme — actual end-user UX"
type: articles
source: "https://dumbpipe.dev"
date: 2026-06-03
quality: 4
credibility: high
relevance: direct
direction: nuances
evidence_strength: "official-docs"
tags: [iroh, ux, dumbpipe, sendme, copy-paste, cli]
summary: "n0's reference apps demonstrate the real UX: install + one CLI command yields a 132-char ticket the user pastes elsewhere — no accounts, no port-forwarding, but also no short codes."
---

## Key findings (dumbpipe — `n0-computer/dumbpipe`, 627 stars, Apache-2.0)

- Pitched as "Unix pipes between devices … no accounts, no configuration, regardless of where the two machines are."
- Install: one-line curl/iwr/cargo/brew.
- Receiver runs `dumbpipe listen`, output:
  > Listening. To connect, use: `./dumbpipe connect nodeecsxraxjtqtneathgplh6d5nb2rsnxpfulmkec2rvhwv3hh6m4rdgaibamaeqwjaegplgayaycueiom6wmbqcjqaibavg5hiaaaaaaaaaaabaau7wmbq`
- **The user copy-pastes a 132-character node ticket.** That is the entire pairing primitive.

## Key findings (sendme — `n0-computer/sendme`, 1031 stars, Apache-2.0)

- Pitched as "scp without needing to know the IP address."
- Three steps: `sendme send <path>` → ticket emitted → `sendme receive <ticket>`.
- Same ticket-shape primitive (typed prefix + base32 endpoint info).

## Comparison to status quo on Start9

| Approach              | Share artefact length | Infra dependency        | NAT traversal           |
| --------------------- | --------------------- | ----------------------- | ----------------------- |
| Tor v3 onion + port   | ~62 chars             | Tor network             | None needed (always works) |
| Clearnet IP + port    | ~21 chars             | DDNS / port-forwarding  | User configures router  |
| Iroh EndpointID only  | ~52 chars (z32)       | n0 DNS / pkarr / DHT    | ~90% direct, else relay |
| Iroh full ticket      | ~128–296 chars        | n0 relays               | ~90% direct, else relay |

## Implication for thesis

dumbpipe/sendme are the **strongest evidence Iroh-based apps are easier than Tor + port-forwarding for the operator** — there is genuinely zero router config and the apps survive IP changes. But **the share artefact is not categorically shorter than a Tor onion**: it is a wash on raw character count and a regression if the app emits a full ticket instead of a bare EndpointID. The thesis is supported on the "no port forwarding / no DDNS / survives network migration" axis, not on "shorter copy-paste". This is an important distinction for sv2-startos UI copy.

---
title: "SRI Discussion #1935: RFC Iroh [Noise] Connection — proposed but not engaged upstream"
type: repos
source: "https://github.com/stratum-mining/stratum/discussions/1935"
date: 2026-06-03
quality: 4
credibility: high
relevance: direct
direction: nuances
evidence_strength: "maintainer-statement"
tags: [sv2, sri, iroh, transport, rfc, upstream-engagement]
summary: "EthnTuttle filed RFC #1935 in the SRI Ideas category proposing iroh as an alternative SV2 transport with TcpStream-equivalent shape; as of 2026-06, only the author's own follow-up comment exists — zero maintainer or community response."
---

## What was proposed

Discussion #1935 in `stratum-mining/stratum` (Ideas category, 2025-10-03, opened by `EthnTuttle`):

> This design integrates [Iroh](https://www.iroh.computer/) peer-to-peer networking as an alternative transport layer for Stratum V2 connections by extending the network-helpers crate. Iroh replaces TCP at the transport layer while maintaining full compatibility with existing channel management logic and providing the same connection interfaces.
>
> The key insight is that Iroh serves as a drop-in replacement for TcpStream, allowing us to maintain the existing layered architecture:
> - **NoiseIrohStream**: Equivalent to NoiseTcpStream but using Iroh transport
> - **IrohConnection**: Equivalent to Connection but using NoiseIrohStream
> - **PlainIrohConnection**: Equivalent to PlainConnection but using Iroh directly
>
> All connection types return the same `(Receiver<StandardEitherFrame<Message>>, Sender<StandardEitherFrame<Message>>)` interface, ensuring zero changes are needed in channels-sv2 or any higher-level code.

The proposal includes a mermaid diagram showing the layering: existing channel layer → network_helpers → stream layer (NoiseTcpStream / NoiseIrohStream) → transport (TcpStream / Iroh BiStream). Five "Key Design Principles" are listed including "Transport Replacement", "Interface Compatibility", and "Zero Channel Changes".

The proposal is transport-agnostic in scope: pluggable transport selection (servers can listen on both, clients can choose). It does NOT mandate iroh — it proposes iroh as an additive option alongside TCP.

## Upstream engagement: zero

`gh api repos/stratum-mining/stratum/discussions/1935/comments` returns exactly one comment:

```json
{
  "user": {"login": "EthnTuttle"},
  "created_at": "2025-10-03T01:38:14Z",
  "body": "https://github.com/TABConf/7.tabconf.com/issues/83\nI plan on attending this talk to learn more hands on Iroh.\n\nhttps://fountain.fm/episode/bq98jfdTbReOt9dHZqAu\nThey discuss Fedimint's Iroh integration and have a technical overview of Iroh itself."
}
```

That is the *author of the RFC posting follow-up links to themselves*. No SRI maintainer (no Shourya742, no plebhash, no other regular committers visible in recent merge commits) has responded. No `+1`, `heart`, or other reactions on the original post (`reactions.total_count: 0`).

Cross-checked via `gh api search/issues?q=repo:stratum-mining/stratum+iroh` and `+QUIC`: zero issues, zero PRs. There is no upstream PR implementing the RFC, no ADR, no follow-up discussion thread in 8 months.

## Author identity vs. fork author

- RFC author: `EthnTuttle` (Ethan Tuttle, ID 133234413, bio mentions FOSS / nostr key)
- Fork author: `average-gary` (ID 165834679, location "shenandoah", bio "bitcoin")

Different humans. The RFC was filed independently of (and 6 months before) the fork's iroh-transport branch (first iroh commit 2026-05-23 on `bc51e1e2`, "stratum-apps: add iroh transport infrastructure"). The fork's commit messages explicitly cite "Per RFC #1935 discussion" — meaning the fork is the *implementation* of the RFC, not a parallel proposal.

## Implication for thesis

**The transport-pluggability *idea* has been on the table upstream since Oct 2025 and has gotten precisely zero traction with SRI maintainers.** That is itself a signal: either maintainers don't see iroh as a priority, or they have private reservations they haven't aired publicly, or they're waiting for a working PR. The fork is the working PR — but it's a working *fork*, not an upstream contribution.

For the StartOS package thesis, this matters in two ways:

1. **The fork is on its own.** No upstream commitment to maintain transport abstraction means the fork carries the integration cost forever, or until/unless SRI accepts the changes. Path 5 (maintainability) needs to weigh this carefully.

2. **No competing implementation.** No other firmware vendor or pool has filed a "we're working on iroh-SV2 too" issue. The fork is the only iroh-SV2 implementation in the wild as of 2026-06. This is bad for interop (no second endpoint to talk to in a non-Start9 ecosystem) and good for the fork's design freedom (no compatibility headaches with someone else's iroh-SV2 dialect).

The thesis "ideal candidate for StartOS" needs an upstream merge plan, OR a stomach for being permanently downstream of SRI. Neither is shown in #1935 yet.

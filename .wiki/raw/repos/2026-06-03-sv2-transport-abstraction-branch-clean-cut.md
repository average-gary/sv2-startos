---
title: "Fork feat/transport-abstraction: clean Sv2Connector/Sv2Listener trait separated from iroh"
type: repos
source: "https://github.com/average-gary/sv2-apps/tree/feat/transport-abstraction"
date: 2026-06-03
quality: 5
credibility: high
relevance: direct
direction: supports
evidence_strength: "code-inspection"
tags: [sv2, fork, transport-abstraction, sv2-connector, sv2-listener, traits, in-memory-transport]
summary: "The fork has a SEPARATE branch (feat/transport-abstraction) that adds the transport abstraction layer cleanly without iroh — a candidate for clean upstreaming, with in-memory transport pair already used in tests."
---

## The branch nobody talks about

`average-gary/sv2-apps` has TWO transport-related branches:

1. `feat/iroh-transport` — adds iroh transport on top of an abstraction layer.
2. `feat/transport-abstraction` — **just** the abstraction layer, no iroh.

The unique commits on `feat/transport-abstraction` (relative to `feat/iroh-transport`):

| sha | message |
| --- | --- |
| `74426367` | feat(stratum-apps): add transport abstraction layer for SV2 connections |
| `423288c0` | refactor(pool): use Sv2Listener / Sv2Connector for downstream and TP dial |
| `237225d1` | refactor(jd-server): use Sv2Listener for downstream listener |
| `c3477ad3` | refactor(jd-client): use Sv2Listener / Sv2Connector for listener and 3 dials |
| `76a3c7f9` | refactor(translator): use Sv2Connector for outbound SV2 pool dial |
| `3aa30c34` | docs(stratum-apps): note multi-transport listener helper as future work |
| `7a1297fd` | feat(stratum-apps): add in-memory transport pair for tests |
| `3d083677` | test(integration-tests): exercise in-memory transport pair via Mock fixtures |

`74426367` adds 448 lines of `transport.rs` plus 467 lines of `noise_generic_stream.rs` to `stratum-apps` — and that is the *entire* abstraction layer. No iroh dependency. The 4 role refactors then migrate each role's listener and dial sites onto the trait.

## Trait shape (from feat/iroh-transport's transport.rs, identical inheritance)

```rust
#[async_trait]
pub trait Sv2Connector<M>: Send + Sync where M: ... {
    async fn connect(&self, target: &Sv2Target) -> Result<ConnPair<M>, Error>;
}

#[async_trait]
pub trait Sv2Listener<M>: Send + Sync where M: ... {
    async fn accept(&self) -> Result<(PeerIdentity, ConnPair<M>), Error>;
}

pub type ConnPair<M> = (
    Receiver<StandardEitherFrame<M>>,
    Sender<StandardEitherFrame<M>>,
);

pub enum Sv2Target {
    Tcp { addr: SocketAddr, authority_pubkey: Option<Secp256k1PublicKey> },
    #[cfg(feature = "iroh-transport")]
    Iroh { node_addr: iroh::EndpointAddr, authority_pubkey: Option<Secp256k1PublicKey> },
}
```

The trait body returns `(Receiver, Sender)` of `StandardEitherFrame<M>` — the existing SRI shape. App code that migrates to the trait gets the same channel-pair interface it already has, parameterized by `Sv2Connector` impl.

`TcpSv2Connector` / `TcpSv2Listener` are the default impls, present without any feature flag. The `#[cfg(feature = "iroh-transport")]` gate is *only* on the `Iroh` variant of `Sv2Target` and the iroh impls.

## In-memory transport for tests

Commit `7a1297fd` adds an in-memory transport pair (file `stratum-apps/src/network_helpers/transport.rs` extension, plus integration_tests fixtures in `3d083677`). This is the third independently-implementable transport beyond TCP and iroh — proof that the abstraction is not iroh-specific.

The in-memory transport is "two `tokio::sync::mpsc` channels playing the role of a duplex stream" — used by integration tests so role-vs-role tests don't need to bind a port. This is a clean engineering signal: the abstraction was designed so a transport with no socket, no DNS, no port could plug in.

## Implication for thesis

**The transport-abstraction PR is a clean upstream candidate, separable from iroh.** SRI maintainers who don't want to take iroh's dependency footprint or NAT-traversal opinions could merge `feat/transport-abstraction` alone and gain:

- A trait-based seam for transport experimentation (anyone writing a TLS-over-TCP, WebSocket, or QUIC variant later does it cleanly).
- Better tests via in-memory transport.
- No ABI-visible behavior change for existing TCP users.

If `feat/transport-abstraction` were merged and `feat/iroh-transport` stayed downstream as an *additive* feature crate, the StartOS fork's maintenance burden would drop dramatically — only the iroh modules would need rebasing, not the role-by-role refactors.

This is the strongest evidence I've found that the design *can* be done responsibly. It does not change the interop reality (a TCP-only ASIC still cannot reach an iroh-only listener), but it does change the ecosystem trajectory: with a merged abstraction, an SRI maintainer is one PR away from "let's add WebSocket too" or "let's add Tor onion", and the fork's iroh impl is no longer an island.

That said: as of 2026-06-03 nothing on `feat/transport-abstraction` has been opened as an upstream PR. RFC #1935 (Oct 2025) is still ungrandled. So this is *latent* upstream-mergeability, not actual.

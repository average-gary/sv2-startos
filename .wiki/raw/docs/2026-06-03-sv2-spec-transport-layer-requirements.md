---
title: "SV2 spec: transport layer is connection-oriented (TCP-named, not TCP-baked)"
type: docs
source: "https://github.com/stratum-mining/sv2-spec/blob/main/03-Protocol-Overview.md"
date: 2026-06-03
quality: 5
credibility: high
relevance: direct
direction: nuances
evidence_strength: "spec-text"
tags: [sv2, stratum, transport, spec, noise, framing, interop]
summary: "The SV2 BIP only requires a connection-oriented transport with ordered delivery — TCP is named as an example, not mandated; Noise framing is independent of byte-stream provider, so Iroh-as-transport is spec-permissible."
---

## What the spec actually says

From `sv2-spec/03-Protocol-Overview.md`, lines 52-55:

> Each sub-protocol is based on the same technical principles and **requires a connection oriented transport layer, such as TCP**. In specific use cases, it may make sense to operate the protocol over a connectionless transport with FEC or local broadcast with retransmission. However, that is outside of the scope of this document. **The minimum requirement of the transport layer is to guarantee ordered delivery of the protocol messages.**

Emphasis added. "Such as TCP" is illustrative, not normative. The normative requirement is `(connection-oriented) AND (ordered delivery)`. QUIC (which Iroh wraps) satisfies both.

`04-Protocol-Security.md` defines Noise NX with `Noise_NX_Secp256k1+EllSwift_ChaChaPoly_SHA256` — chosen specifically so primitives match Bitcoin Core (BIP340 schnorr + secp256k1 + BIP324 ElligatorSwift). The handshake is described purely in terms of message bytes; nothing in §4.4 or §4.5 names TCP, sockets, file descriptors, or any byte-stream API. Noise is a protocol-on-top-of-bytestream; it inherits ordered-delivery from the layer below and otherwise doesn't care.

§3.2 framing is `[U16 extension_type | U8 msg_type | U24 msg_length | payload]` — six-byte prefix, length-delimited. Identical bytes regardless of whether the carrier is TCP, QUIC bi-stream, or in-process pipe.

§3.3 "Reconnecting Downstream Nodes" lets an upstream redirect a downstream to a different host (no addressing scheme assumed beyond "host"); §3.4 extension framework does not touch transport.

## Implication for thesis

**Spec-level: the SV2 protocol is transport-agnostic.** A Noise-NX-encrypted, length-prefixed framed bytestream flowing over a QUIC bi-stream (Iroh's wire) is a conformant SV2 connection per the BIP. So in principle a fork can swap TCP for Iroh without breaking the wire protocol.

However the spec also does not mandate a *negotiation* mechanism for transport. There is no `SetupConnection` flag or extension that tells a counterparty "I speak iroh." Transport selection is therefore entirely an out-of-band, deployment-side configuration concern. Two roles either pre-agree on transport or they cannot meet.

This is the seed of the interop problem: spec permits Iroh, but spec does not provide a way for a stock-TCP miner to discover or fall back to the same pool's Iroh listener. Interop has to be solved by *operators running both transports*, not by the protocol negotiating.

For the StartOS thesis: the spec does not block Iroh, but it also does not help an Iroh-only Start9 pool be reachable by a TCP-only ASIC. The fork's chosen design (run both listeners, dial single transport per upstream) is consistent with the spec's silence on the matter.

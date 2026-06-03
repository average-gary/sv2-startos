---
title: "stratum-core/noise-sv2 has no transport coupling — TCP lives only in network_helpers"
type: repos
source: "https://github.com/stratum-mining/stratum/tree/main/sv2/noise-sv2"
date: 2026-06-03
quality: 5
credibility: high
relevance: direct
direction: supports
evidence_strength: "code-inspection"
tags: [sv2, sri, noise, codec, framing, transport, stratum-core, abstraction]
summary: "Auditing the SRI workspace shows TCP coupling is confined to stratum-apps/network_helpers; stratum-core (noise-sv2, codec-sv2, framing-sv2, channels-sv2) is byte-stream-agnostic — confirming transport swap is mechanically clean."
---

## SRI workspace layout (main, 2026-06)

`gh api repos/stratum-mining/stratum/contents` returns:

```
sv2/
  binary-sv2/        # serialization
  buffer-sv2/        # byte buffer mgmt
  channels-sv2/      # channel state machines
  codec-sv2/         # frame encoding/decoding
  extensions-sv2/    # extension framework
  framing-sv2/       # SV2 frame layout
  handlers-sv2/      # message dispatch
  noise-sv2/         # Noise NX handshake + AEAD
  parsers-sv2/       # message parsers
  subprotocols/      # mining/jd/td message defs
stratum-core/
  src/lib.rs         # re-export hub
  stratum-translation/ # SV1↔SV2
sv1/                 # legacy SV1
```

There is no `transport/`, `tcp/`, `socket/`, or `network/` directory anywhere under `sv2/` or `stratum-core/`. Transport-related types live in `stratum-apps/network_helpers/` — and `stratum-apps` is in a separate repo (`stratum-mining/sv2-apps`), not the protocol library.

## What noise-sv2 actually requires from its caller

`sv2/noise-sv2/src/initiator.rs` and `responder.rs` define `Initiator` / `Responder` structs. Their public surface is "give me bytes, I produce bytes" — `step_0`, `step_1`, `step_2` style methods that take handshake message bytes and return next-step bytes. The crate has no `tokio`, no `mio`, no `std::net`, no socket types in any signature. The README says:

> `noise_sv2` is primarily intended to secure communication in the Stratum V2 (Sv2) protocol. It handles the necessary Noise handshakes, encrypts outgoing messages, and decrypts incoming responses.

It can be used in `#![no_std]` with `--no-default-features` (per the README's feature flag section). A no_std crate by definition has no socket dependency.

## codec-sv2 / framing-sv2

`framing-sv2` defines the 6-byte SV2 frame header (`extension_type | msg_type | msg_length | payload`) per spec §3.2. Pure byte-layout code; zero socket dependency.

`codec-sv2` wraps framing + noise into encode/decode pipelines that consume `&[u8]` and produce `&[u8]`. Zero socket dependency.

## Where TCP lives

The TCP coupling — the only TCP coupling in the whole SRI stack — lives in `stratum-apps/src/network_helpers/`:

- `noise_connection.rs` — `Connection::new(TcpStream, ...)` constructs a tokio-task pair (reader, writer) over `tokio::net::TcpStream`.
- `noise_stream.rs` — `NoiseTcpStream` owns the `TcpStream` directly.
- `sv1_connection.rs` — same shape for SV1.

The `feat/iroh-transport` branch of the average-gary fork adds:

- `noise_generic_stream.rs` — `NoiseGenericStream<S, M>` over `S: AsyncRead + AsyncWrite`. Generic sibling of `noise_stream.rs` (which is left at zero diff for rebase friendliness).
- `iroh/duplex.rs` — `IrohDuplex` AsyncRead+AsyncWrite adapter over `iroh::SendStream` / `RecvStream`.

The diff is purely additive at the `network_helpers` layer; nothing in `stratum-core` or `sv2/*` is touched. The fork's commit `bc51e1e2` ("stratum-apps: add iroh transport infrastructure") shows zero modifications to any file outside `stratum-apps/`.

## Implication for thesis

**The mechanical/architectural argument for transport pluggability is sound.** SRI's protocol library was already structured so that "transport" is a separate concern from "Noise + framing + parse + dispatch + channel state". You don't need to fork stratum-core to add iroh; you only need to provide a different `(AsyncRead + AsyncWrite)` to `Connection::new`. This is exactly what the fork does.

This is the strongest spec-level + code-level evidence for the thesis: SV2 is genuinely transport-agnostic at the protocol layer, and the implementation respects that boundary. There is no "ASIC firmware would need to be re-architected to support a non-TCP transport" claim that holds water at the protocol level — the rearchitect-cost is entirely in the firmware's networking helper, which in any modern Rust mining stack is structurally identical to SRI's.

The interop concern is therefore *not* a protocol concern. It is a deployment / firmware-update / coordination concern. Spec permits Iroh; SRI architecture permits Iroh; what blocks the thesis is purely "no other implementation has done it yet, so a Start9 user has nobody to talk to."

That blocker is real but is qualitatively different from "the protocol fundamentally can't accommodate this". For path 4, this nuances the verdict toward "supports the *technical viability*" while the deployment evidence (firmware survey, pool survey, RFC #1935 silence) opposes the *ecosystem viability* in 2026.

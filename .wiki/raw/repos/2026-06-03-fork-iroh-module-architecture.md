---
title: "stratum-apps/src/network_helpers/iroh/* module: architecture, ALPNs, discovery, admission"
type: repos
source: "https://github.com/average-gary/sv2-apps/tree/feat/iroh-transport/stratum-apps/src/network_helpers/iroh"
date: 2026-06-03
quality: 5
credibility: high
relevance: direct
direction: supports
evidence_strength: "direct-code-inspection"
tags: [iroh, sv2-apps, fork-survey, alpn, discovery, admission, fedimint-pattern]
summary: "The iroh module is ~5,700 lines of well-documented Rust covering ALPN versioning, identity, discovery, admission, endpoint, listener, connector, connection, metrics — modelled explicitly on Fedimint's iroh patterns."
---

## Module surface (lines per file, all `added` on the branch)

```
stratum-apps/src/network_helpers/iroh/
  admission.rs          340   AdmissionPolicy {Open|Whitelist}, ArcSwap-based runtime updates
  alpn.rs                65   5 per-role ALPN constants tied to SV2_WIRE_VERSION
  config.rs             643   IrohRoleConfig (TOML), resolve pipeline
  connection.rs         448
  connector.rs          588   IrohSv2Connector (outbound-dialer half of the Sv2Connector trait)
  discovery.rs          675   per-mechanism toggles (local/relay/pkarr/dht/n0)
  duplex.rs              66   glue between iroh Send/Recv streams and tokio AsyncRead/Write
  endpoint.rs           554   build_endpoint() — single source of truth for Endpoint config
  identity.rs           387   load_or_generate Ed25519 secret-key file
  listener.rs           733   IrohSv2Listener — accept side with admission gate
  metrics.rs            621   Prometheus per-role counters/gauges/histograms (gated on monitoring)
  mod.rs                 49   re-exports
  noise_iroh_stream.rs   15   type alias: NoiseGenericStream<IrohDuplex>

Plus:
  network_helpers/noise_generic_stream.rs   544   transport-agnostic Noise wrapper
  network_helpers/transport.rs              623   Sv2Connector trait, Sv2Target enum (covers TCP+iroh)
```

Total additions in `network_helpers/iroh/` and adjacent transport files: **≈ 5,700 lines** of new Rust.

## Architectural decisions

**ALPN policy** (`alpn.rs`): Five per-role ALPNs (`sv2/pool/0`, `sv2/jds/0`, `sv2/jdc/0`, `sv2/tproxy/0`, `sv2/tp/0`) all share a single `SV2_WIRE_VERSION = 0` constant. Cross-role accidental dials are rejected at the QUIC layer before any SV2 bytes flow. Test enforces all ALPNs share the suffix:
> "Matches the 3-ALPN pattern used by Fedimint in production."

**Two-layer identity**: iroh's QUIC raw-public-key TLS handshake authenticates the EndpointId (peer node ID); the SV2 Noise NX handshake then runs *inside* the iroh bidi stream, preserving the existing SV2 security model rather than replacing it. Admission check (whitelist or open) gates BEFORE Noise.

**Discovery defaults** (`discovery.rs`): All five mechanisms ON by default — local mDNS, relay, pkarr-publish, pkarr-resolve, BitTorrent mainline DHT, n0 hosted discovery. Configurable via TOML; each individually overridable via env var (`SV2_IROH_RELAYS_ENABLE`, etc.). Order-of-resolution and env-var pattern explicitly cited as following Fedimint's `FM_IROH_*` convention. `connection_overrides` map allows operator to pin a `node_id → host:port`, replacing TOML wholesale when set via `SV2_IROH_CONNECT_OVERRIDES`.

**Operational primitives** (cited in code as Fedimint lessons learned):
- `max_idle_timeout_secs = 60` and `keep_alive_interval_secs = 30` defaults (Fedimint PR #8422).
- `per_request_timeout_secs = 30` (Fedimint PR #8571).

**Admission** (`admission.rs`): `arc_swap::ArcSwap<AdmissionPolicy>` for lock-free reads on the accept hot path; runtime-updatable whitelist.

**Identity** (`identity.rs`): Auto-generates a 32-byte Ed25519 secret key file with mode 0600 if missing. Path is `~/.config/sv2/<role>/iroh-secret.ed25519`-style by convention (with `~` and `$VAR` expansion via `shellexpand`).

**Phase markers in code**: comments reference "Wave 1/2/3" and a private design plan at `/Users/garykrause/.claude/plans/how-might-we-implement-snoopy-lollipop.md` — confirming this is staged, plan-driven work, not a prototype.

## Implication for thesis

Strong support for code-quality and ergonomics aspects. The module is not a hack; it is a careful port of well-understood patterns (Fedimint's iroh stack, used in production for federation comms) to SV2's role topology. For StartOS user-setup-ergonomics specifically: mDNS-on-by-default + DHT-on-by-default is exactly the "no port forwarding required" shape a Start9 package wants. The `[iroh.connection_overrides]` TOML map gives operators an escape hatch when discovery fails. Admission whitelist gives pool operators a sane policy knob.

Caveats: 5,700 lines is a lot of new code in a security-sensitive path. None of it has been reviewed by SRI maintainers (no upstream PR exists). The cited design plan is in the maintainer's local `~/.claude/plans/` directory and is not committed to the repo, so reviewers can't see the author's stated intent.

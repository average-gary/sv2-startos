---
title: "Fork iroh-transport: dual-stack listener, single-stack dial — fallback variants explicitly removed"
type: repos
source: "https://github.com/average-gary/sv2-apps/tree/feat/iroh-transport"
date: 2026-06-03
quality: 5
credibility: high
relevance: direct
direction: nuances
evidence_strength: "code-inspection"
tags: [sv2, fork, iroh, transport, dual-stack, fallback, interop]
summary: "Each role on the fork can listen on TCP and Iroh simultaneously, but every outbound dial commits to one transport — IrohThenTcp/TcpThenIroh fallback variants were added then deliberately removed in commit b42c3dc2."
---

## Listener side: dual-stack

`pool-apps/pool/src/lib/config.rs` (feat/iroh-transport branch, file as of 2026-06-01):

```rust
/// Optional iroh-transport configuration. When present, the pool listens on
/// TCP AND iroh simultaneously; downstream clients can connect over either
/// transport.
#[cfg(feature = "iroh-transport")]
#[serde(default)]
pub iroh: Option<stratum_apps::network_helpers::iroh::IrohRoleConfig>,
```

Same shape on JDS, JDC, translator listeners. The TCP listener bound to `listen_address` is unaffected; the iroh listener is *additive*. A StartOS pool package configured with both can accept a stock-SV2 TCP miner AND an Iroh-speaking peer at the same time.

`pool-apps/pool/src/lib/mod.rs` constructs a `shared_iroh: Option<(IrohEndpoint, ResolvedIrohRoleConfig)>` once per process and clones it into both the downstream listener and the outbound TP dial. iroh's "one Endpoint per app" guidance is followed.

## Dial side: single-stack, no implicit fallback

Commit `b42c3dc2` ("iroh(transport): drop IrohThenTcp / TcpThenIroh fallback variants", 2026-06-01):

> Per RFC #1935 discussion: an upstream is one transport, period. If a peer is configured as iroh, dial it as iroh — no implicit TCP fallback. Operators who want both transports for the same physical peer configure two `[[upstreams]]` entries. This removes the silent-fallback footgun where a misconfigured iroh leg would quietly use TCP without alerting the operator that their iroh setup is broken.

What the commit removes from `stratum-apps`:

- `Sv2Target::IrohThenTcp` / `Sv2Target::TcpThenIroh` enum variants
- `PreferTransport::IrohThenTcp` / `PreferTransport::TcpThenIroh`
- The fallback paths inside `CompositeSv2Connector::connect`, `IrohSv2Connector::connect`, `TcpSv2Connector::connect`
- `tcp_connector_handles_iroh_then_tcp_via_fallback` test
- Three fallback integration tests (`fallback_iroh_to_tcp`, `jd_integration_iroh`, `translator_integration_iroh`)

`PreferTransport::Tcp` is the new default. Configs without an `[iroh]` block behave identically to legacy TCP-only deployments. Configs that opt in to iroh must set `prefer_transport = "iroh"` AND supply `iroh_node_id`; on a parse failure or missing NodeId the dial site logs a warn — no quiet TCP fallback.

JDC's local mirror enum (`jd_client::config::PreferTransport`) drops the same two variants. `JdcConnectors::dial_one` (renamed from `dial_with_fallback`) does pure single-transport dispatch.

## Operator workaround for "I want both" on the dial side

Per the example translator config (`tproxy-config-hosted-pool-example.toml`), operators wanting redundancy across both transports configure **two `[[upstreams]]` entries** for the same physical pool:

```toml
[[upstreams]]
address = "75.119.150.111"
port = 3333
authority_pubkey = "9auqWEzQDVyd2oe1JVGFLMLHZtCo2FFqZwtKA5gd9xbuEu7PH72"
# prefer_transport = "tcp"  (default)

[[upstreams]]
address = "75.119.150.111"
port = 3333
authority_pubkey = "9auqWEzQDVyd2oe1JVGFLMLHZtCo2FFqZwtKA5gd9xbuEu7PH72"
iroh_node_id    = "k51qzi5uqu5dl..."
prefer_transport = "iroh"
```

The role's existing retry/failover logic decides which to use. There is no first-class "if iroh fails, dial TCP" code path inside a single connector.

## Implication for thesis

**Listener interop: solid.** A StartOS pool package built with `--features iroh-transport` and an `[iroh]` block configured will accept TCP miners AND Iroh peers concurrently. A TCP-only ASIC plugged in via `pool-host:3333` works exactly as it does on stock SRI today.

**Outbound interop: depends on operator setup.** A StartOS jdc or translator dialing an upstream pool that doesn't speak Iroh (i.e. every production pool today — see sources on Braiins, DMND, Ocean) must be configured with `prefer_transport = "tcp"`, in which case the iroh code path is dead weight. The "Iroh ergonomics" benefit is invisible on this leg.

**The fork's design is conservative-correct.** It does not break TCP interop. But the *user benefit* of Iroh — namely, peer-to-peer-without-DNS, NAT-traversal, no port-forwarding — only materializes when *both endpoints* run the fork. For a Start9 user that means: Start9-pool-package on one side, Start9-translator-package on the other, configured to find each other via NodeId. Anything that crosses out of the Start9 ecosystem (a real ASIC dialing in, or dialing a real production pool) reverts to plain TCP.

The fork has *not* eliminated the interop concern; it has cleanly compartmentalized it. Operators must understand that an iroh-only listener is unreachable to TCP peers and an iroh-configured upstream cannot serve TCP-only downstreams. The "two upstreams entries" workaround is a config pattern, not protocol-level magic.

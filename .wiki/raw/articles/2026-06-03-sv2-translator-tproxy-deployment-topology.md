---
title: "SV2 Translator (tproxy) deployment topology — where does it run, and who does it talk to?"
type: articles
source: "https://github.com/average-gary/sv2-apps/tree/feat/iroh-transport/miner-apps/translator + spec §3 roles"
date: 2026-06-03
quality: 4
credibility: high
relevance: direct
direction: nuances
evidence_strength: "code-inspection + spec-text"
tags: [sv2, translator, tproxy, deployment, topology, sv1, miner-side, interop]
summary: "tproxy is the SV1↔SV2 bridge; per spec §3 and the fork's tproxy config, it speaks SV1 to local ASICs (TCP-only by definition) and SV2 to upstream pools (TCP or iroh) — so the iroh leg only ever helps on the *upstream* side, never the miner side."
---

## What tproxy does

Per `sv2-spec/03-Protocol-Overview.md` (which calls this role a "Mining Proxy"):

> **Mining Proxy (optional)** — Sits in between Mining Device(s) and Pool Service, aggregating connections for efficiency.

In SRI, `miner-apps/translator` (a.k.a. tproxy) is the practical realization. It accepts SV1 (legacy stratum, JSON-RPC over TCP) on the *downstream* side from existing ASICs, and dials SV2 (Noise NX over TCP) on the *upstream* side to a SV2-aware pool.

## Downstream side: SV1 over TCP, period

From `tproxy-config-hosted-pool-example.toml` (feat/iroh-transport branch):

```toml
# Local Mining Device Downstream Connection
downstream_address = "0.0.0.0"
downstream_port = 34255

# ...

# Extranonce2 size for downstream connections
# This controls the rollable part of the extranonce for downstream SV1 miners
downstream_extranonce2_size = 4
```

The downstream is **SV1**. The SV1 protocol is JSON-RPC over plain TCP, defined years before any of this. SV1 has no Noise, no transport abstraction, nothing — it's `mining.subscribe`, `mining.notify`, `mining.submit` JSON messages newline-delimited over a TCP socket.

There is no SV1 over Iroh. There is no SV1 over QUIC. SV1 ASICs from 2014 onward only know how to dial a TCP socket on `pool-host:port`. The fork does not (and cannot, without re-spec'ing SV1) change this.

So: an Antminer / Whatsminer / S19 / S21 dialing into a Start9-hosted tproxy speaks plain SV1 over TCP. The fork's iroh code does not touch this leg.

## Upstream side: SV2 over TCP or iroh

From the same config:

```toml
[[upstreams]]
address = "75.119.150.111"
port = 3333
authority_pubkey = "9auqWEzQDVyd2oe1JVGFLMLHZtCo2FFqZwtKA5gd9xbuEu7PH72"

# Optional iroh transport per-peer fields...
# iroh_node_id    = "k51qzi5uqu5dl..."
# prefer_transport = "iroh"
```

This is where iroh lives — the upstream pool dial. As established in the firmware/pool survey, no production pool listens on iroh. The iroh leg is therefore meaningful only when the upstream is *another Start9 box running the fork's pool* — i.e. a friend's home solo pool.

## The deployment shapes that exist

There are four practical shapes for SV2 deployment, and where iroh-transport actually helps in each:

| Shape | Downstream | Upstream | Iroh helps? |
| --- | --- | --- | --- |
| **A. Pool operator** runs SRI pool on Start9, accepts SV2 miners directly | SV2 miner (Braiins OS+) over TCP | Bitcoin Core via TP | No. ASIC speaks TCP only. The iroh listener is dead unless someone runs an iroh-aware client (which doesn't exist in production). |
| **B. Mining farm** runs tproxy on Start9, ASICs dial in over SV1 | SV1 ASIC over TCP | Remote SV2 pool (Braiins/DMND) over TCP | No on either leg. SV1 mandates TCP; production pool only listens on TCP. |
| **C. Hobbyist solo** runs Start9 pool talking to local Bitcoin Core via TP | SV1 ASIC via co-located tproxy | Bitcoin Core (local, irrelevant) | No. Local network; iroh's NAT-traversal value is zero on LAN. |
| **D. Two Start9 users** — A runs pool, B runs tproxy, B's friends mine to A | A: SV1 ASIC | B's tproxy → A's iroh-listening pool | **Yes.** This is the only shape where iroh's NodeId discovery + holepunching is useful. |

Shape D is the lone case where the iroh value prop materializes. It is also the rarest deployment shape — it requires *both* peers to be Start9 users, both to have installed the fork, both to have configured `iroh_node_id`s, and the operator on the tproxy side to have a relationship with the pool operator.

## What about a "Start9 friend pool" that accepts SV2 directly from a Start9 friend's miner?

Replace shape D's downstream with "another Start9 box running an SV2 mining device." The fork's `mining-device` bin (reintroduced in commit `59b543c6`) is a CPU-mining example, not a real ASIC. There is no Start9-hosted ASIC. So this hypothetical requires a Start9 box that *also runs the fork's tproxy in iroh mode* and that translates from SV1 (still TCP) on a local ASIC into SV2-iroh going to a friend's pool. That collapses back to shape D.

## Implication for thesis

**The Iroh value prop applies only to a sliver of deployment scenarios.** For the StartOS package to be an "ideal candidate", the value prop must apply to the modal Start9 user. The modal Start9 user is most likely:

1. Running a personal node + a self-custody wallet, and *might* want to dabble with mining.
2. *Not* operating a commercial mining farm.
3. Likely interested in shape B or D — translator + remote pool, or solo pool.

Shape B (the most common "I want to mine to a pool" shape) gets *zero* benefit from iroh because the upstream pool only speaks TCP. Shape D benefits but requires an ecosystem of other Start9 users running the same fork — chicken-and-egg.

The thesis can be partially rescued by reframing as: "Start9 users can run a *private mining ecosystem* with each other using iroh, and use TCP for the legacy world." But the original thesis ("ideal candidate for StartOS since the Iroh setup enables easy user setup and management") is too broad. The Iroh setup helps Start9-to-Start9 connections but does *not* help Start9-to-real-pool or real-miner-to-Start9 connections, which are the more common scenarios.

The fork's dual-stack listener design *does* mean a Start9 pool is reachable by both populations — TCP miners get the legacy experience, Iroh-aware peers get the holepunched experience. This is the saving grace, and it is exactly what the spec permits and the code implements.

Verdict: the technical interop story is "ok" — TCP works, Iroh is additive — but the *user-experience benefit* of Iroh is realized in a small, specific subset of deployments, not the broad "easy user setup" the thesis claims.

---
title: "SV2 deployment reality 2026: ASIC firmwares speak TCP, pools listen on host:port"
type: articles
source: "https://github.com/stratum-mining/stratum + braiins academy + dmnd.work + ocean.xyz"
date: 2026-06-03
quality: 4
credibility: medium
relevance: direct
direction: opposes
evidence_strength: "third-party-blog + code-inspection"
tags: [sv2, asic, firmware, braiins, dmnd, ocean, deployment, miner-side, interop]
summary: "Every production SV2 ASIC firmware (Braiins OS+, LuxOS, VNish, ePIC) and every production SV2 pool (Braiins Pool, DMND, OCEAN-experimental) speaks Noise-over-TCP only — there is no shipped Iroh-aware miner anywhere."
---

## Pools that speak SV2 in 2026

| Pool | SV2 status (2026-06) | Transport observed | Connection format users enter |
| --- | --- | --- | --- |
| **Braiins Pool** | Production, since 2022. Uses an SRI-derived stack. | Noise over TCP. | `host:port` (Braiins academy docs use plain stratum URLs; the SV2 endpoint is configured as a pool address in the firmware's standard Pool fields, not a special URL scheme). |
| **DMND (Demand)** | Self-described as "world's first Stratum V2 mining pool", end-to-end encrypted binary protocol. Onboarding lives at `onboarding.dmnd.work`. | Noise over TCP (no public docs mention QUIC or any non-TCP transport). | Onboarding portal issues per-account endpoints; format is host:port. |
| **OCEAN** | Experimental SV2 deployment as of late 2025; primary product is SV1-with-data-jobs. No public SV2 endpoint advertised. | When SV2 is offered, Noise over TCP. | host:port. |
| **SRI demo pool** | Reference. Bundled in stratum-mining/sv2-apps as a configurable pool role. | Noise over TCP by default; the average-gary fork adds Iroh as an additive listener. | host:port, plus `authority_pubkey` (base58check). |

Other SV2-only pools attempted in 2024-2025 are either gone (e.g. early Braiins-only test pools), or were always TCP-only.

**Key finding:** No production SV2 pool advertises an Iroh NodeId, a relay URL, or any non-TCP endpoint. None.

## ASIC firmwares that speak SV2 in 2026

| Firmware | SV2 support | Open source? | Transport |
| --- | --- | --- | --- |
| **Braiins OS+** | Yes — Braiins is the originator of SV2 and the firmware was first to ship it. | Open-core (BOSminer is GPL; some hardware-specific bits proprietary). | TCP only. Noise NX handshake then SV2 framed messages. The firmware UI exposes "Pool URL" (or `Pool 1 URL` style) fields that take a hostname or IP and a port — same UX as SV1. |
| **LuxOS** | Marketed SV2 support 2024+; deployed mostly on S19/S21 series. | Proprietary. | TCP. No public mention of any non-TCP transport. |
| **VNish** | Limited SV2 (mostly SV1 + custom features). | Proprietary. | TCP. |
| **ePIC** | Unknown SV2 status as of 2026; primarily Antminer/Whatsminer alt-firmware. | Proprietary. | TCP. |
| **Stock manufacturer firmware** (Bitmain, MicroBT) | SV1 only, no SV2 in stock builds. | Proprietary, locked. | TCP, hardcoded URL conventions (often a fixed format string for `stratum+tcp://...`). |

**Key finding:** Zero shipping miner firmware speaks Iroh. Zero. Even the most permissive hypothesis — that Braiins might add it tomorrow — is unfounded by current evidence: Braiins' SRI engagement focuses on SV1-to-SV2 translation and channel work, not transport.

## What miners actually configure

ASIC firmware configuration is dominated by:

- A pool URL field (sometimes `stratum+tcp://host:port`, sometimes just `host:port`).
- A worker username field (`account.worker`).
- A password field (often unused).

Stratum V2 in Braiins OS+ adds at most a `authority_pubkey` field for Noise NX server-cert verification. There is no field for "transport selection", "QUIC NodeId", "iroh address", or anything resembling P2P discovery. The mental model the firmware presents to the operator is "type the pool's hostname; we'll dial TCP on that port."

## Firmware update cycles

ASIC firmwares update on the order of months-to-years, not days. Braiins OS+ ships major releases roughly quarterly; Bitmain stock firmware updates are at the manufacturer's discretion and typically tied to hardware reliability fixes, not protocol features. Even if every SV2 firmware vendor decided *today* to add Iroh:

- Braiins OS+ would take 2-4 release cycles to roll it out broadly.
- LuxOS / VNish / ePIC have no public SV2 transport-abstraction roadmap to point to.
- Bitmain stock has no SV2 at all and shows no signs of adding it.

The deployed installed base of "Braiins OS+ on existing Antminers" is the *only* meaningful population of devices that speak SV2 today, and that population speaks Noise-over-TCP.

## Hardcoded endpoints in stock firmware

Stock Bitmain firmware has historically shipped with backdoors that automatically reroute a percentage of hashrate to manufacturer-controlled pools (Antbleed, 2017). The endpoints in those backdoors are TCP/IP hardcoded into the firmware binary. Even non-malicious firmware bakes in DNS names or IPs for default pools (Antpool, F2Pool) at compile time. None of these support iroh discovery.

## Implication for thesis

**Strong evidence against the thesis as stated.** A StartOS pool package built on `feat/iroh-transport`:

- ✅ CAN accept a Braiins OS+ miner that speaks Noise-over-TCP (because the fork's pool listens on TCP too, dual-stack).
- ❌ CANNOT be reached *via Iroh* by any commercial miner firmware, because no commercial miner firmware speaks Iroh.
- ❌ A Start9-side translator (tproxy) configured with `prefer_transport = "iroh"` toward an upstream Braiins/DMND/OCEAN pool will fail to dial — those pools don't have an iroh listener. The operator must use `prefer_transport = "tcp"`, which makes the iroh code path dead weight on this leg.

**The Iroh value proposition only materializes when both endpoints are Start9-side fork installations.** That is a closed island — Start9-pool talking to Start9-translator on a friend's box. As soon as a real miner firmware joins on either side, Iroh evaporates and you're back on TCP.

This is not fatal to the thesis: you can build a useful StartOS package that *uses TCP for outbound dials to real pools* and *uses Iroh for the StartOS-to-StartOS edge*. But that is not the "average user fires up a Start9 pool and connects their Antminer" story; that is "Start9 user runs a hobbyist test pool with a Start9-running buddy on the other side of NAT". The audience and the value are much narrower than "ideal candidate".

## Sources / cross-checks

- Braiins academy page on SV2 setup (`academy.braiins.com/en/braiins-os/setup/configuration-stratumv2/`) confirms SV2 endpoint config but does not reveal any non-TCP transport option. (Many braiins sub-pages return 404 in 2026-06; the SV2 setup material is reachable through the main academy index.)
- DMND homepage (`dmnd.work`) describes SV2 as "end-to-end encrypted, binary protocol" — confirms TCP-Noise is sufficient for their value prop, no mention of overlay networks.
- OCEAN docs (`ocean.xyz/docs`) list TIDES + node policy but do not document an SV2 endpoint or transport.
- GitHub code search for `NoiseIrohStream` returns zero hits outside the average-gary fork — confirming no other implementation exists.
- GitHub issue search across `stratum-mining/stratum` for `iroh` returns zero issues, zero PRs (separate from Discussion #1935 which is in the discussions namespace).

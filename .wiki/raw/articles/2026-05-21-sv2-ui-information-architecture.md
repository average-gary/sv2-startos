---
title: SV2 UI information architecture — what to show per service
type: articles
source: synthesis from Braiins Pool, mempool.space, public-pool, SRI READMEs
date: 2026-05-21
quality: 4
confidence: medium
tags: [sv2, ui, product-design, dashboard]
summary: Top widgets per service in priority order. Pool / Translator / JDC need distinct dashboards but share a component kit.
---

# SV2 UI information architecture

## Pool (`pool_sv2`)

| # | Widget | Priority | API source |
|---|---|---|---|
| 1 | Pool hashrate (now / 1h / 24h), connected miner count, blocks found 24h, uptime | v0 | `/api/v1/global` + `/api/v1/clients` |
| 2 | Connected downstreams list — channel type (extended/standard/group), share rate, accept/reject, target | v0 | `/api/v1/clients` |
| 3 | Block templates served + last template timestamp + TP source + TP latency | v0 | needs upstream PR |
| 4 | Blocks found table — height, time, reward, finder | v0 | needs upstream PR (channels expose `blocks_found` count but not timeline) |
| 5 | JDS embedded status — declarations received/accepted, in-flight jobs | v0 | needs upstream PR |
| 6 | Hashrate timeseries (24h sparkline, 7d chart) | v1 | derive from Prometheus `/metrics` |
| 7 | Coinbase config view (read-only) | v1 | not API; render from local config |
| 8 | Authority pubkey + connection URL (copy buttons) | v0 | not API; render from local config |
| 9 | Recent share heat map by downstream | v1 | derive from `/api/v1/clients/{id}/channels` |
| 10 | Log tail with errors/warns filter | v1 | StartOS logs viewer (separate surface) |

NOT useful: raw protocol message dumps, per-share detail tables.

## Translator (`translator_sv2`)

| # | Widget | Priority | API source |
|---|---|---|---|
| 1 | Connected SV1 miners table — name, IP, 5m hashrate, accept/reject, current diff, last share | v0 | `/api/v1/sv1/clients` |
| 2 | Aggregate hashrate (5m/1h/24h) | v0 | `/api/v1/global` |
| 3 | Upstream pool — URL, latency, channel ID, status + failover history | v0 | `/api/v1/server` |
| 4 | Vardiff state per miner — current target, target shares/min, actual shares/min, last adjustment | v0 | `/api/v1/sv1/clients/{id}` |
| 5 | Share accept/reject pool-wide and per-miner with reason breakdown | v0 | `/api/v1/sv1/clients` (rejection reasons HashMap) |
| 6 | Channel aggregation mode (shared vs per-miner extended) + extranonce2 size | v1 | local config + `/api/v1/server` |
| 7 | Stale share rate by miner | v1 | derive from sv1 client info |
| 8 | Payout verification status (when enabled) | v1 | not in API; needs upstream |
| 9 | Quick "kick worker" / rename action | v1 | needs upstream POST endpoints |
| 10 | Hashrate timeseries per miner (sparkline) | v1 | derive from Prometheus |

NOT useful: SV2 binary frame inspector, block-found celebrations (translator doesn't find blocks).

## JD-Client (`jd_client_sv2`)

| # | Widget | Priority | API source |
|---|---|---|---|
| 1 | Mode badge (FullTemplate / CoinbaseOnly / SoloMining) | v0 | local config |
| 2 | Current upstream pool — URL, state, latency, share accept rate | v0 | `/api/v1/server` |
| 3 | Current JDS — URL, state, declarations sent/accepted/rejected | v0 | needs upstream PR |
| 4 | Template Provider status — type, height, last template, mempool tx count, fee total | v0 | needs upstream PR |
| 5 | Declared jobs in flight — txid count, fee, age | v0 | needs upstream PR |
| 6 | Fallback / fraud events log | v0 | needs upstream PR |
| 7 | Local hashrate pushed upstream | v0 | `/api/v1/clients` (downstream miners) |
| 8 | Mempool snapshot (when IPC enabled) — tx count, vMB, fee histogram | v1 | needs upstream PR |
| 9 | Coinbase preview — outputs + amounts | v1 | needs upstream PR |
| 10 | Block-found notification (SoloMining mode) | v1 | needs upstream PR |

NOT useful: every SetNewPrevHash event, every share submission row.

## Cross-cutting verdict

Three services share ~60% of UI primitives: connection-state cards, hashrate strip, share counters, log tail, config viewer. **Build one StartOS-aligned component kit** (cards, tables, sparklines matching Mempool/LND aesthetics) and **three distinct top-level dashboards**. Don't force a unified screen — operators visit each for different reasons. JDS gets a tab inside Pool UI (since it's now embedded), not its own surface.

## Gaps requiring upstream PRs

The "v0" priority items hint that the existing `/api/v1/*` is a strong foundation but missing JDS / TP / mode / declared-jobs status. Three upstream PR targets:

1. **JDS status endpoint** — `/api/v1/jds` exposing declarations received/accepted/rejected, in-flight job table.
2. **Template provider status** — `/api/v1/template-provider` with type, current height, last received timestamp, mempool stats.
3. **JDC mode + fallback events** — `/api/v1/mode`, `/api/v1/events` with timestamped fallback transitions.

These are independent of the UI work and could be filed separately.

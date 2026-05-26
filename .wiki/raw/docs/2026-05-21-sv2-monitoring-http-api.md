---
title: SV2 monitoring HTTP API (sv2-apps@v0.4.0)
type: docs
source: local sv2-apps submodule + stratum-mining/sv2-ui repo
date: 2026-05-21
verified: 2026-05-26
volatility: hot
quality: 5
confidence: high
tags: [sv2, monitoring, openapi, axum, prometheus]
summary: Complete inventory of monitoring HTTP endpoints exposed by pool/translator/jd-client when monitoring_address is configured.
---

# SV2 monitoring HTTP API

The upstream `monitoring` cargo feature (gated on `stratum-apps/monitoring`) wires an Axum `Router` to `monitoring_address`. Every datum a UI would want is already exposed.

## Source files

- `sv2-apps/stratum-apps/src/monitoring/http_server.rs:247-264` — Router definition
- `sv2-apps/stratum-apps/src/monitoring/README.md` — endpoint table + Prometheus catalog
- `sv2-apps/stratum-apps/src/monitoring/{server,client,sv1,mod}.rs` — JSON schema (every type derives `serde::Serialize` + `utoipa::ToSchema`)
- `sv2-apps/.github/workflows/notify-monitoring-api-update.yaml` — files an issue in `stratum-mining/sv2-ui` whenever `openapi.json` changes
- `https://github.com/stratum-mining/sv2-ui` — upstream's own TypeScript UI (active 2026-05-22)

## Endpoint inventory (HTTP, no auth/CORS/TLS)

| Route | Format | Returns |
|---|---|---|
| `/` | JSON | Endpoint listing |
| `/swagger-ui` | HTML | Interactive Swagger UI |
| `/api-docs/openapi.json` | JSON | Full OpenAPI 0.1.0 spec (utoipa-generated, validated in CI) |
| `/api/v1/health` | JSON | `{status, timestamp}` |
| `/api/v1/global` | JSON | `GlobalInfo {server, sv2_clients, sv1_clients, uptime_secs}` |
| `/api/v1/server` | JSON | `{extended_channels_count, standard_channels_count, total_hashrate}` |
| `/api/v1/server/channels?offset&limit` | JSON | Paginated `Vec<ServerExtendedChannelInfo \| ServerStandardChannelInfo>` |
| `/api/v1/clients` | JSON | Paginated `Vec<Sv2ClientMetadata>` |
| `/api/v1/clients/{id}` | JSON | `Sv2ClientResponse` (counts + hashrate) |
| `/api/v1/clients/{id}/channels?offset&limit` | JSON | Paginated channels for that downstream client |
| `/api/v1/sv1/clients` | JSON | Paginated `Vec<Sv1ClientInfo>` (worker name, hashrate, extranonce, version-rolling mask) |
| `/api/v1/sv1/clients/{id}` | JSON | Single `Sv1ClientInfo` |
| `/metrics` | Prometheus text | `sv2_uptime_seconds`, `sv2_server_*`, `sv2_client_*`, `sv1_*` gauges |

Pagination defaults: `limit=25`, `max=100`.

## Per-service endpoint availability

| Service | `/server` | `/clients` | `/sv1/clients` |
|---|---|---|---|
| Pool (`pool_sv2`) | ❌ 404 | ✅ | ❌ |
| JDC (`jd_client_sv2`) | ✅ (its upstream pool) | ✅ (downstream miners) | ❌ |
| Translator (`translator_sv2`) | ✅ (its SV2 upstream) | ❌ | ✅ |

Wiring in `sv2-apps`:
- Pool: `pool-apps/pool/src/lib/mod.rs:164-190` — `server_monitoring=None`, `sv2_clients_monitoring=Some(channel_manager)`
- JDC: `miner-apps/jd-client/src/lib/mod.rs:136-155` — both set
- Translator: `miner-apps/translator/src/lib/mod.rs:171-188` — `server_monitoring=Some`, `with_sv1_monitoring(sv1_server)`

## Refresh semantics

`monitoring_cache_refresh_secs` (default 15s) drives a background `tokio::time::interval` that copies trait outputs into `RwLock<MonitoringSnapshot>` and syncs Prometheus gauges atomically. API requests never touch business-logic locks (DoS hardening — `snapshot_cache.rs:1-37`). Data can be up to one refresh interval stale.

## Gaps in upstream coverage

- No JDS-specific status endpoints
- No template-provider status (TP up/down, last template received)
- No JDC fallback/mode indicator endpoint
- No auth/TLS/CORS — port must be firewalled or behind a reverse proxy (StartOS's interface mechanism handles this)

## Implication

A pure-frontend UI is **fully viable** on top of this API. Both core dashboards (channels, hashrate, miner connections, vardiff) are available without writing new endpoints. JDS/TP/mode gaps are addressable as upstream PRs once a UI is in flight.

## Related

- [[2026-05-21-stratum-mining-sv2-ui-upstream]] — upstream UI under active development

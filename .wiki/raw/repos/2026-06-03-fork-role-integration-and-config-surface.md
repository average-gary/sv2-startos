---
title: "Per-role iroh integration: pool, jd-server, jd-client, translator, integration-tests"
type: repos
source: "https://github.com/average-gary/sv2-apps/tree/feat/iroh-transport (per-role files)"
date: 2026-06-03
quality: 5
credibility: high
relevance: direct
direction: supports
evidence_strength: "direct-code-inspection"
tags: [iroh, sv2-apps, fork-survey, pool, jd-client, jd-server, translator, integration-tests, dual-listener]
summary: "All four SV2 roles (pool, jd-server, jd-client, translator) get iroh wiring in lockstep; pool/jd-server run dual TCP+iroh listeners simultaneously; integration tests cover all roles + a TCP fallback test."
---

## Per-role wiring (additions visible in the diff)

**Pool** (`pool-apps/pool`)
- `Cargo.toml`: `iroh-transport = ["stratum-apps/iroh-transport", "jd_server_sv2/iroh-transport"]`
- `src/lib/config.rs`: +64 lines — adds `iroh: Option<IrohRoleConfig>` to `PoolConfig`
- `src/lib/io_task.rs`: +136 lines — dual-listener wiring
- `src/lib/template_receiver/sv2_tp/mod.rs`: +216 / -66 — TP-dial side picks transport
- `src/lib/channel_manager/mod.rs`: +191 / -34 — accepts connections from either listener
- `src/lib/mod.rs`: +48 — top-level start path
- 3 config-example TOML files updated with commented `[iroh]` blocks

**JD Server** (`pool-apps/jd-server`)
- `src/lib/config.rs`: +29 lines — adds iroh config
- New file: `src/lib/job_declarator/dual_listener.rs` (118 lines) — runs TCP + iroh listeners side-by-side

**JD Client** (`miner-apps/jd-client`)
- New file: `src/lib/transport.rs` (570 lines) — outbound-dial transport selection (TCP vs iroh)
- `src/lib/template_receiver/sv2_tp/mod.rs`: +108 / -66 — TP dial via either transport
- `src/lib/channel_manager/mod.rs`: +194 / -29
- `src/lib/upstream/mod.rs`: +54 / -24 — upstream pool dial uses transport.rs
- `src/lib/downstream/mod.rs`: +169 / -12

**Translator** (`miner-apps/translator`)
- `src/lib/config.rs`: +46 — iroh config
- `src/lib/sv2/upstream/mod.rs`: +117 / -67 — outbound pool dial via iroh

**Integration tests** (`integration-tests/tests/`)
- Four NEW test files, all gated `#![cfg(feature = "iroh-transport")]`:
  - `pool_integration_iroh.rs` (464 lines)
  - `jd_integration_iroh.rs` (437 lines)
  - `translator_integration_iroh.rs` (497 lines)
  - `fallback_iroh_to_tcp.rs` (610 lines) — explicitly covers the "iroh fails, fall back to TCP" path
- `lib/mock_roles.rs` +302 lines and `lib/utils.rs` +212 lines — shared test fixtures
- `mining_device/mod.rs` +74 — mining device can dial via iroh
- The maintainer's most recent commit message states: "stratum-apps lib tests still pass 151/151 with --features iroh-transport-monitoring."

## Config-example TOML excerpt (from the diff)

```toml
# Optional: enable iroh-transport alongside TCP. When this section is
# present AND the pool binary is compiled with the `iroh-transport` cargo
# feature, the pool listens on TCP AND iroh QUIC simultaneously; downstream
# clients can connect via either transport. Without the feature, the
# `[iroh]` section is silently ignored.
#
# [iroh]
# listen_address = "0.0.0.0:34256"
# secret_key_path = "~/.config/sv2/pool/iroh-secret.ed25519"
# discovery_relay_enable = true
# discovery_pkarr_pub_enable = true
# discovery_pkarr_res_enable = true
# discovery_dht_enable = false
# discovery_n0_enable = true
# max_idle_timeout_secs = 60
# keep_alive_interval_secs = 30
# per_request_timeout_secs = 30
#
# [iroh.connection_overrides]
# # "k51..." = "1.2.3.4:34256"
#
# [iroh.admission]
# mode = "open"
# # mode = "whitelist"
# allowed_node_ids = []
```

## Important design decisions

- **Pool/JDS dual-listen**: server roles bind TCP and iroh simultaneously; clients can choose. No silent migration — operator opts in via TOML.
- **JDC/translator outbound transport selection**: 570-line `transport.rs` in jd-client centralizes the dial logic — same code path picks TCP or iroh based on config.
- **No fallback variants** at the connection level: commit `b42c3dc2` explicitly drops `IrohThenTcp` / `TcpThenIroh` fallback variants. Per-connection it's one or the other; redundancy comes from the server-side dual-listen, not from in-flight failover.
- **Fallback test exists** at the deployment level: `fallback_iroh_to_tcp.rs` (610 lines) is the largest single test, suggesting the maintainer cares deeply about graceful degradation.

## Implication for thesis

Strongly supports the user-setup-ergonomics variable. Every role learns iroh in lockstep, configs are additive (`[iroh]` block can be omitted entirely for old behaviour), and the dual-listen server pattern means a StartOS-packaged pool can serve both TCP miners (legacy) and iroh miners (NAT-traversed) from a single deployment. Integration tests for all four roles + a fallback test give meaningful confidence that the change actually works end-to-end.

Counter-signal: 5 role surfaces × 67 files × ~5,700 LOC of new code is a non-trivial maintenance commitment for a single-maintainer fork. Every upstream change to channel_manager, downstream, upstream, io_task, or template_receiver creates a potential rebase conflict. Already happened twice in 9 days (two rebase commits in the 13-commit history).

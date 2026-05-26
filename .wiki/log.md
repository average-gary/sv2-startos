# Research log

## [2026-05-26] librarian | scanned 8 documents, 1 below threshold (cosmetic), 0 low-quality
- Wiki has no compiled wiki/ layer; scan adapted to raw/ + output/
- Avg staleness 70, avg quality 88. See .librarian/REPORT.md
- Recommendations: bump volatility hot, set verified:2026-05-26 on executed plan, tighten playbook frontmatter

## [2026-05-26] sweep | applied librarian recommendations
- volatility: hot on all 8 docs; verified: 2026-05-26 on all
- Plan + playbook now carry status: implemented; plan lists 10 implementing commits
- Playbook frontmatter gains a real sources: list
- _index.md updated; question-of-record marked answered
- Re-scan: avg staleness 95, avg quality 88, 0 stale, 0 low-quality

## [2026-05-21] init
Local wiki created for sv2-startos. Question of record: "How do we add a UI to these StartOS sv2 packages?"

## [2026-05-25] execute | Hashrate timeseries (Phase 6 follow-up)
- TimeseriesProvider context above the router so the ring buffer survives navigation
- 60-sample ring (5 minutes at 5s tick) keyed by metric name
- Hand-rolled SVG Sparkline (5 tones, area fill, endpoint dot, no chart library)
- MetricCard accepts trend + trendTone props
- Pool: pool.hashrate + pool.miners. Translator: translator.hashrate + translator.upstream. JDC: jdc.hashrate + jdc.upstream
- Bundle +~3 KB gzipped. Zero new deps.
- All three .s9pks rebuilt: sv2-pool 111 MB, sv2-tproxy 111 MB, sv2-jd-client 112 MB

## [2026-05-25] execute | Pioneer Hash UI v0 — Phase 5 polish complete
- Brand kit: Field Station system shipped (Fraunces + JetBrains Mono, beacon-amber, chart-paper grid). See ui/BRAND.md
- ErrorBoundary at route level with Field-Station-styled fallback
- Skeleton placeholders (MetricCardSkeleton, MetricGridSkeleton, TableSkeleton, KvSkeleton) wired through QueryGuard
- LastUpdated indicator surfacing dataUpdatedAt + amber-when-stale
- CopyButton + CopyableValue primitives; Pool now exposes authority pubkey + listen address
- JDC dashboard depth: mode badge + blurb, conditional upstream-channel section (hidden in SoloMining), connection card, downstream miner table
- Translator dashboard: aggregated share telemetry card (submitted/accepted/rejected/accept-rate, color-coded thresholds)
- A11y pass: skip link, semantic landmarks (banner/main/contentinfo), focus-visible rings on nav, aria-live on status pill, tabIndex=-1 main + outline-none for skip-link target
- Per-service UI.md docs (pool/translator/jd-client)
- All three services typecheck + build clean; bundle ~85 KB gzipped

## [2026-05-21] execute | Pioneer Hash UI v0 implementation (Phase 0–4)
- Phase 0: confirmed via mempool-startos that sibling daemons in one .s9pk share network → localhost:9090 works
- Phase 1: scaffolded ui/ workspace (Vite + React + TS + Tailwind), bundle 82 KB gzipped per service
- Phase 2-4: per-service Dockerfile.ui + manifest 'sv2-{svc}-ui' image + interfaces 'ui'-typed + main.ts UI daemon chained with requires:['primary']
- Forced monitoring_address = 0.0.0.0:9090 in all three rendered configs so sidecar always has data
- Caddy:alpine sidecar (~25 MB) + Go configd co-process (3 MB) for TOML→JSON config view with secret redaction
- All TS typechecks clean
- Phase 5 verification: full `make` produced three signed .s9pk files with both daemons:
  - sv2-pool 113 MB (0.4.0-0.3.0:0) — images: [sv2-pool, sv2-pool-ui]
  - sv2-tproxy 97 MB (0.4.0-0.2.5:0) — images: [sv2-tproxy, sv2-tproxy-ui]
  - sv2-jd-client 106 MB (0.4.0-0.2.0:0) — images: [sv2-jd-client, sv2-jd-client-ui]
- Sizes grew ~40 MB each from the bare build (Caddy:alpine + configd + SPA, doubled across aarch64+x86_64)
- Commit b95f2e1

## [2026-05-21] plan | "custom Pioneer Hash UI for sv2 daemons" → output/plan-pioneer-hash-sv2-ui-2026-05-21.md (7 articles consulted, 8 decisions, 6 phases)
- Format: spec (technical specification with architecture, APIs, data models)
- Stack locked: Vite + React + TS + Tailwind (matches sv2-ui)
- Hosting: Caddy sidecar, single origin (proxies /api/* to monitoring port :9090)
- Config view: configd Go co-process reading /data/config.toml RO, redacted
- v0 scope: ~12 working days (6 phases)
- Major open question: StartOS inter-daemon networking (Phase 0 spike)

## [2026-05-21] research | "Adding a UI to these StartOS sv2 packages" → 6 sources ingested, 1 playbook compiled
- 5 parallel agents (sub-questions: SDK surfaces, reference packages, monitoring API, info architecture, integration paths)
- Headline finding: `stratum-mining/sv2-ui` already exists upstream
- Recommended path: Caddy sidecar bundling `sv2-ui`, with parallel upstream PR for embed via rust-embed
- Output: `output/playbook-startos-package-ui-2026-05-21.md`
- Suggested follow-up rounds: investigate sv2-ui build artifacts; StartOS inter-daemon networking; SSL cert handling for 'ui' interfaces

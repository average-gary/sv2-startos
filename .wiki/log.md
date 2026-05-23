# Research log

## [2026-05-21] init
Local wiki created for sv2-startos. Question of record: "How do we add a UI to these StartOS sv2 packages?"

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

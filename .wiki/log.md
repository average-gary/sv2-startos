# Research log

## [2026-05-21] init
Local wiki created for sv2-startos. Question of record: "How do we add a UI to these StartOS sv2 packages?"

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

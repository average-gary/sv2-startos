---
title: SV2 StartOS Package Knowledge Base
type: wiki
created: 2026-05-21
updated: 2026-05-26
sources: 6
articles: 0
status: implemented
---

# SV2 StartOS Package Knowledge Base

Local research wiki for the `sv2-startos` repo — Stratum V2 (pool, translator, jd-client) packaged for StartOS / Start9.

## Question of record

**How do we add a UI to the SV2 StartOS packages?** → **Answered & shipped** in commits `1b1d9a6..f2f8a5c`.

→ See [[output/playbook-startos-package-ui-2026-05-21]] for the playbook and [[output/plan-pioneer-hash-sv2-ui-2026-05-21]] for the implemented spec.

## Headline finding (2026-05-21)

Upstream `stratum-mining/sv2-ui` is **already being built** as a TypeScript UI against the same OpenAPI 0.1.0 spec we just wired up via `monitoring_address`. Bundling it as a Caddy sidecar is the path of least resistance.

## Sources

- `raw/docs/2026-05-21-startos-sdk-ui-surfaces.md` — every UI surface @start9labs/start-sdk exposes
- `raw/docs/2026-05-21-sv2-monitoring-http-api.md` — full endpoint inventory of upstream's HTTP API
- `raw/articles/2026-05-21-startos-multi-container-pattern.md` — three packaging archetypes from real .s9pk examples
- `raw/articles/2026-05-21-startos-ui-integration-paths.md` — embed / sidecar / external comparison
- `raw/articles/2026-05-21-sv2-ui-information-architecture.md` — what to show per service
- `raw/repos/2026-05-21-stratum-mining-sv2-ui-upstream.md` — upstream's own UI repo

## Outputs

- `output/playbook-startos-package-ui-2026-05-21.md` — actionable playbook (high-level decision tree)
- `output/plan-pioneer-hash-sv2-ui-2026-05-21.md` — implementation **spec** for the custom Pioneer Hash UI

## Source counts

| Type | Count |
|---|---|
| docs | 2 |
| articles | 3 |
| repos | 1 |
| papers | 0 |
| data | 0 |

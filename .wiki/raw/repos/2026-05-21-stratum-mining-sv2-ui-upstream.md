---
title: stratum-mining/sv2-ui — upstream's own TypeScript UI
type: repos
source: github.com/stratum-mining/sv2-ui
date: 2026-05-21
verified: 2026-05-26
volatility: hot
quality: 4
confidence: high
tags: [sv2, ui, typescript, upstream]
summary: SRI is already building a TypeScript UI against the monitoring OpenAPI spec. Last push 2026-05-22.
---

# stratum-mining/sv2-ui

Upstream Stratum Reference Implementation is building its own UI consuming the same monitoring HTTP API we wired into the StartOS configs.

- **Repo:** https://github.com/stratum-mining/sv2-ui
- **Language:** TypeScript
- **Default branch:** main
- **Last push:** 2026-05-22 (active)
- **Description:** "Stratum V2 applications UI"

## Coupling to sv2-apps

`sv2-apps/.github/workflows/notify-monitoring-api-update.yaml` files an issue in this repo whenever `openapi.json` changes — using the `SV2_UI_TOKEN` secret. So upstream maintains a tight coupling between the Rust API and the TS client.

## Strategic implication for sv2-startos

**Major.** Before greenfielding a StartOS UI, evaluate whether `sv2-ui` is suitable as-is or with minor wrapping. Two options:

1. **Bundle `sv2-ui` directly** — pull the upstream UI as a release artifact / npm package / git submodule and serve it as a static SPA from a sidecar (caddy/nginx) or an extended Rust binary route. We benefit from upstream's design effort and stay aligned automatically as the OpenAPI evolves.

2. **Fork or write our own** — only justified if `sv2-ui` makes design choices that don't fit the StartOS audience (e.g., assumes desktop-only, no mobile responsiveness, no Pioneer Hash branding hook).

Recommendation: investigate `sv2-ui`'s build artifacts (does it ship a static `dist/` bundle? Is it consumable as a library?) before committing to any UI work. Save weeks.

## Investigation TODO (next research round)

- What does the `sv2-ui` build pipeline produce? (npm package? Docker image? static `dist/`?)
- Tech stack — React? Svelte? Solid? Angular?
- Routing — is it a single-page app expecting host paths, or does it work as a static bundle behind nginx?
- License — MIT / Apache?
- Branding — does it accept config / theming, or is it visually fixed?
- Per-service support — does it know how to render Pool vs JDC vs Translator differently? Or is it one generic "monitoring" view?

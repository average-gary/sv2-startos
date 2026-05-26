---
title: "Playbook: Adding a UI to the SV2 StartOS packages"
type: playbook
created: 2026-05-21
verified: 2026-05-26
volatility: hot
status: implemented
sources:
  - raw/docs/2026-05-21-sv2-monitoring-http-api.md
  - raw/docs/2026-05-21-startos-sdk-ui-surfaces.md
  - raw/articles/2026-05-21-sv2-ui-information-architecture.md
  - raw/articles/2026-05-21-startos-ui-integration-paths.md
  - raw/articles/2026-05-21-startos-multi-container-pattern.md
  - raw/repos/2026-05-21-stratum-mining-sv2-ui-upstream.md
---

# Playbook — Adding a UI to the SV2 StartOS packages

## Question

How do we add a UI to the `pool`, `translator`, and `jd-client` StartOS packages?

## Headline finding

**The work is mostly already done upstream.** Three independent factors stack:

1. `sv2-apps@v0.4.0` already ships an Axum HTTP server with a fully-typed OpenAPI 0.1.0 spec (utoipa-validated in CI) — see [[../raw/docs/2026-05-21-sv2-monitoring-http-api]].
2. `stratum-mining/sv2-ui` is **already being built** as a TypeScript UI consuming that exact API. Active as of 2026-05-22 — see [[../raw/repos/2026-05-21-stratum-mining-sv2-ui-upstream]].
3. StartOS supports multi-daemon packages out of the box (BTCPay-startos runs 4 daemons in one `.s9pk`).

The path of least resistance: bundle `sv2-ui` as a sidecar Caddy image in each StartOS package. Most of the heavy lifting (API, schema, frontend) is already someone else's problem.

## Step-by-step

### Step 1 — Investigate `sv2-ui` (do this first, before any code)

Before committing to bundle-vs-rebuild, evaluate `stratum-mining/sv2-ui`:

- What does the build pipeline produce? (`npm pack`? Docker image? static `dist/`?)
- Tech stack — React / Svelte / Solid / Angular / Vue?
- Is it a single-page app expecting a host path, or static-bundle behind nginx?
- License — MIT/Apache compatible with StartOS distribution?
- Branding — does it accept theming/config, or is it visually fixed?
- Per-service UX — one generic "monitoring" view, or distinct Pool / JDC / Translator dashboards (see [[../raw/articles/2026-05-21-sv2-ui-information-architecture]])?

If `sv2-ui` is **bundleable as-is or with minor wrapping** → skip to Step 3.
If `sv2-ui` is **unsuitable** (locked to one specific deployment, no Pioneer Hash branding hook, missing key surfaces) → go to Step 2 (build our own).

### Step 2 — Decide on greenfield UI (only if Step 1 rules out `sv2-ui`)

Build a small SPA against the OpenAPI spec at `sv2-apps/stratum-apps/src/monitoring/openapi.json`. Generate a typed client via `openapi-typescript` or `@openapitools/openapi-generator-cli`.

Information architecture is described in [[../raw/articles/2026-05-21-sv2-ui-information-architecture]] — three distinct dashboards, shared component kit:

- **Pool** — connected downstreams, hashrate, blocks found, JDS status
- **Translator** — connected SV1 miners, vardiff state, upstream pool, share ratios
- **JDC** — mode badge, current upstream/JDS, declared jobs in flight, fallback events

Some "v0" widgets need upstream additions (JDS endpoint, TP status endpoint, JDC mode/fallback endpoint). File those as separate PRs — they're useful regardless of which UI consumes them.

Tech recommendation: **SvelteKit static** or **Solid + Vite static** — small bundle (~50-200 KB), trivial to bake into a Caddy image, plays well with TypeScript (the existing StartOS SDK is TS).

### Step 3 — Sidecar integration (recommended path for v0)

For each of `pool/`, `translator/`, `job-declaration-client/`:

#### 3a. `manifest.ts` — declare a second image

```ts
images: {
  'sv2-pool': { source: { dockerBuild: { dockerfile: 'Dockerfile', workdir: '.' } }, arch: architectures },
  'sv2-pool-ui': { source: { dockerBuild: { dockerfile: 'Dockerfile.ui', workdir: '.' } }, arch: architectures },
}
```

Or if bundling `sv2-ui` directly via prebuilt image:
```ts
'sv2-pool-ui': { source: { dockerTag: 'stratum-mining/sv2-ui:vX.Y.Z' }, arch: architectures }
```

#### 3b. `Dockerfile.ui` (per service, building a Caddy-served SPA)

```dockerfile
FROM node:20-alpine AS frontend
WORKDIR /build
# clone or copy sv2-ui source
RUN git clone https://github.com/stratum-mining/sv2-ui . && npm ci && npm run build

FROM caddy:2-alpine
COPY --from=frontend /build/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 80
```

`Caddyfile`:
```
:80 {
    root * /srv
    try_files {path} /index.html
    file_server
    handle /api/* {
        reverse_proxy localhost:9090
    }
}
```

#### 3c. `main.ts` — add UI daemon after primary

```ts
const uiSubcontainer = await sdk.SubContainer.of(
  effects,
  { imageId: 'sv2-pool-ui' },
  sdk.Mounts.of(),
  'sv2-pool-ui-sub',
)

return sdk.Daemons.of(effects, started)
  .addDaemon('primary', { subcontainer, exec: { command: ['pool_sv2', '-c', '/data/config.toml'] }, ready: { ... }, requires: [] })
  .addDaemon('ui', {
    subcontainer: uiSubcontainer,
    exec: { command: ['caddy', 'run', '--config', '/etc/caddy/Caddyfile'] },
    ready: {
      display: 'Pioneer Hash SV2 Pool UI',
      fn: () => sdk.healthCheck.checkPortListening(effects, 80, { ... }),
    },
    requires: ['primary'],
  })
```

#### 3d. `interfaces.ts` — add a `'ui'`-typed interface

```ts
const uiMulti = sdk.MultiHost.of(effects, 'ui-multi')
const uiMultiOrigin = await uiMulti.bindPort(80, { protocol: 'http' })
const uiInterface = sdk.createInterface(effects, {
  name: 'Pioneer Hash SV2 Pool Dashboard',
  id: 'pool-ui',
  description: 'Web dashboard for the SV2 pool',
  type: 'ui',          // critical — this gives the "Launch UI" button
  masked: false,
  schemeOverride: null,
  username: null,
  path: '',
  query: {},
})
const uiReceipt = await uiMultiOrigin.export([uiInterface])

return [downstreamReceipt, uiReceipt]
```

The `'ui'` type is what makes StartOS render a "Launch UI" button that opens the dashboard in a new browser tab — see [[../raw/docs/2026-05-21-startos-sdk-ui-surfaces]]. StartOS auto-publishes Tor `.onion`, LAN `.local`, IPv4/IPv6, and ACME public-domain addresses for the new port without per-package wiring.

#### 3e. `Dependencies` — wire the UI sidecar to talk to the binary

The Caddy sidecar reaches `pool_sv2`'s monitoring server on `localhost:9090` only if both daemons share a network namespace. By default, StartOS `SubContainer`s run with their own networks. **Open question** — investigate during implementation: does StartOS provide a "shared network" or "service discovery" primitive between sibling daemons in one .s9pk? Check `mempool-startos` for how its frontend reaches its backend across containers; that's the reference. (Likely answer: they share a hostname like `sv2-pool-primary.local` resolvable inside the package.)

### Step 4 — Wire `monitoring_address` to expose the API to the sidecar

The recently-added `monitoring_enabled` toggle in `setConfig.ts` defaults to `false`. For the UI to work, `monitoring_address` must be set to a known internal address (e.g., `127.0.0.1:9090` or `0.0.0.0:9090` per StartOS's network model).

Two options:
1. **Auto-enable monitoring whenever the UI is on**: in `main.ts`, force `monitoring_address` regardless of UI config. Simplest.
2. **Document that the user must enable monitoring**: less magical, more configurable.

Recommendation: option 1 — bake monitoring into the rendered config when the UI sidecar is part of the daemon graph. The user shouldn't have to learn a separate toggle to make the dashboard work.

### Step 5 — Upstream PRs (parallel track to Path 1 / replacement for sidecar)

Once the sidecar is shipping and operators have a UI, file these upstream:

1. **`/api/v1/jds`** endpoint exposing JDS-embedded-in-pool status (declarations received/accepted/rejected, in-flight job table)
2. **`/api/v1/template-provider`** endpoint with TP type, current height, last template received timestamp, mempool stats when IPC is on
3. **`/api/v1/mode`** + **`/api/v1/events`** for JDC mode + fallback transitions
4. **`--ui` cargo feature** wrapping `rust-embed` + an axum static-file route — once accepted, retire the sidecar in favor of Path 1 (smaller image, unified surface)

## Decision tree summary

```
Is sv2-ui bundleable as-is?
├── Yes → Step 3 (sidecar with prebuilt sv2-ui image)
└── No  → Step 2 (greenfield SPA) → Step 3 (sidecar with our image)

After Step 3 ships:
└── File upstream PRs (Step 5)
    └── When --ui feature lands upstream:
        └── Migrate to Path 1 (embed in pool_sv2 binary)
```

## Sources

- [[../raw/docs/2026-05-21-startos-sdk-ui-surfaces]] — what the SDK exposes
- [[../raw/articles/2026-05-21-startos-multi-container-pattern]] — three packaging archetypes
- [[../raw/docs/2026-05-21-sv2-monitoring-http-api]] — endpoint inventory
- [[../raw/repos/2026-05-21-stratum-mining-sv2-ui-upstream]] — upstream UI repo
- [[../raw/articles/2026-05-21-sv2-ui-information-architecture]] — what to show per service
- [[../raw/articles/2026-05-21-startos-ui-integration-paths]] — path comparison

## Next research rounds (suggested)

If the user wants more depth, these are the natural follow-ups:

1. **Investigate `stratum-mining/sv2-ui` build artifacts** (close the Step 1 question)
2. **StartOS inter-daemon networking** — how do sibling SubContainers reach each other?
3. **Performance characteristics of the monitoring snapshot cache** — under what load does staleness become a problem?
4. **SSL/cert handling** — does StartOS auto-provision LetsEncrypt for `'ui'` interfaces, or only for explicitly configured public domains?

## Suggested theses (for `--mode thesis` future research)

- "Bundling `sv2-ui` as a sidecar reaches feature parity with a hand-built SPA in <40 hours of dev work."
- "The OpenAPI spec at `sv2-apps/stratum-apps/src/monitoring/openapi.json` covers ≥80% of operator-relevant data without upstream PRs."
- "Path 1 (embed in Rust binary) ships a smaller `.s9pk` than Path 2 (sidecar) by ≥30 MB once the UI bundle is non-trivial."

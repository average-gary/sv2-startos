---
title: "Plan: Pioneer Hash custom UI for SV2 daemons"
type: plan
format: spec
sources:
  - raw/docs/2026-05-21-sv2-monitoring-http-api.md
  - raw/docs/2026-05-21-startos-sdk-ui-surfaces.md
  - raw/articles/2026-05-21-sv2-ui-information-architecture.md
  - raw/articles/2026-05-21-startos-ui-integration-paths.md
  - raw/articles/2026-05-21-startos-multi-container-pattern.md
  - raw/repos/2026-05-21-stratum-mining-sv2-ui-upstream.md
  - output/playbook-startos-package-ui-2026-05-21.md
generated: 2026-05-21
---

# Spec — Pioneer Hash UI for SV2 daemons

## 1. Goals & Non-goals

### Goals
- Each StartOS package (`sv2-pool`, `sv2-tproxy`, `sv2-jd-client`) exposes a Pioneer Hash-themed web UI.
- UI provides **read-only monitoring** (live channel/miner state via `/api/v1/*`) and **read-only config view** (parses `/data/config.toml`).
- UI is per-daemon — each `.s9pk` ships its own dashboard scoped to that daemon's role.
- Same OpenAPI 0.1.0 contract as `stratum-mining/sv2-ui` so we get free upstream evolution.
- Tech stack matches `sv2-ui`: Vite + React + TypeScript + Tailwind. Components/types can be lifted from the submodule directly.
- Pioneer Hash branding: color palette, typography, logo, copy.

### Non-goals
- **Config editing.** All mutation stays in the StartOS Action Form (`setConfig.ts`). The UI links to it, doesn't replace it.
- **Authentication / RBAC.** StartOS-level access controls are sufficient; the UI inherits.
- **Multi-daemon dashboards.** Each `.s9pk` ships a single dashboard for its own daemon. No "fleet view".
- **Mobile-first design** for v0. Desktop-optimized; responsive enough that it doesn't break on phones.
- **Upstream PRs to sv2-apps** for v0. We work with the existing `/api/v1/*` surface; gaps are documented as v1 follow-ups.
- **Replacing the StartOS service-page chrome.** Health/log surfaces stay in StartOS; the UI focuses on rich data the StartOS UI can't show.

## 2. System Architecture

```
┌────────────────────────────── .s9pk (per service) ──────────────────────────────┐
│                                                                                 │
│  ┌────────────────────────────┐         ┌────────────────────────────────────┐  │
│  │ daemon: primary            │         │ daemon: ui                         │  │
│  │   image: sv2-{pool|...}    │  /api   │   image: sv2-{...}-ui              │  │
│  │   binary: pool_sv2 -c …    │◀────────│     caddy:2-alpine + /srv/dist     │  │
│  │   monitoring_address:      │  proxy  │     listens :80                    │  │
│  │     0.0.0.0:9090           │         │     reverse_proxy /api → :9090     │  │
│  │   listen_address: …:34254  │         │     mounts /data RO (config view)  │  │
│  │   mounts /data RW          │         │                                    │  │
│  └────────────────────────────┘         └────────────────────────────────────┘  │
│                                                                                 │
│  interfaces:                                                                    │
│    - pool-sv2  (type: api,  port: 34254)  ← downstream miners                   │
│    - pool-ui   (type: ui,   port: 80)     ← Pioneer Hash dashboard              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                          ▲
                          │ "Launch UI" button (new browser tab)
                          ▼
                ┌──────────────────┐
                │ StartOS Web App  │
                │  /service/:id    │
                └──────────────────┘
```

**Per-daemon architecture is identical**; only the source-of-truth endpoint set differs (see §4 for the per-service capability matrix).

### Why this shape

- **Sidecar pattern**: precedent set by `btcpayserver-startos` (4 daemons in one .s9pk) and confirmed by `start-sdk` `Daemons.d.ts` allowing chained `addDaemon` with `requires:` ordering. ([[../raw/articles/2026-05-21-startos-multi-container-pattern]])
- **Caddy sidecar (~20 MB) over Node (~150 MB)**: smallest reverse-proxy + static-server combo. No CORS to negotiate upstream. ([[../raw/articles/2026-05-21-startos-ui-integration-paths]])
- **Single origin**: browser sees `http://pool.local/` for both the SPA and `/api/*`. No CORS preflight, no upstream patching. ([[../raw/docs/2026-05-21-sv2-monitoring-http-api]] notes the upstream axum server has no CORS middleware.)
- **`type: 'ui'` interface**: yields a "Launch UI" button in the StartOS service page that opens the dashboard in a new tab. ([[../raw/docs/2026-05-21-startos-sdk-ui-surfaces]] — "StartOS does not embed an iframe.")
- **Config from disk, not API**: zero upstream PR; the same `/data` volume the daemon writes is mounted RO into the sidecar, which parses `config.toml` server-side and serves a `/config` endpoint to the SPA. (Caddy can't parse TOML, so a tiny Caddy module or a switch to nginx + a sidecar tool is needed — see §3.5.)

## 3. Component Design

### 3.1 Repository layout

```
sv2-startos/
├── ui/                              ← NEW (this spec)
│   ├── package.json                 # Vite + React + TS + Tailwind
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx
│   │   ├── app/
│   │   │   ├── routes.tsx          # /pool /translator /jdc + /config
│   │   │   ├── layouts/
│   │   │   └── theme/              # Pioneer Hash brand tokens
│   │   ├── api/                    # OpenAPI-typed client (see §4)
│   │   │   ├── client.ts
│   │   │   ├── generated/          # generated from openapi.json
│   │   │   └── hooks.ts            # @tanstack/react-query wrappers
│   │   ├── views/
│   │   │   ├── pool/               # Pool widgets (see info architecture)
│   │   │   ├── translator/
│   │   │   ├── jdc/
│   │   │   ├── config/             # Read-only config viewer
│   │   │   └── shared/             # Cards, tables, sparklines
│   │   ├── lib/
│   │   │   ├── service.ts          # Detects which service we're embedded in
│   │   │   └── format.ts           # Hashrate / sat / time formatters
│   │   └── styles/
│   │       ├── tailwind.css
│   │       └── tokens.ts           # Pioneer Hash colors / radii / shadows
│   ├── public/
│   │   ├── favicon.ico
│   │   └── pioneer-hash-logo.svg
│   └── caddy/
│       └── Caddyfile               # See §3.4
├── pool/
│   ├── Dockerfile.ui                ← NEW
│   └── startos/                     # existing, edited per §3.6
├── translator/
│   ├── Dockerfile.ui                ← NEW
│   └── startos/
└── job-declaration-client/
    ├── Dockerfile.ui                ← NEW
    └── startos/
```

**Single shared `ui/` source. Three thin per-service `Dockerfile.ui` files** that build the same code with a `VITE_SERVICE` env var (`pool` / `translator` / `jdc`) to select which views to mount and which API endpoints are valid.

### 3.2 React app — service-aware routing

```tsx
// src/lib/service.ts
export const SERVICE = import.meta.env.VITE_SERVICE as 'pool' | 'translator' | 'jdc'

// src/app/routes.tsx
import { SERVICE } from '../lib/service'

const routes = {
  pool:       <PoolDashboard />,
  translator: <TranslatorDashboard />,
  jdc:        <JdcDashboard />,
}[SERVICE]

// /         → routes (live monitoring)
// /config   → ConfigViewer (read-only)
```

Three top-level dashboards are independent React trees. The shared component kit (`src/views/shared/`) provides reusable primitives:

- `<MetricCard>` — number + label + trend
- `<Sparkline>` — small inline chart (we'll use `recharts` or `visx`)
- `<DataTable>` — paginated, sortable; consumes the API's `?offset&limit` cleanly
- `<StatusPill>` — colored badge (connected / reconnecting / error)
- `<KvTable>` — flat key-value display for config

### 3.3 OpenAPI-typed API client

Generate at build time from `sv2-apps/stratum-apps/src/monitoring/openapi.json`:

```bash
# scripts/gen-api.sh
npx openapi-typescript ../sv2-apps/stratum-apps/src/monitoring/openapi.json \
  -o src/api/generated/schema.ts
```

The client wraps `fetch` in @tanstack/react-query hooks for caching + background refetch:

```ts
// src/api/hooks.ts
import { useQuery } from '@tanstack/react-query'
import type { paths } from './generated/schema'

export const useGlobal = () =>
  useQuery({
    queryKey: ['global'],
    queryFn: () => fetch('/api/v1/global').then(r => r.json()),
    refetchInterval: 5_000,
  })
```

**Capability awareness**: not every daemon serves every endpoint. (Pool serves `/clients` only; JDC serves `/server` + `/clients`; Translator serves `/server` + `/sv1/clients`.) The hooks check `SERVICE` and short-circuit unsupported calls to avoid 404 noise. ([[../raw/docs/2026-05-21-sv2-monitoring-http-api]] §"Per-service endpoint availability")

### 3.4 Caddy sidecar

```
# ui/caddy/Caddyfile
{
  admin off
  auto_https off
}

:80 {
  root * /srv/dist
  encode gzip

  # API proxy — must come BEFORE try_files
  handle /api/* {
    reverse_proxy localhost:9090
  }

  # Config endpoint served by Caddy + a small TOML→JSON helper
  handle /config {
    reverse_proxy localhost:9091
  }

  # SPA fallback
  handle {
    try_files {path} /index.html
    file_server
  }
}
```

The `:9091` upstream is a tiny **TOML→JSON sidecar process** (see §3.5) running inside the same container.

### 3.5 Config viewer

Caddy alone can't parse TOML. Three options, ordered by simplicity:

**Option A (chosen)**: Bundle a 5-line static binary into the Caddy image that reads `/data/config.toml`, redacts secret fields, returns JSON on `:9091`. Written in Go (~3 MB) or TypeScript+Bun (~50 MB). Go wins on size.

```go
// ui/configd/main.go (sketch)
http.HandleFunc("/config", func(w http.ResponseWriter, r *http.Request) {
    var raw map[string]interface{}
    f, _ := os.ReadFile("/data/config.toml")
    toml.Unmarshal(f, &raw)
    redact(raw, []string{"authority_secret_key"})
    json.NewEncoder(w).Encode(raw)
})
http.ListenAndServe(":9091", nil)
```

Run as a co-process in the Caddy container via a tiny `entrypoint.sh`:

```sh
#!/bin/sh
configd &
exec caddy run --config /etc/caddy/Caddyfile
```

Redacted fields per service:
- pool: `authority_secret_key`
- translator: (none — no secrets in config)
- jd-client: `authority_secret_key`

The UI's `/config` view renders a `<KvTable>` of the JSON, plus a footer linking to the StartOS Action Form: "To change settings, use the **Configure** action in StartOS."

### 3.6 Per-service Dockerfile.ui

Pattern (one file per service, only the `VITE_SERVICE` arg differs):

```dockerfile
# ─── Stage 1: Build SPA ───
FROM node:20-alpine AS spa-builder
WORKDIR /build
COPY ui/package.json ui/package-lock.json ./
RUN npm ci
COPY ui/ ./
ARG VITE_SERVICE=pool
ENV VITE_SERVICE=$VITE_SERVICE
RUN npm run build      # → /build/dist

# ─── Stage 2: Build configd ───
FROM golang:1.22-alpine AS configd-builder
WORKDIR /build
COPY ui/configd/ ./
RUN CGO_ENABLED=0 go build -o configd .

# ─── Stage 3: Runtime ───
FROM caddy:2-alpine
COPY --from=spa-builder    /build/dist           /srv/dist
COPY --from=configd-builder /build/configd       /usr/local/bin/configd
COPY ui/caddy/Caddyfile                          /etc/caddy/Caddyfile
COPY ui/caddy/entrypoint.sh                      /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
```

**Resulting image**: ~25 MB (Caddy 20 MB + Go 3 MB + SPA 1-2 MB).

### 3.7 Per-service `startos/` edits

#### `manifest.ts` — add second image

```ts
images: {
  'sv2-pool': { source: { dockerBuild: { dockerfile: 'Dockerfile',    workdir: '.' } }, arch: architectures } as SDKImageInputSpec,
  'sv2-pool-ui': { source: { dockerBuild: { dockerfile: 'Dockerfile.ui', workdir: '.' } }, arch: architectures } as SDKImageInputSpec,
}
```

#### `interfaces.ts` — add `'ui'`-typed interface

```ts
export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const downstreamMulti       = sdk.MultiHost.of(effects, 'downstream-multi')
  const downstreamMultiOrigin = await downstreamMulti.bindPort(DOWNSTREAM_PORT, { protocol: null, addSsl: null, preferredExternalPort: DOWNSTREAM_PORT, secure: { ssl: false } })
  const downstream            = sdk.createInterface(effects, {
    name: 'Pioneer Hash SV2 Pool',
    id: 'pool-sv2',
    description: 'SV2 pool interface',
    type: 'api',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  const uiMulti       = sdk.MultiHost.of(effects, 'ui-multi')
  const uiMultiOrigin = await uiMulti.bindPort(80, { protocol: 'http' })
  const ui            = sdk.createInterface(effects, {
    name: 'Pioneer Hash SV2 Pool Dashboard',
    id: 'pool-ui',
    description: 'Pioneer Hash dashboard for live pool monitoring and config viewing',
    type: 'ui',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  return [
    await downstreamMultiOrigin.export([downstream]),
    await uiMultiOrigin.export([ui]),
  ]
})
```

#### `main.ts` — chain the UI daemon

```ts
const uiSubcontainer = await sdk.SubContainer.of(
  effects,
  { imageId: 'sv2-pool-ui' },
  sdk.Mounts.of().mountVolume({
    volumeId: 'main',
    subpath: null,
    mountpoint: '/data',
    readonly: true,         // UI reads config; never writes
  }),
  'sv2-pool-ui-sub',
)

const daemons = sdk.Daemons.of(effects, started)
  .addDaemon('primary', {
    subcontainer,
    exec: { command: ['pool_sv2', '-c', '/data/config.toml'] },
    ready: { /* existing checkPortListening on 34254 */ },
    requires: [],
  })
  .addDaemon('ui', {
    subcontainer: uiSubcontainer,
    exec: { command: ['/entrypoint.sh'] },
    ready: {
      display: 'Pioneer Hash SV2 Pool Dashboard',
      fn: () =>
        sdk.healthCheck.checkPortListening(effects, 80, {
          successMessage: 'Pioneer Hash dashboard is reachable',
          errorMessage:   'Dashboard is not ready',
        }),
    },
    requires: ['primary'],
  })
```

The `requires: ['primary']` ensures the daemon is up before the dashboard starts. If `primary` fails, the dashboard health check fails too, so the StartOS service status reflects reality.

#### `setConfig.ts` — auto-enable monitoring

For the dashboard to function, `monitoring_address` MUST be set. Today it's gated by a `monitoring_enabled` toggle the user might forget. Solutions:

- **Option A (chosen)**: `main.ts` always renders `monitoring_address = "127.0.0.1:9090"` to the rendered TOML, regardless of the user-facing toggle. The user's toggle controls whether to also expose monitoring on a separate StartOS interface for external Prometheus scraping.
- Option B: drop the user toggle, monitoring is always on.

Choosing A keeps the existing UX while making the dashboard work out of the box.

## 4. API surface

The dashboard consumes the upstream `/api/v1/*` surface. Per-service capability matrix (from [[../raw/docs/2026-05-21-sv2-monitoring-http-api]]):

| Endpoint | Pool | Translator | JDC |
|---|---|---|---|
| `GET /api/v1/health` | ✅ | ✅ | ✅ |
| `GET /api/v1/global` | ✅ | ✅ | ✅ |
| `GET /api/v1/server` | ❌ | ✅ | ✅ |
| `GET /api/v1/server/channels?offset&limit` | ❌ | ✅ | ✅ |
| `GET /api/v1/clients` | ✅ | ❌ | ✅ |
| `GET /api/v1/clients/{id}` | ✅ | ❌ | ✅ |
| `GET /api/v1/clients/{id}/channels?offset&limit` | ✅ | ❌ | ✅ |
| `GET /api/v1/sv1/clients` | ❌ | ✅ | ❌ |
| `GET /api/v1/sv1/clients/{id}` | ❌ | ✅ | ❌ |
| `GET /metrics` (Prometheus text) | ✅ | ✅ | ✅ |
| `GET /api/v1/swagger-ui` | ✅ | ✅ | ✅ |

Plus our local additions:
| `GET /config` | served by `configd:9091` → redacted JSON of `/data/config.toml` |

## 5. Information architecture (per service)

Wholesale lifted from [[../raw/articles/2026-05-21-sv2-ui-information-architecture]]; only "v0" widgets are in scope for v0:

### Pool dashboard
1. Header strip: pool hashrate (now/1h/24h), connected miners, blocks found 24h, uptime
2. Connected downstreams table: channel type, share rate, accept/reject, target
3. Authority pubkey + connection URL (copy buttons)
4. Config view: read-only, link to "Configure" action

### Translator dashboard
1. Connected SV1 miners table: name, IP, 5m hashrate, accept/reject, current diff, last share
2. Aggregate hashrate (5m/1h/24h)
3. Upstream pool: URL, latency, channel ID, status
4. Vardiff state per miner: target, target shares/min, actual shares/min
5. Share accept/reject pool-wide + per-miner with reason breakdown
6. Config view: read-only, link to "Configure" action

### JDC dashboard
1. Mode badge (FullTemplate / CoinbaseOnly / SoloMining) — from config
2. Current upstream pool: URL, state, latency, share accept rate
3. Local hashrate pushed upstream
4. Config view: read-only, link to "Configure" action

JDS / Template Provider / Declared Jobs widgets are deferred to v1 pending upstream PRs to expand `/api/v1/*`.

## 6. Pioneer Hash branding

Token file (`ui/src/styles/tokens.ts`) defines the brand surface:

```ts
export const tokens = {
  colors: {
    // Pioneer Hash palette — confirm with brand assets
    primary:   '#F2A900',  // bitcoin orange (placeholder — replace with brand)
    secondary: '#1A1A2E',
    surface:   '#0F0F1A',
    text:      '#FFFFFF',
    muted:     '#9CA3AF',
    success:   '#10B981',
    warning:   '#F59E0B',
    error:     '#EF4444',
  },
  fonts: {
    sans: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  radii: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
  },
}
```

Wired into Tailwind via `tailwind.config.js` `theme.extend.colors = tokens.colors`. Brand assets (logo, favicon, illustrations) live in `ui/public/` and are populated from the Pioneer Hash brand kit.

## 7. Build & test

### Local dev

```bash
# Terminal 1: live UI
cd ui
npm install
VITE_SERVICE=pool npm run dev   # → http://localhost:5173

# Terminal 2: stub API (or point at a running pool's monitoring port)
# Vite proxies /api → http://localhost:9090 via vite.config.ts proxy config
```

### Per-service build (CI / `make`)

```bash
make pool                    # existing binary build + s9pk pack
make pool-ui                 # NEW — Dockerfile.ui only, faster iteration
make pool-fast               # NEW — assumes binary image is cached, rebuilds UI
```

Add to root `Makefile` per-service:
```make
$(SERVICE)-ui:
	cd $(SERVICE) && docker build -f Dockerfile.ui -t sv2-$(SERVICE)-ui:dev ../

$(SERVICE)-fast:
	$(MAKE) $(SERVICE)-ui
	# manual or scripted swap into a running container
```

### Tests

- **TS**: `tsc --noEmit` on the `ui/` workspace, plus the existing per-service `tsc` runs.
- **Unit**: vitest for util/format functions and API-hook contracts. No UI snapshots.
- **Smoke**: `npm run build` must complete with no warnings.
- **Integration**: spin up the resulting `.s9pk` on a dev StartOS box, click Launch UI, exercise each view manually for v0. No e2e harness yet.

## 8. Implementation phases

### Phase 1 — Scaffold the shared UI (~3 days)
- Create `ui/` workspace with Vite + React + TS + Tailwind
- Pioneer Hash design tokens + Tailwind config
- OpenAPI codegen script
- Shared component kit: `MetricCard`, `Sparkline`, `DataTable`, `StatusPill`, `KvTable`
- Service-aware routing (`SERVICE` env var)
- Stub all three dashboards as placeholder pages

**Validation**: `npm run dev` renders a Pioneer Hash-themed shell for each `VITE_SERVICE` value.

### Phase 2 — Pool dashboard (~3 days)
- Implement Pool view: header strip + connected downstreams table
- Wire `/api/v1/global` and `/api/v1/clients` via @tanstack/react-query
- Add `configd` Go binary + Caddyfile + entrypoint
- `pool/Dockerfile.ui` + `pool/startos/{manifest,interfaces,main}.ts` edits
- Auto-enable `monitoring_address = 127.0.0.1:9090` in `main.ts` rendered TOML

**Validation**: `make pool` builds successfully; install on dev StartOS; "Launch UI" opens a Pioneer Hash dashboard showing live pool data.

### Phase 3 — Translator dashboard (~2 days)
- Translator view: SV1 miner table + aggregate hashrate + upstream + vardiff + reject reasons
- Wire `/api/v1/server` and `/api/v1/sv1/clients{,/:id}`
- `translator/Dockerfile.ui` + `translator/startos/*` edits
- Auto-enable monitoring

**Validation**: install on dev StartOS with an SV1 miner connected; UI shows the miner's hashrate ramping.

### Phase 4 — JDC dashboard (~2 days)
- JDC view: mode badge + upstream + local hashrate
- Wire `/api/v1/server` and `/api/v1/clients`
- `job-declaration-client/Dockerfile.ui` + `job-declaration-client/startos/*` edits
- Auto-enable monitoring

**Validation**: install on dev StartOS; switch JDC mode via Configure action; UI reflects new mode.

### Phase 5 — Polish + docs (~2 days)
- Empty states, loading skeletons, error boundaries
- Responsive grid (desktop-first; not broken on mobile)
- Accessibility pass (focus order, aria labels)
- README per service describing what the dashboard shows
- Update `.wiki/_index.md` and `log.md` with shipped state

**Validation**: full build passes; `make` produces all three `.s9pk` files; lighthouse score ≥ 80.

### Phase 6 — v1 follow-ups (deferred, separate work)
- Upstream PRs for: `/api/v1/jds`, `/api/v1/template-provider`, `/api/v1/mode`, `/api/v1/events`
- Add JDS / TP / declared-jobs / fallback-events widgets once endpoints exist
- Hashrate timeseries (Prometheus `/metrics` ingestion in the dashboard, or external Prometheus + Grafana)

**Total v0 scope**: ~12 working days.

## 9. Risks & Mitigations

| Risk | Source | Mitigation |
|---|---|---|
| **Inter-daemon networking unknown.** The Caddy sidecar reaches `pool_sv2:9090` only if both daemons share a network namespace. StartOS may put each `SubContainer` in its own. | [[../output/playbook-startos-package-ui-2026-05-21]] gap #2 | Phase 0 spike: read `mempool-startos`'s frontend↔backend wiring; replicate. If StartOS forces separate nets, fall back to `host.docker.internal`-style or a shared volume socket. |
| **Caddy can't parse TOML for the config view.** | This spec §3.5 | Bundle 3 MB Go `configd` co-process in the Caddy container. |
| **Bundle size creep.** Vite + React + recharts + tanstack-query can hit 300+ KB gzipped. | General React experience | Tree-shake; lazy-load per-service routes; budget: ≤200 KB gzipped per dashboard. |
| **Pioneer Hash brand assets not yet defined.** | Spec §6 | Use placeholder bitcoin-orange palette; swap in real brand kit when delivered. Ship a `tokens.ts` knob so the swap is one PR. |
| **`monitoring_cache_refresh_secs` introduces up to 15s staleness.** Operators may expect realtime. | [[../raw/docs/2026-05-21-sv2-monitoring-http-api]] §"Refresh semantics" | Show "Last updated Ns ago" UI everywhere. Default `refetchInterval: 5s` so most data is fresher than the cache. Cache staleness is bounded and documented. |
| **OpenAPI drift.** Upstream `openapi.json` evolves; our codegen breaks. | [[../raw/repos/2026-05-21-stratum-mining-sv2-ui-upstream]] notes the upstream CI files an issue when the spec changes | CI step: regenerate types and fail the build if the diff is non-empty. Pin to `sv2-apps@v0.4.0`'s spec; bump deliberately. |
| **Caddy's auto-https grabs port 80** | Caddy default behavior | `auto_https off` in Caddyfile (already in §3.4). |
| **Sidecar runs as root by default.** | Caddy alpine image | Set `USER 1000:1000` in stage 3; verify Caddy + configd both run unprivileged. |

## 10. Open questions

1. **StartOS inter-daemon networking** — confirmed unknown; needs Phase 0 spike. Likeliest answer is "all daemons in one .s9pk share the package's network and resolve each other on `localhost`," but this needs verification in `start-os` source or via a smoke test.
2. **Pioneer Hash brand kit** — color palette, logo SVG, typeface license. Need delivery before Phase 5.
3. **Should the dashboard expose a "Restart daemon" button?** Stays in StartOS UI scope per non-goals, but worth confirming.
4. **`configd` redaction list** — is there anything beyond `authority_secret_key` that should be hidden? (e.g., `tp_authority_public_key` if treated as private?)

## 11. Sources consulted

- [[../raw/docs/2026-05-21-sv2-monitoring-http-api]] — full API surface + per-service capability matrix
- [[../raw/docs/2026-05-21-startos-sdk-ui-surfaces]] — `'ui'` interface mechanics, no iframes, Tor/LAN auto-publish
- [[../raw/articles/2026-05-21-sv2-ui-information-architecture]] — widget priority lists per service
- [[../raw/articles/2026-05-21-startos-ui-integration-paths]] — sidecar vs embed comparison
- [[../raw/articles/2026-05-21-startos-multi-container-pattern]] — BTCPay precedent for multi-daemon `.s9pk`
- [[../raw/repos/2026-05-21-stratum-mining-sv2-ui-upstream]] — sv2-ui submodule reference
- [[../output/playbook-startos-package-ui-2026-05-21]] — predecessor playbook
- `sv2-ui/package.json` — confirmed Vite + React + TS + Tailwind for stack alignment

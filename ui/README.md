# Pioneer Hash SV2 UI

Shared React/Vite/TS/Tailwind workspace producing **three** dashboards (one per service) from one source. Built into a Caddy:alpine sidecar image and bundled into each service's `.s9pk`.

See `.wiki/output/plan-pioneer-hash-sv2-ui-2026-05-21.md` for the full spec.

## Local development

```bash
cd ui
npm install
VITE_SERVICE=pool npm run dev      # → http://localhost:5173
VITE_SERVICE=translator npm run dev
VITE_SERVICE=jdc npm run dev
```

The Vite dev server proxies `/api` to `localhost:9090` (the service's monitoring port) and `/config` to `localhost:9091` (`configd`). Run a real `pool_sv2 -c …` (or use a stub) on those ports for live data.

## Build

```bash
VITE_SERVICE=pool npm run build    # → dist/
```

The per-service `Dockerfile.ui` invokes this with the right `VITE_SERVICE` value during the `.s9pk` build.

## API typings

Hand-rolled in `src/api/client.ts` to mirror `sv2-apps/stratum-apps/src/monitoring/openapi.json` at the spec date. To regenerate from the upstream OpenAPI:

```bash
npm run gen:api      # writes src/api/generated/schema.ts
```

(Then optionally swap the hand-rolled interfaces for the generated ones.)

# Translator — Pioneer Hash Field Station

The `sv2-tproxy` package ships a Pioneer Hash dashboard alongside the
`translator_sv2` binary. After install, click **Launch UI** on the StartOS
service page.

## What you can see

- **Overview**: total hashrate, SV1 miner count, uptime, service version
- **Upstream channel**: SV2 link to the pool — extended/standard channel
  counts, upstream hashrate
- **Share telemetry**: aggregated submitted / accepted / rejected counts and
  accept-rate (color-coded — amber under 99%, rust under 95%)
- **Connected SV1 miners**: per-worker view — name, hashrate, current
  difficulty, share counts, last share time

## What you can't do here

Configuration changes happen in StartOS, not the dashboard. Use **Service →
Configure** in StartOS to edit translator settings (pool address, vardiff,
extranonce size). The **Config** tab in the dashboard displays current values.

## Architecture

```
sv2-tproxy .s9pk
├── primary daemon: translator_sv2 -c /data/config.toml
│   └── monitoring HTTP on 0.0.0.0:9090
└── ui daemon: caddy + configd
    ├── port 80 → SPA static
    ├── /api/* → reverse_proxy localhost:9090
    └── /config → configd (TOML→JSON)
```

See `../ui/BRAND.md` for the design system.

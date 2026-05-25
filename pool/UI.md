# Pool — Pioneer Hash Field Station

The `sv2-pool` package ships a Pioneer Hash dashboard alongside the `pool_sv2`
binary. After install, click **Launch UI** on the StartOS service page.

## What you can see

- **Overview**: pool hashrate, connected miner count, uptime, service version
- **Connection**: listen address + authority pubkey with one-click copy buttons
  (share these with your downstreams)
- **Connected downstreams**: live SV2 client list — user identity, hashrate,
  channel count, connect time

The dashboard refreshes every 5 seconds. Data may be up to
`monitoring_cache_refresh_secs` (default 15s) stale — the "Last sync" indicator
on each section shows you exactly how fresh.

## What you can't do here

Configuration changes happen in StartOS, not the dashboard. Use **Service →
Configure** in StartOS to edit pool settings; the **Config** tab in the
dashboard only displays the current values (with `authority_secret_key`
redacted).

## Architecture

The UI is a sidecar daemon in this `.s9pk`:

```
sv2-pool .s9pk
├── primary daemon: pool_sv2 -c /data/config.toml
│   └── monitoring HTTP on 0.0.0.0:9090
└── ui daemon: caddy + configd
    ├── port 80 → SPA static
    ├── /api/* → reverse_proxy localhost:9090
    └── /config → configd (TOML→JSON, secrets redacted)
```

See `../ui/BRAND.md` for the design system.

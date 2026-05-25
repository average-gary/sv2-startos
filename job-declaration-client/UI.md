# JD Client — Pioneer Hash Field Station

The `sv2-jd-client` package ships a Pioneer Hash dashboard alongside the
`jd_client_sv2` binary. After install, click **Launch UI** on the StartOS
service page.

## What you can see

- **Operating mode**: prominent badge + explanation of FullTemplate /
  CoinbaseOnly / SoloMining
- **Overview**: local hashrate (pushed upstream), downstream miner count,
  uptime, service version
- **Upstream channel** *(hidden in SoloMining mode)*: pool the JDC is talking
  to, channel counts, upstream hashrate
- **Connection**: listening address + coinbase reward script with copy buttons
- **Downstream miners**: connected SV2 clients — user, hashrate, channels,
  connect time

## Mode awareness

The dashboard adapts to the current `mode`:
- **FULLTEMPLATE / COINBASEONLY** → upstream channel section is shown
- **SOLOMINING** → upstream channel hidden; coinbase reward is the active
  destination for found blocks

## What you can't do here

Configuration changes happen in StartOS, not the dashboard. Use **Service →
Configure** in StartOS to switch modes, change upstreams, or update the
coinbase reward.

## Architecture

```
sv2-jd-client .s9pk
├── primary daemon: jd_client_sv2 -c /data/config.toml
│   └── monitoring HTTP on 0.0.0.0:9090
└── ui daemon: caddy + configd
    ├── port 80 → SPA static
    ├── /api/* → reverse_proxy localhost:9090
    └── /config → configd (TOML→JSON, authority_secret_key redacted)
```

See `../ui/BRAND.md` for the design system.

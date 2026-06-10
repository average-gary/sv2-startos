# Stratum v2 🤝 StartOS

Stratum V2 (SV2) packaged for [StartOS](https://start9.com) / Start9 — three
services that run as standalone `.s9pk` packages, with first-class **Iroh
transport** alongside legacy TCP.

## What's in the box

| Service | StartOS ID | Role |
|---|---|---|
| **Pool** | `sv2-pool` | SV2 pool server. Accepts downstream translators / JDCs over TCP and (optionally) Iroh. Embedded JDS available. |
| **TProxy** | `sv2-tproxy` | SV1↔SV2 translator proxy. ASIC firmware speaks SV1-over-TCP downstream; upstreams over TCP or Iroh. |
| **JD Client** | `sv2-jd-client` | Job Declarator Client. Negotiates jobs with an upstream JDS+Pool. Per-upstream TCP or Iroh. |

Each ships with the **Pioneer Hash dashboard** (Caddy + React SPA sidecar) for
live monitoring on port 80.

## Iroh transport

This package ships
[`average-gary/sv2-apps@feat/iroh-transport`](https://github.com/average-gary/sv2-apps/tree/feat/iroh-transport)
(pinned via submodule), which adds Iroh QUIC as a parallel transport for SV2
roles. Three connectivity modes are available per service:

1. **TCP + mDNS** — `<server>.local:34254` for on-LAN miners. Zero config. The default.
2. **TCP + Tor onion** — `<xyz>.onion:34254` for off-LAN miners. ⚠️ **Experimental — untested.** SV2-over-Tor has not been verified end-to-end anywhere we know of. The Configure action surfaces a "no guarantees" warning whenever a Tor-flavored upstream is selected.
3. **Iroh** — NodeId-addressed, NAT-traversed, mDNS-discoverable on LAN. Iroh is *enabled by default* on the pool's inbound listener; opt-in per upstream for tproxy/jdc.

Connection URIs follow [sv2-spec § 4.7](https://github.com/stratum-mining/sv2-spec/blob/main/04-Protocol-Security.md):

```
stratum2+tcp://host:port/<authority_pubkey>
stratum2+iroh://<node-id>:<port>/<authority_pubkey>?node_id=<...>
```

Authority public key is the URL **path** component (base58). The dashboard
exposes a copy-paste URI per service.

### Discovery defaults

Tightened relative to upstream Iroh defaults to honor StartOS sovereignty:

| Mechanism | Default | Why |
|---|---|---|
| `discovery_relay_enable` (mDNS) | **on** | Local-network discovery, no third party |
| `discovery_pkarr_res_enable` | **on** | Resolve peers from a NodeId; safe |
| `discovery_pkarr_pub_enable` | **off** | Publishing leaks every interface IP ([n0/iroh#3074](https://github.com/n0-computer/iroh/issues/3074)) |
| `discovery_dht_enable` | **off** | Avoid mainline DHT exposure |
| `discovery_n0_enable` | **off** | Avoid n0-operated `dns.iroh.link` dependency |

All five are toggleable per service via the Configure action.

## Building

```sh
make            # build all three .s9pks (universal, ~12-15 min cold each)
make pool       # just one
```

Outputs:
- `pool/sv2-pool.s9pk`
- `translator/sv2-tproxy.s9pk`
- `job-declaration-client/sv2-jd-client.s9pk`

To disable Iroh at build time:
```sh
docker build --build-arg CARGO_FEATURES="" ...
```

## Installing

Set your StartOS host in `~/.startos/config.yaml`:
```yaml
host: http://your-server-name.local
```

Then:
```sh
make install               # all three
make pool-install          # individually
```

Or upload each `.s9pk` via the StartOS web UI's Sideload page.

## Configure

After install, click **Configure Pool / Configure TProxy / Configure JD Client**.

Each form has an **Iroh Transport** section near the bottom:
- `Enable Iroh` toggle
- Listen address, relay URL (sovereignty escape hatch)
- 5 discovery toggles with descriptions
- 3 keepalive/timeout controls
- Secret key path (advanced)

For TProxy and JDC, the upstreams list also exposes per-upstream:
- `iroh_node_id` (or `iroh_pool_node_id` + `iroh_jds_node_id` for JDC)
- `iroh_relay_url`
- `prefer_transport: tcp | iroh`

⚠️ Pasting an `.onion` host into any upstream address triggers an
experimental-warning banner.

## Dashboard

Each service exposes a live UI on port 80:
- Live hashrate / shares / connections (5-min sparkline ring)
- Connection mode: TCP / Iroh-direct / Iroh-relayed
- **Iroh Card**: NodeId, active iroh connections, hole-punch success rate, fallback count
- Honest "Iroh transport: disabled" state when iroh metrics are absent

The dashboard parses the SV2 monitoring server's Prometheus `/metrics`
endpoint client-side and projects `sv2_iroh_*` counters/gauges into typed
shapes.

## Repo layout

```
.
├── Makefile                            # build orchestration
├── pool/                               # sv2-pool .s9pk wrapper
│   ├── Dockerfile                      # ARG CARGO_FEATURES="iroh-transport"
│   └── startos/
│       ├── manifest.ts                 # package metadata
│       ├── interfaces.ts               # downstream-multi + ui-multi + URI mints
│       ├── main.ts                     # TOML render + daemons + healthchecks
│       ├── fileModels/config.toml.ts   # config schema (incl. [iroh])
│       └── actions/setConfig.ts        # Configure form (incl. Iroh section)
├── translator/                         # sv2-tproxy .s9pk wrapper (same shape)
├── job-declaration-client/             # sv2-jd-client .s9pk wrapper (same shape)
├── ui/                                 # shared React+Caddy sidecar
│   ├── caddy/Caddyfile                 # /api/* + /metrics + SPA static
│   └── src/
│       ├── api/                        # client, hooks, promParser, types
│       └── views/{pool,translator,jdc,shared}/
└── sv2-apps/                           # submodule → average-gary/sv2-apps@feat/iroh-transport
```

## Status

- ✅ Phase 1 — Submodule pivot to fork
- ✅ Phase 2-3 — Config schema, TOML rendering, spec-conformant URI minting
- ✅ Phase 4 — Configure-action UX with Tor untested-warning
- ✅ Phase 5 — Iroh-listener health checks + UI Iroh card
- ⏭️ Phase 7 — Default-on release tag

See `.wiki/output/plan-sv2-iroh-startos-2026-06-03.md` for the full design plan
and `.wiki/theses/iroh-sv2-startos-ideal-candidate.md` for the thesis research
that grounded the choice to ship this fork.

## License

Apache-2.0 OR MIT.

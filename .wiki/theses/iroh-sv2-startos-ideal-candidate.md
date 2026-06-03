---
title: "Thesis: average-gary/sv2-apps@feat/iroh-transport is an ideal candidate for StartOS deployment because Iroh enables easy user setup and management"
type: thesis
status: completed
created: 2026-06-03
updated: 2026-06-03
verdict: partially-supported
confidence: medium
core_claim: "The feat/iroh-transport fork of sv2-apps is the ideal basis for the SV2 StartOS packages, because Iroh's NodeId-addressed, NAT-traversing transport eliminates the user-facing networking setup that normally makes self-hosted SV2 services painful."
key_variables: [iroh-transport, sv2-apps-fork, startos-networking, user-setup-ergonomics, ecosystem-interop]
falsification: "Any of: (1) Iroh transport breaks interop with stock-SV2 peers; (2) NodeId/ticket UX is no easier than onion URLs or IP:port; (3) StartOS already auto-issues Tor onions making the win redundant; (4) the fork is stale/unmergeable/unsupported; (5) relay fallback latency is unacceptable for share submission."
mode: thesis-deep-plan
session: 2026-06-03-iroh-startos
fork_head: 12a49efaee6979dc805c720c8ed7014046121baa
sources: 26
---

# Thesis: average-gary/sv2-apps@feat/iroh-transport is an ideal StartOS candidate

## Core Claim

Adopting `average-gary/sv2-apps@feat/iroh-transport` as the basis for the SV2
StartOS packages is the **ideal** path, because Iroh's transport
(NodeId-addressed, NAT-traversing, relay-fallback) eliminates the user-facing
networking setup that normally makes SV2 services painful to host at home.

## Key Variables

- **Iroh** — NodeId/ticket addressing, hole-punching, n0 relays, discovery (DNS/pkarr/mdns)
- **sv2-apps fork** — what `feat/iroh-transport` actually changes
- **StartOS networking surface** — Service Interface types, Tor onion provisioning
- **User setup/management ergonomics** — operator + connecting-miner setup steps
- **Ecosystem compatibility** — Iroh ↔ stock-SV2 interop

## Testable Prediction

Iroh transport materially reduces the setup steps a Start9 user must complete
to expose pool / jdc / tproxy to remote miners or upstream pools, **without**
breaking interop with the existing SV2 ecosystem, **and** the fork is
mergeable/maintainable enough to base a package on.

## Falsification Criteria — status after research

| # | Falsifier | Outcome |
|---|---|---|
| 1 | Breaks interop with stock-SV2 peers | **Falsified.** Pool/JDS run dual TCP+iroh listeners; default build is bytewise-equivalent to upstream. |
| 2 | NodeId/ticket UX no easier than onion URL | **Mostly survives.** Bare 52-char NodeId ≈ 56-char Tor v3 onion; default tickets are 128–296 chars and leak interface IPs. |
| 3 | StartOS auto-issues Tor onions, redundant | **Partially falsified.** Tor is NOT auto-issued — but path is "install Tor + 2 clicks" (~30 sec), much closer to "easy" than the thesis assumed. |
| 4 | Fork stale / no merge path | **Partially falsified, partially survives.** Fork is fresh (rebased 2 days ago); but RFC #1935 has 0 maintainer responses in 8 months, single-author, ~5,700 lines. |
| 5 | Relay fallback latency unacceptable | **Survives as risk.** ~14× TTFB measured; symmetric-NAT mitigation deferred past v1.0; no SV2 share-p99 measurement exists. |

**Score:** 1 falsified, 2 partially falsified, 2 survive as material risks.

## Scope Boundary

- **In scope:** the fork's diff, Iroh's connection UX, StartOS networking primitives, SV2 transport layer, Iroh↔stock-SV2 interop, comparable Iroh-in-production cases.
- **Out of scope:** general SV2 protocol design, pool economics, alt overlays except for comparison.

## Evidence For

Sorted strongest → weakest by combined credibility × evidence strength.

### Strong

- **[Strong] Spec permits non-TCP transport.** sv2-spec §3 lines 52–55: "a connection-oriented transport layer, **such as TCP**, with ordered delivery." Iroh-over-QUIC is conformant. ([[raw/docs/2026-06-03-sv2-spec-transport-layer-requirements]] — direct spec text)
- **[Strong] Architectural seam is clean.** stratum-core / noise-sv2 / codec-sv2 / framing-sv2 contain zero socket coupling — TCP lives only in stratum-apps/network_helpers. The fork's separate `feat/transport-abstraction` branch is independently mergeable. ([[raw/repos/2026-06-03-sv2-stratum-core-noise-transport-decoupling]], [[raw/repos/2026-06-03-sv2-transport-abstraction-branch-clean-cut]] — direct code inspection)
- **[Strong] Fork preserves TCP interop.** Pool and JDS run dual TCP+iroh listeners simultaneously. Default build is bit-equivalent to upstream `sv2-apps`. Iroh is gated behind the `iroh-transport` cargo feature. ([[raw/repos/2026-06-03-sv2-fork-dual-stack-listener-single-stack-dial]], [[raw/repos/2026-06-03-fork-stratum-apps-cargo-toml]] — direct code inspection)
- **[Strong] Fork is fresh and tracked.** HEAD `12a49efa` pushed 2026-06-01 (2 days before assessment); 13 ahead / 13 behind upstream `main`; two commits in 9 days are pure Cargo.lock rebase refreshes. ([[raw/repos/2026-06-03-fork-branch-metadata-and-divergence]] — gh api)

### Moderate

- **[Moderate] Iroh is real.** v1.0.0-rc.1 released 2026-05-27, 8.7k stars, dual MIT/Apache-2.0, ESP32 port works, Paycode shipped Iroh to highway toll-booth payment terminals. ([[raw/repos/2026-06-03-iroh-repo-health]], [[raw/articles/2026-06-03-cases-iroh-paycode-deployment]])
- **[Moderate] No-router-config UX is genuine.** dumbpipe and sendme demonstrate the "no port-forwarding, no DDNS, no cert" claim end-to-end. ([[raw/articles/2026-06-03-iroh-dumbpipe-sendme-ux]])
- **[Moderate] Implementation cribbed from production scars.** Idle/keepalive/timeout defaults explicitly cited as Fedimint lessons learned (PR #8422, #8571). ALPN scheme matches Fedimint's 3-ALPN production pattern. 151/151 lib tests pass under feature flag. ([[raw/repos/2026-06-03-fork-iroh-module-architecture]], [[raw/repos/2026-06-03-fork-role-integration-and-config-surface]])
- **[Moderate] Connection migration built-in.** QUIC survives IP changes (mobile↔wifi, ISP renumbering). Tor onion and clearnet IPs do not give you this.
- **[Moderate] Cultural fit.** "Dial-by-public-key, no third-party account" maps cleanly onto Bitcoin/SV2 where keys are first-class.

### Weak

- **[Weak] Maintainer is ecosystem-embedded.** 135 public repos including bitcoin-core-startos fork, sv2-wizard fork, sv2-p2pool, datum-rs. ([[raw/repos/2026-06-03-fork-upstream-engagement-and-author]])

## Evidence Against

### Strong

- **[Strong] Zero non-fork Iroh peers in SV2.** Zero ASIC firmwares speak Iroh (Braiins OS+, LuxOS, VNish, ePIC: TCP-only). Zero production pools listen on Iroh (Braiins Pool, DMND, OCEAN: TCP-only). Firmware update cycles are quarterly-to-yearly. ([[raw/articles/2026-06-03-sv2-asic-firmware-and-pool-deployment-2026]])
- **[Strong] SV1 hard-coupled to TCP.** The translator's downstream-from-ASIC leg cannot benefit from Iroh — ever. ASICs speak SV1-over-TCP exclusively for the foreseeable future. ([[raw/articles/2026-06-03-sv2-translator-tproxy-deployment-topology]])
- **[Strong] Zero upstream engagement.** RFC #1935 ("RFC: Iroh [Noise] Connection") filed 2025-10 in SRI Ideas discussions: zero maintainer responses, zero +1s, zero follow-up PRs in 8 months. ([[raw/repos/2026-06-03-sv2-rfc-1935-iroh-noise-connection]])
- **[Strong] Default Iroh tickets leak interface IPs.** 128–296 chars, disclose every direct address (public IPv4, LAN IP, Tailscale CGNAT, docker bridge, IPv6 prefix). Privacy regression vs onion URLs that disclose only service identity. (Issue #3074, [[raw/articles/2026-06-03-iroh-ticket-privacy-leak]])
- **[Strong] Symmetric-NAT mitigation explicitly post-v1.0.** Maintainer ramfox (#3183): "we plan on implementing them in the future, but it is not currently on our 1.0 roadmap." Mobile carriers and CGNAT users land on relay. ([[raw/articles/2026-06-03-iroh-holepunch-failure-issues]])

### Moderate

- **[Moderate] StartOS counterfactual is closer than assumed.** Tor is NOT auto-issued — but the path is "install Tor + click Add Onion Service" (~30 seconds, two screens). The marginal Iroh win shrinks. ([[raw/docs/2026-06-03-startos-networking-tor-clearnet-friction]])
- **[Moderate] Relay TTFB ~14× direct.** Issue #4134 measured 63ms direct vs 907ms relayed. No SV2-specific share-submission p99 published.
- **[Moderate] No NodeId seam in StartOS SDK.** `MultiHost.bindPort` is a closed set (TCP port → OS-managed address fan-out). NodeId would not appear in service-page address table without upstream start-os SDK work. ([[raw/docs/2026-06-03-startos-multihost-bindport-source]])
- **[Moderate] Single-author transport-security code.** ~5,700 lines in `network_helpers/iroh/*`, all 13 commits authored solo (Co-Authored-By Claude only). No second human pair of eyes on a security-sensitive surface. ([[raw/repos/2026-06-03-fork-branch-metadata-and-divergence]])
- **[Moderate] n0 operator concentration.** Single small company (~10 people) operates the relay mesh. First outage 2024-11 (~6h, 12h detection delay). Tor (~7000 volunteer relays) and Tailscale (commercial SLA) have better operator-redundancy. ([[raw/articles/2026-06-03-cases-iroh-relay-outage-postmortem]])
- **[Moderate] Discovery centralized on `dns.iroh.link`.** n0-operated default origin contradicts StartOS sovereignty ethos. ([[raw/docs/2026-06-03-iroh-endpoints-discovery]])
- **[Moderate] Outbound dial single-transport.** Commit `b42c3dc2` removed `IrohThenTcp`/`TcpThenIroh` fallback variants. Operator must configure two `[[upstreams]]` entries to dial both. ([[raw/repos/2026-06-03-sv2-fork-dual-stack-listener-single-stack-dial]])

### Weak

- **[Weak] Iroh on Start9 is first-of-its-kind.** Zero references to iroh / libp2p / any P2P overlay across Start9Labs' 146 repos. Start9's official overlay vocabulary is mDNS / Tor / WireGuard. ([[raw/repos/2026-06-03-cases-iroh-ecosystem-deployments]], [[raw/repos/2026-06-03-cases-start9-starttunnel]])
- **[Weak] Iroh v1.0 not yet GA.** Library hit rc.1 only 8 days before this research; each rc has historically broken consumer builds.

## Corrections (2026-06-03 — user review)

Two findings the user surfaced after the initial verdict, which weaken parts of the case-against and recharacterize the path forward:

- **mDNS coexists, doesn't compete.** StartOS already publishes `<server>.local` via mDNS. Iroh's `iroh-mdns-address-lookup` performs NodeId↔addr discovery on the same LAN. They don't fight; Iroh's on-LAN discovery is genuinely zero-config and matches StartOS's pattern. Falsifier #3 weakens further: the StartOS counterfactual on LAN is *already* mDNS-flavored, not "raw IP+port," so Iroh fits naturally on top.
- **SV2-over-Tor is unmeasured.** No public data exists on SV2 share-submission p99 over Tor circuits. The "install Tor + 2 clicks (~30 sec)" counterfactual was scored against an unmeasured baseline. Shipping Tor as a ground-truth research track is itself a contribution.

These don't flip the verdict — the chicken-and-egg ecosystem problem (zero non-fork Iroh peers) and zero upstream RFC engagement remain Strong opposing evidence. But they refine the reading of falsifier #3, the recommendation, and the sovereignty story for relay alternatives.

→ See [[output/plan-sv2-iroh-startos-2026-06-03]] for the resulting design plan: ship Iroh as a first-class option alongside TCP+mDNS and TCP+Tor, with Iroh on-by-default for the pool's inbound listener and operator-opt-in elsewhere.

## Nuances & Caveats

- **The Iroh value prop only realizes when both endpoints speak Iroh.** Today that's only the Start9-to-Start9 deployment shape (e.g. user A's pool + user B's translator on the fork). For modal Start9 users mining to a real pool, Iroh delivers nothing.
- **The biggest user-setup ergonomic win is independent of transport.** Minting an `sv2://addr?public_key=<noise_pk>` URI à la `lndconnect://...` would close most of the operator UX gap — zero Iroh code required, achievable in `interfaces.ts` today.
- **`feat/transport-abstraction` is separately upstreamable.** That branch (sans iroh) includes an in-memory test transport, proving the abstraction is genuinely transport-agnostic. Upstreaming the abstraction alone is a strictly-better path than carrying the full fork forever.
- **The Start9-to-Start9 mining-pod use case is real but niche.** Friend-and-family pools, p2pool-style cooperatives, hashrate-sharing among small operators — Iroh genuinely beats Tor on latency and connection migration here. The value is non-zero, just narrower than "ideal candidate" implies.
- **Iroh's hard-NAT-on-server fix only landed in v1.0.0-rc.1.** Prior rcs had this bug. API stability is improving but young.
- **Tailscale solved the same problem with millions of non-technical users.** MagicDNS + commercial SLA is materially better UX than 128-char tickets through n0 relays. But Tailscale's email-account model is a worse cultural fit for the Bitcoin self-host audience.

## Verdict

**Status:** **Partially Supported / Mixed.**

**Confidence:** **Medium.**

**Summary:** The fork is fresh, well-engineered, and additive — Iroh genuinely sidesteps router config / DDNS / cert provisioning and the `feat/transport-abstraction` cleanup is independently valuable. **But "ideal candidate" overreaches.** StartOS's modal off-LAN counterfactual is "install Tor + 30 seconds of clicks," not "set up port-forwarding + DDNS + cert." The Iroh win materializes only in the Start9-to-Start9 deployment shape; the SV2 ecosystem has zero non-fork Iroh peers in 2026 (zero ASIC firmwares, zero production pools, zero upstream engagement on RFC #1935). Iroh ships with real cliffs (default tickets leak interface IPs, symmetric-NAT mitigation deferred past v1.0, ~14× relay-path TTFB, n0 operator concentration). The right framing for the StartOS package is **"Iroh-curious, TCP-default."**

**Strongest supporting evidence:**
- SV2 spec is transport-agnostic (§3.52-55); architectural seam is clean (stratum-core has zero socket coupling); fork preserves TCP interop via dual-stack listeners. *Iroh CAN be added without breaking anything.*
- Fork is genuinely fresh and well-engineered (rebased 2 days ago, 151/151 tests pass, Fedimint-derived defaults). *The fork is not a throwaway.*

**Strongest opposing evidence:**
- Zero non-fork Iroh peers anywhere in SV2 (firmware, pools, upstream RFC engagement). *The Iroh win has no audience yet beyond the Start9-to-Start9 case.*
- StartOS counterfactual is "install Tor + 2 clicks" (~30 sec), not the multi-step port-forward+DDNS+cert chain the thesis assumed. *The marginal ergonomic win is small.*
- Default Iroh tickets leak interface IPs and symmetric-NAT mitigation is deferred past v1.0. *UX has real cliffs.*

**Key caveats:**
- The user has chosen to proceed with Iroh as a first-class option (see [[output/plan-sv2-iroh-startos-2026-06-03]]). The plan ships **three connectivity modes**: TCP+mDNS, TCP+Tor, Iroh. Iroh-on-by-default for the pool's inbound listener; operator-opt-in elsewhere.
- The `sv2://addr?public_key=...` URI minting (lndconnect pattern) ships **regardless** of Iroh — it is the single biggest user-setup-ergonomics win and is transport-independent.
- The `feat/transport-abstraction` branch (sans iroh) remains independently mergeable upstream and is the strictly-better long-term path; we should encourage that even while shipping the Iroh fork.
- Discovery defaults are tightened from Iroh's stock config: mDNS + pkarr-resolve on by default; n0 DNS, mainline DHT, and pkarr-publish off — to honor StartOS sovereignty and avoid the interface-IP-leak issue (#3074).

**What would change this verdict:**
- *To Supported:* SRI maintainers respond positively to RFC #1935; OR Braiins or another firmware vendor announces Iroh support; OR a measured SV2-share p99 under Iroh relay fallback proves competitive with TCP+Tor.
- *To Contradicted:* The fork stops being maintained (no Cargo.lock refresh in >60 days); OR Iroh v1.0 GA slips past 2026-Q4 with API churn; OR n0 has another multi-hour relay outage during the StartOS evaluation window.

**Suggested follow-up theses:**
- *"Adding `sv2://addr?public_key=...` URI minting (lndconnect pattern) to TCP-transport SV2-startos closes >70% of the user-setup-ergonomics gap that the Iroh fork claims to address."*
- *"For Start9-to-Start9 mining-pod deployments specifically, Iroh transport delivers measurably better tail latency and reconnection UX than Tor onion under residential NAT."*
- *"Upstreaming `feat/transport-abstraction` (without `feat/iroh-transport`) would give SRI a future-proof transport layer at acceptable maintainer cost."*

## See also

- [[output/plan-sv2-iroh-startos-2026-06-03]] — implementation plan resulting from this thesis (ship anyway, with three-mode connectivity)
- [[output/thesis-iroh-sv2-startos-2026-06-03]] — full cross-path synthesis with all evidence
- [[output/playbook-startos-package-ui-2026-05-21]] — earlier shipped SV2 UI work
- [[output/plan-pioneer-hash-sv2-ui-2026-05-21]] — earlier UI implementation spec

---
title: "Upstream engagement on iroh + average-gary's bitcoin/SV2/StartOS portfolio"
type: repos
source: "GitHub search across stratum-mining org + average-gary user repos & events"
date: 2026-06-03
quality: 4
credibility: high
relevance: direct
direction: nuances
evidence_strength: "direct-code-inspection"
tags: [iroh, sv2-apps, fork-survey, upstream-engagement, sri, ecosystem, bitcoin-mining]
summary: "Zero open PRs/issues for iroh transport upstream as of 2026-06-03; one closed issue (#273, retracted by author 8 minutes after filing). The fork maintainer is, however, a deeply embedded SV2/Bitcoin-mining ecosystem participant with a parallel StartOS background."
---

## Upstream engagement (stratum-mining org)

Search of `org:stratum-mining` for "iroh" returned exactly **one** result:

- `stratum-mining/sv2-apps#273` — "Add Iroh transport support to stratum-apps network_helpers"
  - Filed by **EthnTuttle** at 2026-02-17T10:27:12Z
  - Closed by EthnTuttle at 2026-02-17T10:35:08Z (8 minutes later)
  - Sole comment: *"Sorry. Wrong repo. I didn't mean for this be in the upstream."*
  - URL: https://github.com/stratum-mining/sv2-apps/issues/273

There is **no** open issue, no open PR, no closed-merged PR, and no pinned RFC/discussion in `stratum-mining/sv2-apps`, `stratum-mining/stratum`, or `stratum-mining/sv2-spec` referencing iroh. The fork has not been formally proposed for merge; SRI maintainers have not publicly evaluated it.

Note: EthnTuttle and average-gary collaborate (`EthnTuttle/herd-scout` shows up repeatedly in average-gary's recent push events), suggesting iroh-on-SV2 is a small-team idea inside a friend group rather than a community RFC.

## Author profile: average-gary

- GitHub: https://github.com/average-gary, account created 2024-04-02
- Profile: company "bitcoin", location "shenandoah", 24 followers, 13 following
- 135 public repos — high signal
- Co-author tag in every commit on this branch: `Co-Authored-By: Claude Opus 4.7 (1M context)`

Selected repo portfolio (by recent push date) — all bitcoin/SV2/StartOS adjacent:
- `sv2-p2pool` (own) — "SV2 mining pool with p2poolv2 share-chain backend"
- `p2pool-v2` (fork of p2poolv2/p2poolv2)
- `datum-rs` (own) — "Drop-in Rust port of OCEAN-xyz/datum_gateway"
- `sv2-apps` (this fork)
- `stratum` (fork of stratum-mining/stratum)
- `sv2-spec` (fork of stratum-mining/sv2-spec)
- `sv2-wizard` (fork of stratum-mining/sv2-wizard) — SV2 deployment wizard component
- `bitcoin-core-startos` (fork of Start9Labs/bitcoin-core-startos) — **direct evidence of StartOS familiarity**
- `hydrapool` (fork of 256foundation/hydrapool) — open-source mining pool
- `mujina` (fork of 256foundation/mujina) — open-source mining firmware
- `sv2-descriptor` / `sv2-descriptor-cli` (own) — descriptor parsing for sv2-apps
- `rust-coinbase` (own) — coinbase tx library

Public events (last 30) show daily push activity across these repos as of 2026-06-03; this is a full-time-feeling open-source bitcoin developer, not a one-shot drive-by.

## Implication for thesis

Strongly nuances the thesis. **Pro**: the maintainer has the broadest possible exposure to the relevant ecosystem — they fork StartOS packages, contribute to multiple SV2 repos, run their own pool fork (sv2-p2pool), port DATUM to Rust, and their iroh branch is technically careful (Fedimint patterns, ALPN versioning, integration tests). They are credibly the right person to package SV2 for StartOS.

**Con (falsifying the thesis)**: this fork has zero upstream traction — no PR, no issue, no RFC discussion. The single closed iroh issue was filed by a collaborator and immediately retracted. Building a long-lived StartOS package on a single-maintainer branch with no merge path means accepting a permanent maintenance fork: rebases on every upstream sv2-apps release, divergence in security-sensitive transport code, and no path to having Start9 users' deployments converge with the broader SV2 community's deployments.

The mitigating fact is that the iroh feature is gated behind `--features iroh-transport`; a StartOS package could choose to ship the *non-iroh* build of the fork (effectively bit-equivalent to upstream main) until iroh lands upstream, then opt in. But that defeats the original thesis premise — without iroh the user-setup-ergonomics advantage disappears.

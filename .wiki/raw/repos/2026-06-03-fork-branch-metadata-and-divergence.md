---
title: "average-gary/sv2-apps@feat/iroh-transport: branch metadata and divergence vs upstream"
type: repos
source: "https://api.github.com/repos/average-gary/sv2-apps & .../compare/main...average-gary:sv2-apps:feat/iroh-transport"
date: 2026-06-03
quality: 5
credibility: high
relevance: direct
direction: nuances
evidence_strength: "direct-code-inspection"
tags: [iroh, sv2-apps, fork-survey, divergence, freshness]
summary: "Branch is 13 commits ahead, 13 behind upstream stratum-mining/sv2-apps main; rebased 2 days ago (2026-06-01); 67 files changed across all four role workspaces."
---

## Repo metadata snapshot (as of 2026-06-03)

- Fork: `average-gary/sv2-apps` (id 1139997250), `fork: true`
- Parent: `stratum-mining/sv2-apps` (13 stars, 32 forks, 98 open issues, default branch `main`)
- Fork created: **2026-01-22T17:34:16Z** (~4.5 months old)
- Fork last `pushed_at`: **2026-06-01T17:50:11Z** (2 days before assessment)
- Upstream parent last `pushed_at`: **2026-06-03T15:45:33Z** (active today)
- Branch `feat/iroh-transport` HEAD: `12a49efaee6979dc805c720c8ed7014046121baa` (2026-06-01)
- Last commit message: "chore: refresh Cargo.lock files after rebase onto stratum-mining/main" — explicitly states the branch was rebased onto `stratum-mining/sv2-apps@23dfc793`.
- Co-author tag in commit: `Co-Authored-By: Claude Opus 4.7 (1M context)` — Claude-Code-assisted development.

## Divergence vs upstream (`stratum-mining/sv2-apps@main` ↔ `average-gary:sv2-apps:feat/iroh-transport`)

- `ahead_by: 13`, `behind_by: 13`, `status: diverged`
- Total commits in head not in base: 13
- Files changed: **67**
- The 13 "behind" commits represent upstream advancement during the iroh work; the maintainer's most recent commit explicitly resyncs Cargo.lock against `stratum-mining/main@23dfc793`.

## Commit list (oldest→newest)

```
bc51e1e2 2026-05-23 stratum-apps: add iroh transport infrastructure
ea382646 2026-05-23 pool: add iroh transport for downstream listener and TP dial
d25614c7 2026-05-23 jd-server: add iroh transport for downstream listener
843525c3 2026-05-23 jd-client: add iroh transport for listener and outbound dials
acd43c68 2026-05-23 translator: add iroh transport for outbound pool dial
7a9982d0 2026-05-23 integration-tests: add iroh transport fixtures and tests
9084fc70 2026-05-23 chore(iroh): port from iroh 0.91 to iroh 1.0.0-rc.0
c5c35c8e 2026-05-27 chore(iroh): bump iroh from 1.0.0-rc.0 to 1.0.0-rc.1
bc3f402a 2026-05-28 chore: refresh Cargo.lock files after rebase onto stratum-mining/main
4b466c54 2026-06-01 iroh(alpn): add SV2_WIRE_VERSION coordinated bump constant
b42c3dc2 2026-06-01 iroh(transport): drop IrohThenTcp / TcpThenIroh fallback variants
542407aa 2026-06-01 iroh(discovery): wire mDNS local + mainline DHT, both on by default
12a49efa 2026-06-01 chore: refresh Cargo.lock files after rebase onto stratum-mining/main
```

All 13 commits are by `average-gary` (single maintainer). Two of the 13 are pure rebase Cargo.lock refreshes, indicating active upstream tracking.

## Implication for thesis

Mixed signal. Positive: branch is freshly rebased (≤2 days behind upstream HEAD), single coherent linear history, six logical commits per role + version bumps + discovery wiring suggests deliberate engineering rather than a one-shot dump. Negative: it is a single-maintainer branch with no co-authors, no PRs upstream, and the upstream repo has been advancing 13 commits during the work. This is "actively maintained personal experiment" — not yet "upstream-blessed work product." For StartOS deployment that's enough to package today, but it imposes a continuous rebase burden until/unless this lands upstream.

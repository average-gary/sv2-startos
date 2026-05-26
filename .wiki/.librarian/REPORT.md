# Librarian Report — 2026-05-26 (post-sweep)

> Scanned 8 documents in `sv2-startos` (.wiki, local). Passes: staleness, quality.
>
> **Wiki shape**: only `raw/` (6 sources) and `output/` (2 deliverables). No compiled `wiki/` layer exists. The scan was adapted to score those layers.
>
> **Post-sweep state**: all 8 docs now carry `volatility: hot`, `verified: 2026-05-26`. Both outputs carry `status: implemented`. The plan documents its 10 implementing commits via `implemented-in:`. The playbook frontmatter now has a proper `sources:` list mirroring its body.

## Summary

| Metric | Value |
|--------|-------|
| Documents scanned | 8 |
| Below staleness threshold (< 70) | 0 |
| Low quality (< 50) | 0 |
| Average staleness | 95 / 100 |
| Average quality | 88 / 100 |

The wiki is now in a clean state. Every document scores 95 on staleness — the only points lost are the inevitable 5d age decay on the `hot` half-life curve.

## Stale Documents (staleness < 70)

None.

## Low Quality Documents (quality < 50)

None.

## All Documents (sorted by quality)

| Document | Staleness | Quality | Notes |
|----------|-----------|---------|-------|
| `raw/articles/2026-05-21-startos-ui-integration-paths.md` | 95 | 92 | featured |
| `raw/docs/2026-05-21-sv2-monitoring-http-api.md` | 95 | 92 | featured |
| `raw/docs/2026-05-21-startos-sdk-ui-surfaces.md` | 95 | 92 | featured |
| `output/plan-pioneer-hash-sv2-ui-2026-05-21.md` | 95 | 92 | **status: implemented**, 10 commits cited |
| `raw/articles/2026-05-21-startos-multi-container-pattern.md` | 95 | 88 | strong |
| `output/playbook-startos-package-ui-2026-05-21.md` | 95 | 88 | **status: implemented** |
| `raw/articles/2026-05-21-sv2-ui-information-architecture.md` | 95 | 84 | strong |
| `raw/repos/2026-05-21-stratum-mining-sv2-ui-upstream.md` | 95 | 80 | single-source (intrinsic to repo cards) |

## Decay forecast (hot, half-life 30d)

At the current `verified: 2026-05-26` watermark, scores will fall as follows if nothing is re-verified:

| Days from now | Approx score |
|---------------|--------------|
| 0 | 95 |
| 30 | 73 (right at threshold) |
| 60 | 53 (flagged) |
| 90 | 39 (urgent) |

Translation: re-verify on or before **2026-06-25** to stay clean. The natural prompt to do this is when sv2-apps cuts a new tag, or when the upstream `stratum-mining/sv2-ui` ships a release that affects the integration path.

## Watch items (suggested, not auto-created)

- **sv2-apps version drift** — repo currently pins `v0.4.0`; bump submodule + re-verify monitoring API doc when next tag drops.
- **stratum-mining/sv2-ui drift** — upstream UI is on the integration path; track its tags.
- **start-sdk drift** — documented at `v0.4.0-beta.44` in the SDK surfaces doc; bump the doc on every minor.

## Next scan

Run again in **~30 days** (around 2026-06-25). At that point, anything not re-verified will be approaching the threshold and surface naturally.

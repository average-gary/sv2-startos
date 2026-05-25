# Pioneer Hash · Brand System

Codename: **Field Station**.

## Concept

Pioneer Hash is the dashboard you'd find inside a high-altitude scientific outpost where crews monitor the deep frontier of self-sovereignty. Visual language pulls from:

- **1970s NASA mission patches** — geometry, latin mottos, single-color typography
- **USGS topographic charts** — chart-paper grids, hairline rules, tabular legends
- **Apollo-era control consoles** — instrument panels, signal lamps, beacon amber

What it is **not**: bitcoin orange + black, generic crypto neon, retail-app cheerful, or AI-rendered "futuristic dashboard" tropes. We're not selling — we're _running an operation._

The motto is **Ad Ultra Hash** ("to the furthest hash"). It appears in the header chrome at small caps tracking, never as a feature.

---

## Palette

| Token | Hex | Role |
|---|---|---|
| `surface` | `#101418` | Ink — deepest, page background |
| `surface-2` | `#181D22` | Iron — raised cards, header |
| `surface-3` | `#222830` | Slate — table rows on hover, popovers |
| `surface-4` | `#2D343D` | Graphite — input fills, code blocks |
| `border` | `#2A323C` | Hairline rule |
| `border-strong` | `#3D4754` | Emphasized divider |
| `text` | `#E8E2D5` | Bone — primary copy. **Warm cream, not pure white.** |
| `text-strong` | `#F4EFE3` | Chalk — display headings, KPI numbers |
| `muted` | `#8C9099` | Lichen — secondary copy |
| `muted-2` | `#5C6168` | Gravel — tertiary, captions |
| `primary` | `#D9923B` | **Beacon** — single accent. Amber, weathered. NOT orange. |
| `primary-dark` | `#A66A1F` | Weathered beacon — hover/pressed |
| `primary-faint` | `#3A2C18` | Beacon shadow — backgrounds, alerts |
| `success` | `#7FA776` | Moss — vintage radar green |
| `warning` | `#D9A441` | Sodium — caution lamp |
| `error` | `#C8553D` | Rust — flag, never panic-red |
| `info` | `#6E94B0` | Overcast — informational chrome |

### Palette discipline

- **Surfaces are 90% of the canvas.** Beacon amber is a single load-bearing accent — used for active nav, primary CTAs, the top stripe, and the favicon. Never a fill on cards.
- **Status colors are mechanical.** Moss-green for OK, sodium for caution, rust for fault, overcast-blue for info. Avoid bright UI-kit reds and greens.
- **No gradients on text.** No glows. No drop shadows on type. This is an instrument panel.

---

## Typography

A two-family pairing. Both are open-licensed and load from Google Fonts.

| Family | Use |
|---|---|
| **Fraunces** (variable serif, italic available) | Display headings, KPI numbers, brand wordmark. Uses `opsz: 144` at large sizes for swelling terminals. Italic preferred for service titles ("Pioneer Hash SV2 Pool"). |
| **JetBrains Mono** (variable mono) | Body, UI controls, navigation, captions, all data. Monospace as voice — every character has the same weight on the panel. Uses `ss01` (friendlier zero) and `cv11` (fewer ligatures). |

### Type ramp (defined in `tokens.ts`)

```
display-2xl  60 / 1.05  -0.025em  Fraunces italic
display-xl   44 / 1.05  -0.020em  Fraunces italic
display-lg   32 / 1.10  -0.015em  Fraunces italic
h1           24 / 1.20  -0.010em  Fraunces italic
h2           18 / 1.30   0        JetBrains Mono bold uppercase
body         14 / 1.50   0        JetBrains Mono regular
small        12 / 1.40   0.02em   JetBrains Mono medium
caption      11 / 1.30   0.08em   JetBrains Mono bold uppercase
```

### Type rules

- **Headings are italic Fraunces.** Always.
- **Section labels and chrome are uppercase mono with extra tracking** (`0.15em`–`0.2em`). Never sentence-case.
- **Numbers are tabular.** Use `tabular-nums` (or the `.tabular` class). KPIs use Fraunces; inline counts in tables use JetBrains Mono.
- **No text shadow, no underlines on links.** Active state = beacon-color border or text.

---

## Logo

Three SVG assets ship in `public/`:

| File | Use |
|---|---|
| `pioneer-hash-mark.svg` | Tight 16×16 favicon. Hex frame + simplified peak. |
| `pioneer-hash-logo.svg` | Standalone bug, 64×64 native. Header, social shares, mission-patch contexts. |
| `pioneer-hash-lockup.svg` | Horizontal lockup: bug + "Pioneer / HASH STATION" wordmark. The default header treatment. |

All three use `currentColor` — set the parent's `color` to swap between beacon amber, bone, or any contextual ink. They have no fills that bake in a color.

### Bug anatomy

- Outer hex (pointed top, suggesting a peak) — references `#` and SHA round structure
- Inner hex hairline — adds a topographic-contour feel
- Peak silhouette (mountain) — "pioneer", frontier, ascent
- Polaris dot above the peak — cardinal direction, sextant fix
- Two horizontal hash bars below — the missing strokes that make the `#` complete when you stop reading the hex as a hex

### Don't

- Don't recolor the lockup with rainbow gradients or two-tone fills.
- Don't place the bug on busy photography without a 4-px-equivalent solid backdrop.
- Don't stretch or italicize the lockup. The wordmark is already italic.
- Don't use the bug smaller than 16px. Use `pioneer-hash-mark.svg` for that.

---

## Patterns

### Chart-paper grid
A 32×32 grid at 4% opacity sits behind the entire shell. It evokes USGS topo paper. Don't increase its opacity above 8%.

### Corner ticks
MetricCards, dialogs, and any framed instrument show a tiny 8px L-shaped tick in one corner — pulled from chart annotations. Never on every corner; one is enough.

### Beacon stripe
A 2px solid `primary` line spans the very top of every page above the header. This is the brand stripe. It never gets thicker. It never moves.

### Status lamps
Active services get a pulsing 1.5px amber dot. Failure states get a steady rust dot. No spinners, no progress bars longer than 200px.

---

## Voice

- **Operator-grade**, not consumer-friendly. "ACQUIRING SIGNAL" beats "Loading…".
- **Mechanical English.** Imperative verbs in chrome ("Configure via StartOS"), latin in mottos ("Ad Ultra Hash"), no exclamation points.
- **Numerals win.** When in doubt, replace prose with a metric.
- **No emoji** except as semantic glyphs in error states (⚠) or directional arrows (↳).

---

## Files

- `src/styles/tokens.ts` / `tokens.js` — single source of truth for palette/type/radii. Keep in sync.
- `src/styles/tailwind.css` — base styles, font feature settings, scrollbars, selection color.
- `tailwind.config.js` — exposes tokens as Tailwind classes (`bg-surface-2`, `text-text-strong`, `font-display`, etc.).
- `index.html` — loads Fraunces + JetBrains Mono from Google Fonts; sets favicon + theme-color.
- `public/pioneer-hash-{mark,logo,lockup}.svg` — the three logo variants.

---

## License

Brand assets in this directory are © Pioneer Hash. Fraunces (SIL OFL) and JetBrains Mono (SIL OFL) are open-licensed.

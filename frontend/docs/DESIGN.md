# LASBAG design direction

Evolution of the supplied references: the Vivid Motion hero (large editorial serif on a dark cinematic ground) and the ACRU dashboard (calm, roomy, rounded, mostly white data surfaces with one confident accent). Palette stays deep navy, Lagos green, warm gold and soft mint. Tone: a premium public service you could show a Governor, not a SaaS template.

## Palette (all defined in `frontend/tailwind.config.ts`)
| Name | Hex | Role |
|---|---|---|
| Night | `#071A33` | Hero ground, glass-dark, footer, primary text on light |
| Harbour | `#24476F` | Secondary navy, links, chart series 2 |
| Lagos Green | `#0E6B3A` | Primary action, completed states |
| Lagos Gold | `#E0A526` | Attention, "next action", accent italic in headlines |
| Mint | `#EAF6EF` | Soft section ground, success surfaces |
| Paper | `#F6F9F7` | App background behind white cards |

Status colours (ok / warn / danger / info) are unchanged and always paired with an icon and a label, never colour alone.

## Type roles
- **Display**: Fraunces (serif, optical size), 500 weight, tight tracking, used for hero and section headlines only. Gold italic for the one emphasised phrase.
- **UI / body**: Manrope 400 to 800.
- Fluid scale with `clamp()`: display `clamp(2.75rem, 1.6rem + 5.6vw, 6rem)`, h1 `clamp(2rem, 1.4rem + 2.2vw, 3rem)`. Body never below 16px. Mobile hero headline breaks into three lines.

## Spacing and shape
4px base. Section rhythm 72 / 96 / 128px (mobile / laptop / large). Radius: 10px controls, 16px cards, 24px hero and glass panels. Touch targets are at least 44px. Safe-area insets applied to sticky header, bottom nav and drawer.

## Breakpoints (tailwind config only)
xs 420, sm 640, md 768 (tablet), lg 1024, xl 1280 (laptop), 2xl 1440 (large desktop), 3xl 1920. Layouts are recomposed, not scaled: app shell is bottom-nav on mobile, icon rail on tablet, full sidebar from xl.

## Motion principles
1. Animate `transform` and `opacity` only (blur and filter sparingly, never per frame on large areas).
2. Showpiece motion lives on the landing and auth pages; the signed-in app gets short, calm transitions (150 to 250ms, ease-out).
3. Motion explains state: things arrive from where they came from, progress fills, attention pulses once and rests.
4. `prefers-reduced-motion`: no parallax, pinning, sweep or smooth scroll; content appears with a plain fade. Touch and low-power devices get the static composition.
5. GSAP and Lenis are dynamically imported on the landing page only.

## Glass recipe
Dark: `background: rgb(7 26 51 / .80); backdrop-filter: blur(18px) saturate(140%); border: 1px solid rgb(255 255 255 / .16); box-shadow: inset 0 1px 0 rgb(255 255 255 / .18), 0 12px 40px rgb(3 10 22 / .35)`.
Light: `rgb(255 255 255 / .72)`, same blur, hairline `rgb(255 255 255 / .8)`, faint navy shadow.
`@supports not (backdrop-filter)` falls back to 94% opaque fills. Contrast: white text on Night at 80% over the worst case (pure white behind) is about 8:1, so AA holds. Used on: header after scroll, hero cards, mobile drawer, dialogs, toasts, auth card. Never on tables, checklists or forms.

## Signature moments
1. **Hero**: the supplied night Lekki bridge photo as the ground, three depths (photo drifts slowly, mist and light sweep across the water, glass cards move fastest and lean toward the cursor on desktop), masked slide-up headline lines.
2. **How it works (pinned)**: four steps advance on scroll, a line draws between them, a mini dashboard changes state per step.
3. **Why LASBAG**: scattered agency "doors" resolve into one journey line on scroll. LASBAG coordinates agencies; it does not replace them.
4. **Connected agencies**: LASPPPA, LASBCA, LIRS, Drainage Services, LSMTL as text nodes linked to a central LASBAG node by drawn paths. No invented logos.
5. **Dashboard journey**: ring fill, check draw, connector fill, count-up progress, one restrained pulse on "Next required action".

## Decisions
- Lagos State crest (supplied) is used unmodified as the LASBAG mark, next to a "LASBAG" wordmark. Never redrawn.
- Hero photo is dark, so the landing header is transparent with white text until scroll, then frosted navy. Other public pages use frosted white.
- One photo cannot give true depth layers; parallax uses photo, mist/sweep and glass cards as three rates rather than faking cut-outs.
- Sample data is always labelled "Sample application". No claim of live agency integration.

## Build notes (app pass)
- Shell breakpoints: bottom nav below md, icon rail md to xl, sidebar from xl. The seven-stage tracker is horizontal from lg and a vertical timeline below (seven labels do not fit a 768px tablet).
- Dialogs, the drawer and toasts share one modal hook (focus trap, Esc, scroll lock, focus return). Dialogs use a near-opaque frosted sheet so text stays readable.
- Tables become stacked cards below md (applications, queue, admin agency workload). Data-dense areas use solid white surfaces, never glass.
- Charts are small dependency-free SVG/CSS components with text alternatives; status is always icon plus word.
- The public /track page shows stage and progress only; it never returns names, addresses or documents.
- Forgot/reset password was intentionally left out. The sign-in page has no link to it.

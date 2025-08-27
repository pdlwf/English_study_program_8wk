# Design Notes

This refresh aligns the project with Apple's [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/).

## Tokens
- **Typography** – Uses the SF system stack (`-apple-system`, `SF Pro Text/Display`) with a scale of 32/24/20/17/15/13 px and weights 700/600/400. (HIG: Typography)
- **Color roles** – Tokens follow iOS system colors: background, elevated surfaces, label tiers, separator, tint and fill. Both light and dark palettes are provided. (HIG: Color)
- **Spacing & Layout** – Scale of 4–32 px and a max content width of 1040 px to mirror spacious Apple layouts. (HIG: Layout)
- **Corners & Depth** – Radii of 12 px cards, 10 px buttons, 8 px inputs plus subtle shadow token. (HIG: Visual Design)
- **Motion** – Shared transition token (160 ms ease‑out) with `prefers-reduced-motion` support. (HIG: Motion)

## Components
- Buttons support Filled, Tinted and Plain variants with hover/active/focus states and optional compact size.
- Cards use elevated backgrounds with soft shadows.
- Accordions employ real buttons with rotating SF‑style chevrons and proper ARIA wiring.
- Inputs, toasts and progress rings inherit system colors and spacing.

These choices aim to make the web implementation feel native to macOS/iOS users while remaining framework‑free and accessible.

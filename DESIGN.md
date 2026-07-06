---
name: Precision Air
colors:
  surface: '#f8f9ff'
  surface-dim: '#d7dae2'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3fc'
  surface-container: '#ebeef6'
  surface-container-high: '#e5e8f1'
  surface-container-highest: '#dfe2eb'
  on-surface: '#181c22'
  on-surface-variant: '#414753'
  inverse-surface: '#2d3137'
  inverse-on-surface: '#eef1f9'
  outline: '#717785'
  outline-variant: '#c1c6d5'
  surface-tint: '#005eb4'
  primary: '#005baf'
  on-primary: '#ffffff'
  primary-container: '#0074db'
  on-primary-container: '#fefcff'
  inverse-primary: '#a8c8ff'
  secondary: '#455f89'
  on-secondary: '#ffffff'
  secondary-container: '#b3cdfd'
  on-secondary-container: '#3c5780'
  tertiary: '#964400'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc5700'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#a8c8ff'
  on-primary-fixed: '#001b3c'
  on-primary-fixed-variant: '#004689'
  secondary-fixed: '#d6e3ff'
  secondary-fixed-dim: '#adc7f7'
  on-secondary-fixed: '#001b3c'
  on-secondary-fixed-variant: '#2c4770'
  tertiary-fixed: '#ffdbc9'
  tertiary-fixed-dim: '#ffb68c'
  on-tertiary-fixed: '#321200'
  on-tertiary-fixed-variant: '#753400'
  background: '#f8f9ff'
  on-background: '#181c22'
  surface-variant: '#dfe2eb'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '900'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '800'
    lineHeight: 32px
  title-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style

This design system is built on a foundation of **Corporate Modernism** with an emphasis on **Systematic Airiness**. The brand personality is professional, authoritative, and highly efficient, designed to make complex data feel navigable and light.

The target audience consists of professionals in finance, technology, or enterprise management who require high-density information without the cognitive load of a cluttered interface. The UI evokes a sense of "calm productivity" by utilizing generous whitespace, a cool-toned palette, and a rigid mathematical grid. Visual hierarchy is established through precise typographic weighting and subtle tonal shifts rather than aggressive decorative elements.

## Colors

The color palette is dominated by a "Cool Professional" spectrum. The background uses a crisp, slightly blue-tinted white to reduce eye strain compared to pure hex-white. 

**Layering Logic:**
- **Background:** Primary canvas color for the application.
- **Surface Container Low:** Used for sidebar navigation or secondary content areas to create subtle depth.
- **Surface Container Lowest:** Reserved for cards, modals, and primary content blocks to make them "pop" against the background.
- **Primary Accent:** Used sparingly for actionable items and status indicators. 
- **Typography:** Text Primary is a deep charcoal for high legibility; Text Secondary is a muted slate-blue for metadata and captions.

## Typography

The typographic system leverages **Inter** for all UI elements, including headings, body prose, and functional labels, to maintain a unified, modern, and neutral tone. **JetBrains Mono** is introduced specifically for numeric data, tables, and code snippets to ensure alignment and readability in data-heavy views.

**Usage Guidelines:**
- **Headings:** Use ExtraBold (800) or Black (900) weights to create a strong vertical rhythm.
- **Body & Labels:** Use Inter Regular (400) for long-form text and SemiBold (600) or Bold (700) for emphasis and UI labels.
- **Numeric Data:** Always utilize the `data-mono` style for financial figures, IDs, or timestamps to maintain tabular alignment.
- **Scale:** On mobile devices, shrink headlines by one tier (e.g., Headline-LG becomes Headline-LG-mobile) to prevent awkward word wrapping.

## Layout & Spacing

This design system employs a **Fluid-Fixed Hybrid Grid**. The main content area lives within a centered container (max-width 1280px) on desktop, while internal elements follow a strict 8px (base 4px) spacing rhythm.

- **Margins:** 24px (Desktop), 16px (Mobile).
- **Gutters:** 24px consistent spacing between major grid columns.
- **Stacking:** Elements within cards should use `md` (16px) padding, while sections within a page use `xl` (48px) to maintain the "Airy" feel.

## Elevation & Depth

Hierarchy is defined by **Tonal Layering** and **Ambient Shadows**. Surfaces do not use heavy dark shadows; instead, they use "Whisper Shadows"—diffused, low-opacity blurs that make cards feel as if they are hovering just millimeters above the background.

- **Level 0 (Background):** #f8f9ff (Flat).
- **Level 1 (Sub-navigation/Sidebars):** #f1f3fc (Flat, inset).
- **Level 2 (Cards/Modals):** #ffffff (Shadow: 0px 4px 20px rgba(0, 0, 0, 0.04)).

Avoid using borders for elevation. Depth should be felt through the transition from the cool-toned background to the pure white surface.

## Shapes

The shape language is "Soft-Geometric." While the grid is rigid, the corners are softened to make the professional environment feel more approachable.

- **Cards:** 12px corner radius is the standard for primary content containers.
- **Buttons:** 10px corner radius distinguishes actionable items from structural containers.
- **Inputs & Small Components:** 8px radius for a tighter, more functional appearance.
- **Tables:** Header rows should have the top-left and top-right corners rounded to 12px to match card containers.

## Components

### Buttons
- **Primary:** Background color `#005baf`, 10px roundedness, white text. Use `body-sm-bold` for the label.
- **Secondary:** Surface Container Low (`#f1f3fc`) with Text Primary (`#181c22`).

### Cards
- **Style:** Pure white (`#ffffff`), 12px roundedness, and "whisper-soft" diffused shadows. Padding should be a minimum of 24px (`lg`) to ensure an airy feel.

### Tables
- **Structure:** Use `border-separate` with zero spacing.
- **Header:** Rounded top corners (12px), background `#f1f3fc`, text `label-caps`.
- **Rows:** Transparent background by default. On `hover`, change background to `#f1f3fc` with a transition of 150ms.
- **Data:** All numeric values must use `data-mono`.

### Input Fields
- **Style:** Subtle 1px border in `#455f89` (at 20% opacity). Focus state uses a 2px Primary Accent border.

### Chips/Tags
- **Style:** Small 4px roundedness, light tint of the status color (e.g., Success at 10% opacity) with the full-strength color used for the text.

# Design System: ERP WEBAPP
**Project ID:** 693252806641531510

## 1. Visual Theme & Atmosphere
The atmosphere is "Professional, Systematic, and Airy." It follows a modern administrative aesthetic with high information density but balanced by generous whitespace. The UI uses a "Container-based" layout where information is grouped into clearly defined cards with subtle depth.

## 2. Color Palette & Roles
*   **Primary Action Blue (#137fec):** Used for primary buttons, active states, and core branding elements.
*   **Surface Light (#f9f9ff):** General background color for the application.
*   **Surface Container Low (#f1f3fd):** Background for secondary containers and grouping areas.
*   **Surface Container Lowest (#ffffff):** Pure white used for primary content cards and data tables.
*   **Success Emerald (#10B981):** Indicating confirmed states or available slots.
*   **Warning Amber (#f59e0b):** For reserved or pending actions.
*   **Danger Red (#ba1a1a):** For cancellations and error states.
*   **Text Primary (#181c22):** High contrast black for headings and body text.
*   **Text Secondary (#455f89):** Muted blue-grey for labels and supporting information.

## 3. Typography Rules
*   **Headlines:** Uses "Inter" with "Black" (900) or "Extrabold" (800) weights for module titles. Tracking is tight.
*   **Body:** "Inter" for reading. Weights range from Regular (400) to Semibold (600).
*   **Data & Mono:** "JetBrains Mono" is used for all numeric data, IDs, and timestamps to ensure vertical alignment and a technical feel.

## 4. Component Stylings
*   **Buttons:**
    *   **Primary:** Solid background with gradient (#005baf to #0074db), white text, rounded corners (8px-12px).
    *   **Secondary:** Soft grey or blue-grey background with dark text.
    *   **Tabs:** Border-bottom based (2px) for the active state with high-contrast primary color.
*   **Cards/Containers:**
    *   **Standard:** Generously rounded corners (12px), pure white background, whisper-soft diffused shadows.
    *   **Bento Cells:** Different background shades (Surface Container Low) to create hierarchy within a grid.
*   **Tables:**
    *   **Stitch Style:** Border-separate with zero spacing. Rounded headers. Row hover effects with subtle color shifts.

## 5. Layout Principles
*   **Split View:** Use of sticky side panels for high-frequency actions (like "New Reservation").
*   **Bento Grids:** Grouping related controls (Configuration + Visualization) into a cohesive grid structure.
*   **Motion:** Use of `animate-in fade-in` and `slide-in` for all major surface transitions to provide feedback.

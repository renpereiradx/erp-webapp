A professional, bento-grid layout with tabs for managing dynamic Attributes and marketing Tags.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Desktop-first
- Theme: Professional, Systematic, and Airy. Container-based layout.
- Background: Surface Light (#f9f9ff)
- Surface Container: Surface Container Low (#f1f3fd) for secondary containers, Surface Container Lowest (#ffffff) for primary content cards.
- Primary Accent: Primary Action Blue (#137fec) for primary buttons and active states.
- Text Primary: Near Black (#181c22) for headings.
- Text Secondary: Muted blue-grey (#455f89) for labels.
- Success: Emerald (#10B981)
- Danger: Red (#ba1a1a)
- Buttons: Solid background with gradient (#005baf to #0074db) for primary. Soft grey/blue-grey for secondary. Rounded 8-12px.
- Tabs: Border-bottom based (2px) for active state with high-contrast primary color.
- Cards: Generously rounded (12px), pure white, whisper-soft diffused shadows.
- Tables: Stitch Style: Border-separate with zero spacing. Rounded headers. Row hover effects with subtle color shifts.
- Typography: Headings use "Inter" Black/Extrabold. Body uses "Inter" Regular/Semibold. Numeric data uses "JetBrains Mono".

**Page Structure:**
1. **Header Area:** Module title "Atributos y Etiquetas" with primary action buttons.
2. **Navigation Tabs:** Two main tabs: "Definición de Atributos" and "Etiquetas (Tags)".
3. **Atributos Tab Content (Bento Grid):**
   - **Data Table:** Shows attributes with columns: Nombre, Código, Tipo (STRING, NUMBER, BOOLEAN, DATE, LIST), Requerido (checkbox), Filtrable (checkbox), Variante (badge if true).
   - **Form Side Panel:** Fields for Name, Code, Type (select), Category assignment, and checkboxes for (Required, Filterable, Visible, Is Variant). If type is LIST, show dynamic inputs to add/remove options.
4. **Etiquetas Tab Content:**
   - **Data Table:** Shows tags with columns: Nombre, Slug, Color (with visual swatch), Icono, Tipo (GENERAL, PROMOTION, STATUS), Categoría.
   - **Form Side Panel:** Fields for Name, Color Picker (#hex), Icon name, Type (select), and Category assignment (null for Global, ID for exclusive).

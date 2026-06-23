A high-density, professional data-grid matrix for managing Product Variants and their individual stock/prices.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Desktop-first
- Theme: Professional, Systematic, and Airy. Container-based layout.
- Background: Surface Light (#f9f9ff)
- Surface Container: Surface Container Low (#f1f3fd) for secondary containers, Surface Container Lowest (#ffffff) for primary content cards.
- Primary Accent: Primary Action Blue (#137fec) for primary buttons and active states.
- Text Primary: Near Black (#181c22) for headings.
- Text Secondary: Muted blue-grey (#455f89) for labels.
- Success: Emerald (#10B981)
- Warning: Amber (#f59e0b)
- Danger: Red (#ba1a1a)
- Buttons: Solid background with gradient (#005baf to #0074db) for primary. Soft grey/blue-grey for secondary. Rounded 8-12px.
- Cards: Generously rounded (12px), pure white, whisper-soft diffused shadows.
- Tables: Stitch Style: Border-separate with zero spacing. Rounded headers. Row hover effects.
- Typography: Headings use "Inter" Black/Extrabold. Body uses "Inter" Regular/Semibold. Numeric data uses "JetBrains Mono".

**Page Structure:**
1. **Top Context Header:** Displays the Parent Product details (e.g., "Producto: Camisa Polo", "Stock Total: 150", "Categoría: Ropa") with a "Volver" button.
2. **Action Bar:** "Nueva Variante" primary button and a search/filter input.
3. **Variants Data Grid:**
   - A robust table displaying all variants.
   - Columns: SKU (Mono font), Nombre de Variante, Código de Barras (Mono font), Atributos (e.g., badges for Color: Rojo, Talla: M), Stock (Mono font), Precio (Mono font), Estado (Toggle).
   - Inline Editing: Stock and Price columns should look like clickable inputs or have a quick edit button.
4. **New Variant Modal:**
   - Form to create a variant.
   - Fields: SKU (optional, auto-generated placeholder), Barcode.
   - Dynamic Attributes Selectors: e.g., Dropdown for "Color", Dropdown for "Talla".
   - Initial Stock (number input) and Branch Selector (select).
   - Initial Price (number input).
5. **Visual Feedback:** Low stock variants highlighted in Amber. Disabled variants greyed out.

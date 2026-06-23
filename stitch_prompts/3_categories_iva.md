A sophisticated split-view layout featuring an interactive hierarchical tree for Categories and a data grid for IVA rates.

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
- Cards: Generously rounded (12px), pure white, whisper-soft diffused shadows.
- Tables: Stitch Style: Border-separate with zero spacing. Rounded headers. Row hover effects.
- Typography: Headings use "Inter" Black/Extrabold. Body uses "Inter" Regular/Semibold. Numeric data uses "JetBrains Mono".

**Page Structure:**
1. **Header Area:** Module title "Clasificación e Impuestos".
2. **Main Layout (Bento Grid / Split View):**
   - **Left Panel (Árbol de Categorías):** A card containing a hierarchical tree view of categories (parent/child relationships). Each node should have a small action menu (Edit, Add Subcategory, Delete).
   - **Center Panel (Detalle de Categoría):** A sticky form to view/edit the selected category. Fields: Nombre, Descripción, Categoría Padre (select), Tasa de IVA por Defecto (select).
   - **Right Panel (Tasas de IVA y Clasificación SIFEN):** A separate card showing a concise table of Tax Rates (e.g., IVA 10%, IVA 5%, Exento). Columns: Código, Nombre, Tasa (%), Tipo. Include a small button to add new tax rate.
3. **Interactions:** The tree view should highlight the active category. Selecting a category populates the center panel form.

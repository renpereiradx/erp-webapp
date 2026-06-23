A professional, systematic, and airy split-view layout for managing Brands in an ERP system.

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
- Tables: Stitch Style: Border-separate with zero spacing. Rounded headers. Row hover effects with subtle color shifts.
- Typography: Headings use "Inter" Black/Extrabold. Body uses "Inter" Regular/Semibold. Numeric data uses "JetBrains Mono".
- Transitions: animate-in fade-in and slide-in for surface transitions.

**Page Structure:**
1. **Header Area:** Module title "Gestión de Marcas", search bar for brands, and a primary button "Nueva Marca".
2. **Main Content (Split View):**
   - **Left Panel (List/Table):** A data table or bento grid listing all brands. Columns: Logo (thumbnail), Nombre, Slug, Descripción, Estado (Active/Inactive badge).
   - **Right Panel (Slide-over / Details):** A sticky side panel that appears when selecting or creating a brand. 
3. **Brand Form (Inside Right Panel):**
   - Input for "Nombre de la Marca" (required)
   - Input for "Slug" (auto-generated, disabled)
   - Input/Upload for "Logo URL"
   - Textarea for "Descripción"
   - Toggle switch for "Activo/Inactivo"
   - Actions: "Guardar", "Cancelar", and a Danger button "Eliminar" (only if editing).

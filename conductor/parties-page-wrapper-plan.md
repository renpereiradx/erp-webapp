# Implementation Plan: Parties Page Wrapper (Clients & Suppliers)

## Objective
Combine the existing `Clients.jsx` and `Suppliers.jsx` pages into a unified `PartiesPage` using a tabbed interface. This refactoring will enforce the Fluent 2 design system guidelines, particularly adhering to the `layout-guidelines.md` by removing redundant structural wrappers from sub-pages and delegating layout to the new wrapper. The application routing will be updated to a single route (`/parties`).

## Scope & Context
*   **Target Pages**: `src/pages/Clients.jsx`, `src/pages/Suppliers.jsx`
*   **New Component**: `src/pages/PartiesPage.jsx`
*   **Routing**: `src/App.tsx` (and any sidebar/navigation links)
*   **Design System**: Fluent 2 components (Tabs, Cards), `visual-refinement.md` (`overflow-hidden` for rounded borders), `layout-guidelines.md` (fluid layout delegation).

## Implementation Steps

### 1. Create the `PartiesPage` Wrapper
*   Create `src/pages/PartiesPage.jsx`.
*   Implement the page-level structure: `min-h-screen`, background, breadcrumbs, and a unified Page Header ("Gestión de Entidades" or "Directorio de Clientes y Proveedores").
*   Implement a Fluent 2 style Tab component to toggle between "Clientes" and "Proveedores".
*   Ensure state (active tab) is managed properly, potentially syncing with URL search params (e.g., `?tab=clients`) so linking to a specific tab works.

### 2. Refactor `Clients.jsx` into a Tab View
*   **Remove redundant layout**: Delete the outer `<div className="min-h-screen bg-[#f3f4f6] ...">` and `max-w-[1600px]`.
*   **Remove Header**: Remove the Breadcrumbs and Page Title (now handled by `PartiesPage`).
*   **Apply best practices**: Wrap the content (toolbar + table) in `<div className="flex flex-col gap-6 animate-in fade-in duration-500">`.
*   **Design Polish**: Ensure the table container uses `overflow-hidden` along with `rounded-xl` per `visual-refinement.md`.

### 3. Refactor `Suppliers.jsx` into a Tab View
*   Apply the exact same layout stripping and best practices as `Clients.jsx`.
*   Ensure the component renders smoothly within the tab container without triggering double scrollbars.

### 4. Update Routing and Navigation
*   Modify `src/App.tsx`: Remove `/clientes` and `/proveedores` routes.
*   Add a new route `<Route path='/parties' element={<PartiesPage />} />`.
*   Search for any navigation components (like a Sidebar or Dashboard quick links) that point to the old routes and update them to `/parties` (optionally appending the tab query parameter).

## Verification & Testing
*   Verify that clicking the tabs switches views without full page reloads.
*   Check that searching, filtering, and pagination still work independently within each tab.
*   Inspect the DOM to ensure there are no double scrollbars or nested `min-h-screen` containers causing layout issues on smaller screens.
*   Confirm visual fidelity with Fluent 2 guidelines (colors, shadows `fluent-2`, rounded corners with `overflow-hidden`).
# Plan: Unified User Modal with Fluent 2.0 Styles

## Objective
Combine the existing `CreateUserModal.jsx` and `EditUserModal.jsx` into a single, dynamic `UserModal.tsx` component. Apply the Fluent 2.0 design system styles using the correct Tailwind utility classes, in alignment with `@docs/design-system/README.md`. Update `UserManagementList.tsx` to use this new unified modal.

## Key Files & Context
- **Target File:** `src/components/users/UserModal.tsx` (New unified modal, will replace `CreateUserModal.jsx` and `EditUserModal.jsx`).
- **File to Update:** `src/pages/UserManagementList.tsx`.
- **API/Store Dependency:** `useUserStore` for `createUser`, `updateUser`, and `fetchRoles`.

## Implementation Steps

### 1. Create `UserModal.tsx`
Create a new component `UserModal` that takes the following props:
- `open: boolean`
- `onOpenChange: (open: boolean) => void`
- `user?: User | null` (If provided, modal acts in 'edit' mode).

### 2. Form Schema and Logic
Use `react-hook-form` to manage the form state:
- **Default Values:** Initialize with empty strings for create, or populate with `user` data for edit.
- **Dynamic Fields:**
  - **Always show:** First Name, Last Name, Username, Email, Phone.
  - **Create Mode Only:** Password, Role Selection. (In edit mode, these are handled via separate actions/endpoints as per the API spec).
- **Submission:**
  - If `user` exists: Call `updateUser(user.id, payload)`.
  - If `user` does not exist: Call `createUser(payload)`.

### 3. Apply Fluent 2.0 Styling
Replace existing BEM (`user-form__*`) classes with standard Fluent 2.0 Tailwind classes:
- **Modal Container:** `sm:max-w-[600px] p-0 overflow-hidden border-none shadow-fluent-64` (or `shadow-2xl`).
- **Header:** `bg-slate-50/50 border-b border-border-subtle p-6`
- **Sections:** `p-6 space-y-6`
- **Inputs & Selects:** `h-11 rounded-xl border border-border-subtle bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm font-medium`
- **Buttons:**
  - Primary (Save/Create): `bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest px-6 h-11 rounded-lg`
  - Secondary (Cancel): `h-11 px-6 border-border-subtle font-black uppercase text-[11px] tracking-widest hover:bg-slate-50 rounded-lg bg-white`

### 4. Update `UserManagementList.tsx`
- Remove imports for `CreateUserModal` and `EditUserModal`.
- Import the new `UserModal`.
- Consolidate state variables (optional, or just reuse `isCreateModalOpen` and `isEditModalOpen` to control the same modal, passing `user={null}` or `user={userToEdit}`).
  - Recommended: Single state `isModalOpen` and `selectedUser`.
  - Update handlers (`handleCreateClick`, `handleEditClick`, `handleCloseModal`).
- Render `<UserModal open={isModalOpen} onOpenChange={handleCloseModal} user={selectedUser} />`.

### 5. Cleanup
- Delete `src/components/users/CreateUserModal.jsx`.
- Delete `src/components/users/EditUserModal.jsx`.

## Verification & Testing
1. **Create User:** Open modal, verify password and role fields are visible. Fill out the form, submit, and verify `createUser` is called correctly.
2. **Edit User:** Select a user, verify password and role fields are hidden. Verify form is pre-populated. Change a field, submit, and verify `updateUser` is called with the correct payload.
3. **Styling:** Visually verify the modal against other Fluent 2.0 styled components in the app (e.g., inputs have correct border, height, and focus ring).
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
pnpm dev                    # Start development server on localhost:5173
pnpm build                  # Build for production
pnpm preview               # Preview production build

# Testing
pnpm test                  # Run unit tests with Vitest
pnpm test:ui               # Run tests with UI interface
pnpm test:e2e              # Run Playwright E2E tests

# Code Quality
pnpm lint                  # Run ESLint
```

## Architecture Overview

This is a modern ERP web application built with React 19, Vite 6, and Tailwind CSS 4. The application features a multi-theme system supporting Neo-Brutalism, Material Design, and Fluent Design.

### Key Architectural Patterns

- **State Management**: Zustand stores located in `src/store/` for each major domain (Auth, Products, Clients, Suppliers, Sales, Reservations)
- **Feature-Based Structure**: The `src/features/products/` directory demonstrates a feature-centric organization with its own hooks, services, types, and tests
- **Component Architecture**: Radix UI components with custom styling in `src/components/ui/`
- **Internationalization**: Custom i18n system in `src/lib/i18n.js` supporting Spanish and English
- **Theme System**: Multi-theme support with CSS files in `src/themes/` and utilities in `src/utils/themeUtils.js`

### State Stores

- `useAuthStore.js` - Authentication and user session management
- `useProductStore.js` - Product catalog and inventory management
- `useClientStore.js` - Customer relationship management
- `useSupplierStore.js` - Supplier management
- `useSaleStore.js` - Sales transaction handling
- `useReservationStore.js` - Service booking system

### API Integration

- Base API client in `src/services/api.js`
- Feature-specific services like `src/services/clientService.js`
- Mock data and development utilities in `src/constants/`

### Testing Strategy

- Unit tests with Vitest (setup in `vitest.setup.ts`)
- E2E tests with Playwright (config in `playwright.config.ts`)
- Accessibility testing with `@axe-core/playwright`
- MSW for API mocking in tests

### Build Configuration

- Vite config includes manual chunk splitting for React, Router, Radix UI, and other major dependencies
- Tailwind CSS with custom plugins and configuration
- Path alias `@/` maps to `src/`
- ESLint configuration relaxes some rules for development and test files

## Package Manager

This project uses **pnpm** as specified in `package.json`. Always use pnpm commands.

## Development Notes

- The application has comprehensive i18n coverage with interpolation support
- Authentication system includes auto-login and token management
- Multiple theme variants are supported with dynamic switching
- Extensive test coverage including accessibility and keyboard navigation tests
- Component library built on Radix UI primitives with custom styling
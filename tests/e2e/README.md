Playwright E2E tests for the project.

Install:
  pnpm add -D @playwright/test @axe-core/playwright
  npx playwright install

Run locally:
  pnpm run test:e2e

Notes:
- Tests mock network calls to `/api/products*` using Playwright route interception and the fixture in `tests/fixtures/products-list.json`.
- AXE checks are optional; install `@axe-core/playwright` to enable accessibility assertions.

import '@testing-library/jest-dom';

// Worker stability: force a full GC between test files (setup runs once per file).
// Without this, one fork accumulates several jsdom environments and OOMs on long runs
// ("Worker exited unexpectedly"). Requires --expose-gc in poolOptions.forks.execArgv.
try {
  (globalThis as any).gc?.();
} catch {
  // gc not exposed (e.g. singleFile or custom pool) — no-op
}

// MSW setup (optional per test)
// We keep handlers per test file to avoid global intercepts unless needed.

// Mock a basic i18n used across components to simplify tests: t(key, vars) returns interpolated string
import * as i18nModule from '@/lib/i18n';
import { tRaw } from '@/lib/i18n';

const fakeT = (key, vars) => {
  if (!key) return '';
  let template = tRaw(key, '', {});
  // If tRaw returns the key, fall back to a readable fragment
  if (!template || template === key) template = (key.includes('.') ? key.split('.').slice(-1)[0].replace(/_/g, ' ') : key);
  if (!vars) return template;
  return String(template).replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
};

try {
  const spyHost = (globalThis as any).vi || (globalThis as any).jest;
  if (spyHost && typeof spyHost.spyOn === 'function') {
    spyHost.spyOn(i18nModule, 'useI18n').mockImplementation(() => ({ t: fakeT, lang: 'es', setLang: () => {} }));
  }
} catch (e) {
  // ignore in non-test environments
}

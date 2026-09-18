import '@testing-library/jest-dom';

// jsdom no implementa ResizeObserver: primitivas Radix que miden su trigger
// (react-use-size) lo necesitan al montar (FASE E: Checkbox en el form de
// terminales). Stub mínimo, sin observación real.
if (typeof (globalThis as any).ResizeObserver === 'undefined') {
  (globalThis as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

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
import { tRaw, registerTranslations } from '@/lib/i18n';
// Namespace bi.* diferido en runtime (chunk lazy): en tests se registra
// síncrono para que tRaw devuelva el texto real (F5 bundle budget).
import { bi as biEs } from './src/lib/i18n/locales/es/bi';
import { bi as biEn } from './src/lib/i18n/locales/en/bi';
registerTranslations('es', biEs);
registerTranslations('en', biEn);

// Firma real de t(key, fallback?, vars?): el mock anterior descartaba el
// fallback y trataba el 2do arg string como vars, rompiendo la interpolación
// (renderizaba "{n} factura{s}" literal en tests de componentes BI).
const fakeT = (key, fallbackOrVars, maybeVars) => {
  if (!key) return '';
  const fallback = typeof fallbackOrVars === 'string' ? fallbackOrVars : undefined;
  const vars = (typeof fallbackOrVars === 'object' && fallbackOrVars !== null ? fallbackOrVars : maybeVars) ?? {};
  let template = tRaw(key, '', {});
  if ((!template || template === key) && fallback !== undefined) template = fallback;
  // If tRaw returns the key, fall back to a readable fragment
  if (!template || template === key) template = (key.includes('.') ? key.split('.').slice(-1)[0].replace(/_/g, ' ') : key);
  if (!vars || typeof vars !== 'object') return template;
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

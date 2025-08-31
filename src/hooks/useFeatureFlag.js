/**
 * useFeatureFlag simplificado para MVP - Sin hooks problemáticos
 * Versión que no usa useState para evitar problemas de contexto React
 */

const KEY = 'feature.flags.v1';
let cache = null;

function load() {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY)) || {};
  } catch { cache = {}; }
  return cache;
}

function save(obj) { 
  cache = obj; 
  localStorage.setItem(KEY, JSON.stringify(obj)); 
}

// Versión simplificada sin hooks para MVP
export function useFeatureFlag(flag, defaultValue = false) {
  // Para MVP, siempre retornar valor por defecto
  // y función no-op para setear
  const value = load()[flag] ?? defaultValue;
  const setFlag = (v) => {
    const all = load();
    all[flag] = v;
    save(all);
    // No hay setState porque no usamos hooks
  };
  return [value, setFlag];
}

// Versión simplificada sin hooks
export function useFeatureFlags() {
  const flags = load();
  const setFlag = (flag, val) => {
    const all = load();
    all[flag] = val;
    save(all);
  };
  return { flags, setFlag };
}
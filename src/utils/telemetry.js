// Telemetría simple en memoria para métricas básicas
// Uso:
//  const t = telemetry.startTimer('products.search');
//  // ... operación
//  const ms = telemetry.endTimer(t, { extra: 'data' });
//  telemetry.record('products.search.success', { ms });

const _state = {
  counters: {},
  last: {},
};

function now() {
  if (typeof performance !== 'undefined' && performance.now) return performance.now();
  return Date.now();
}

const isDev = (typeof import.meta !== 'undefined' && import.meta.env) ? (import.meta.env.DEV || import.meta.env.MODE !== 'production') : true;

export const telemetry = {
  startTimer(name) {
    const start = now();
    return { name, start };
  },
  endTimer(token, data) {
    if (!token || !token.start) return 0;
    const ms = Math.max(0, now() - token.start);
    _state.last[token.name] = { ms, ...(data || {}) };
    return ms;
  },
  record(name, data) {
    _state.counters[name] = (_state.counters[name] || 0) + 1;
    _state.last[name] = data || {};
    // Evitar ruido en producción; aún así útil en dev
    if (isDev && typeof console !== 'undefined' && typeof console.debug === 'function') {
    }
  },
  get(name) {
    return {
      count: _state.counters[name] || 0,
      last: _state.last[name],
    };
  },
  getAll() {
    return { counters: { ..._state.counters }, last: { ..._state.last } };
  }
};

export default telemetry;

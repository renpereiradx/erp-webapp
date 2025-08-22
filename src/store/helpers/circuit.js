// Generic circuit breaker helpers for Zustand stores
// Designed to be lightweight and framework-agnostic
// Stores are expected to hold in state:
//   circuit: { openUntil, failures, threshold, cooldownMs }
//   circuitOpen: boolean
//   circuitTimeoutId: any
// Optionally telemetry with record(event, payload)

export function createCircuitHelpers(component = 'component', telemetry) {
  const record = (...args) => { try { telemetry?.record?.(...args); } catch {} };

  const init = (overrides = {}) => ({
    circuit: { openUntil: 0, failures: 0, threshold: 4, cooldownMs: 30000, ...overrides },
    circuitOpen: false,
    circuitTimeoutId: null
  });

  const close = (get, set, reason = 'manual') => {
    const state = get();
    try { if (state.circuitTimeoutId) clearTimeout(state.circuitTimeoutId); } catch {}
    set((s) => ({
      circuit: { ...s.circuit, failures: 0, openUntil: 0 },
      circuitOpen: false,
      circuitTimeoutId: null
    }));
    record('circuit.close', { component, reason });
  };

  const recordSuccess = (get, set) => {
    close(get, set, 'success');
  };

  const isOpen = (get, set) => {
    const { circuit, circuitOpen, circuitTimeoutId } = get();
    const now = Date.now();
    if (circuit.openUntil && now >= circuit.openUntil) {
      // cooldown expired -> close
      close(get, set, 'cooldown-expired');
      return false;
    }
    return !!circuitOpen && circuit.openUntil && now < circuit.openUntil;
  };

  const recordFailure = (get, set) => {
    const state = get();
    const failures = (state.circuit?.failures || 0) + 1;
    let openUntil = state.circuit.openUntil;
    let timeoutId = state.circuitTimeoutId;
    if (failures >= state.circuit.threshold) {
      openUntil = Date.now() + state.circuit.cooldownMs;
      try { if (timeoutId) clearTimeout(timeoutId); } catch {}
      timeoutId = setTimeout(() => {
        try { close(get, set, 'timeout'); } catch {}
      }, state.circuit.cooldownMs);
      set({
        circuit: { ...state.circuit, failures, openUntil },
        circuitTimeoutId: timeoutId,
        circuitOpen: true
      });
      record('circuit.open', { component, failures, openUntil });
      return;
    }
    set({ circuit: { ...state.circuit, failures, openUntil } });
  };

  return { init, recordFailure, recordSuccess, isOpen, close };
}

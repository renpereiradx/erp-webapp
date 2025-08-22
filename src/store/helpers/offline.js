// Offline snapshot helpers shared across stores
// Provides persist and hydrate functions bound to a storage key and optional telemetry namespace

export function createOfflineSnapshotHelpers(storageKey, feature, telemetry) {
  const record = (...args) => { try { telemetry?.record?.(...args); } catch {} };
  return {
    persist(snapshot = []) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(snapshot));
        record(`feature.${feature}.offline.snapshot.persist`, { count: snapshot.length });
      } catch {}
    },
    hydrate(set) {
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        // caller decides shape; we only return parsed
        record(`feature.${feature}.offline.snapshot.hydrate`, { count: parsed.length });
        return parsed;
      } catch { return null; }
    }
  };
}

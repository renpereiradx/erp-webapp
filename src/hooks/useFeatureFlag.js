import { useCallback, useState, useEffect } from 'react';

const KEY = 'feature.flags.v1';
let cache = null;

function load() {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY)) || {};
  } catch { cache = {}; }
  return cache;
}
function save(obj) { cache = obj; localStorage.setItem(KEY, JSON.stringify(obj)); }

export function useFeatureFlag(flag, defaultValue = false) {
  const [value, setValue] = useState(() => load()[flag] ?? defaultValue);
  const setFlag = useCallback((v) => {
    const all = load();
    all[flag] = v;
    save(all);
    setValue(v);
  }, [flag]);
  return [value, setFlag];
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState(load());
  useEffect(() => { setFlags(load()); }, []);
  const setFlag = (flag, val) => {
    const all = load();
    all[flag] = val;
    save(all);
    setFlags({ ...all });
  };
  return { flags, setFlag };
}

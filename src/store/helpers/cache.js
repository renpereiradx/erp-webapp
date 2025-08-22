// Generic cache helpers (LRU-ish trimming + page invalidation patterns)
// These are intentionally simple and data-structure agnostic.

/**
 * lruTrim - trims a timestamped map-like object to a limit using ascending ts order
 * @param {Record<string,{ts:number,[k:string]:any}>} cache
 * @param {number} limit
 * @returns {{cache: Record<string,any>, removed: string[]}}
 */
export function lruTrim(cache, limit) {
  if (!cache) return { cache: {}, removed: [] };
  const keys = Object.keys(cache);
  if (keys.length <= limit) return { cache, removed: [] };
  const sorted = keys.map(k => ({ k, ts: cache[k]?.ts || 0 })).sort((a,b)=>a.ts-b.ts);
  const toRemove = sorted.slice(0, keys.length - limit).map(e=>e.k);
  if (!toRemove.length) return { cache, removed: [] };
  const clone = { ...cache };
  toRemove.forEach(k => { delete clone[k]; });
  return { cache: clone, removed: toRemove };
}

/**
 * invalidatePages - invalidates pages around a given page for a (search,page) keyed cache
 * key format: `${search||'__'}|${page}`
 */
export function invalidatePages(pageCache, { search = '', page = 1, radius = 1 }) {
  if (!pageCache) return { removed: [] };
  const base = search || '__';
  const target = new Set();
  for (let p = Math.max(1, page - radius); p <= page + radius; p += 1) target.add(p);
  const removed = [];
  Object.keys(pageCache).forEach(k => {
    const [sKey, pStr] = k.split('|');
    const pNum = parseInt(pStr, 10);
    if (sKey === base && target.has(pNum)) {
      removed.push(pNum);
      delete pageCache[k];
    }
  });
  return { removed: removed.sort((a,b)=>a-b) };
}

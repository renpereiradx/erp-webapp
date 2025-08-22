// Shared reliability helpers (retry + error classification)
// Generic, can be reused across domain stores (Products, Suppliers, etc.)

export function classifyError(msg = '') {
  const m = (msg || '').toLowerCase();
  if (m.includes('network') || m.includes('conex')) return 'NETWORK';
  if (m.includes('timeout')) return 'TIMEOUT';
  if (m.includes('valid')) return 'VALIDATION';
  if (m.includes('unauthorized') || m.includes('auth')) return 'UNAUTHORIZED';
  if (m.includes('not found')) return 'NOT_FOUND';
  if (m.includes('rate')) return 'RATE_LIMIT';
  if (m.includes('conflict')) return 'CONFLICT';
  return 'UNKNOWN';
}

/**
 * withRetry - exponential backoff + jitter retry helper
 * @param {Function} fn async function to execute
 * @param {Object} options configuration
 * @param {number} options.retries max retries (default 2)
 * @param {number} options.baseDelay base delay ms (default 180)
 * @param {string} options.op operation label for telemetry
 * @param {Function} [options.telemetryRecord] optional telemetry.record wrapper
 * @param {Function} [options.onRetry] optional callback on each retry (attempt index, error)
 * @returns {Promise<any>}
 */
export async function withRetry(fn, { retries = 2, baseDelay = 180, op, telemetryRecord, onRetry } = {}) {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries) throw err;
      try { telemetryRecord?.('feature.retry', { attempt: attempt + 1, max: retries, op }); } catch {} // generic namespace if domain not provided
      try { onRetry?.(attempt + 1, err); } catch {}
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 100;
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, delay));
      attempt += 1;
    }
  }
}

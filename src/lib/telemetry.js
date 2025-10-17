// Telemetry minimal bridge - unify record/track APIs
// Uso: telemetry.track(event, data) o telemetry.record(event, data)
// En producción se puede reemplazar por un cliente real (Segment, OpenTelemetry, etc.)

const isDev = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';

function log(event, data, level = 'debug') {
  if (!isDev) return;
}

export const telemetry = {
  record(event, data = {}) {
    try { log(event, data); } catch (_) {}
  },
  track(event, data = {}) { this.record(event, data); },
  startTimer(event, data = {}) {
    const start = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    return {
      end: (extra = {}) => {
        const end = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        const duration = end - start;
        this.record(event + '.duration', { duration, ...data, ...extra });
        return duration;
      }
    };
  },
  endTimer(timerHandle, extra) {
    if (timerHandle && typeof timerHandle.end === 'function') {
      return timerHandle.end(extra);
    }
    return 0;
  }
};

export default telemetry;

// Lightweight performance metrics collection (re-render counts & FPS sampling)
const perfState = {
  counters: {},
  samples: [],
  lastFrame: null,
  running: false,
};

export function trackRender(key) {
  perfState.counters[key] = (perfState.counters[key] || 0) + 1;
}

function loop(ts) {
  if (perfState.lastFrame != null) {
    const delta = ts - perfState.lastFrame;
    const fps = 1000 / delta;
    perfState.samples.push(fps);
    if (perfState.samples.length > 300) perfState.samples.shift();
  }
  perfState.lastFrame = ts;
  if (perfState.running) requestAnimationFrame(loop);
}

export function startFPS() {
  if (!perfState.running) {
    perfState.running = true;
    requestAnimationFrame(loop);
  }
}

export function stopFPS() { perfState.running = false; }

export function getPerfSnapshot() {
  const { samples, counters } = perfState;
  const avg = samples.length ? (samples.reduce((a,b)=>a+b,0)/samples.length) : 0;
  const last = samples[samples.length -1] || 0;
  return { avgFPS: avg, lastFPS: last, renders: { ...counters } };
}

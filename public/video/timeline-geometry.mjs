export const TRACK_HEADER_WIDTH = 150;
export const PLAYHEAD_GUTTER = 72;
export const MIN_PIXELS_PER_SECOND = 8;
export const MAX_PIXELS_PER_SECOND = 640;

export function timelineWidth(duration, pixelsPerSecond, minimum = 320) {
  const safeDuration = Math.max(0, Number(duration) || 0);
  const scale = Math.max(MIN_PIXELS_PER_SECOND, Math.min(MAX_PIXELS_PER_SECOND, Number(pixelsPerSecond) || MIN_PIXELS_PER_SECOND));
  return safeDuration > 0 ? Math.max(minimum, safeDuration * scale) : minimum;
}

export function timeAtTimelineX(clientX, viewportRect, scrollLeft, duration, pixelsPerSecond, gutter = 72) {
  if (!viewportRect || !(viewportRect.width > 0)) return 0;
  const contentX = clientX - viewportRect.left + Math.max(0, Number(scrollLeft) || 0) - gutter;
  return Math.max(0, Math.min(Math.max(0, Number(duration) || 0), contentX / Math.max(1, Number(pixelsPerSecond) || 1)));
}

export function snapTime(time, { step, threshold = 0, points = [] } = {}) {
  const value = Math.max(0, Number(time) || 0);
  const candidates = [...points];
  if (Number.isFinite(step) && step > 0) {
    const grid = Math.round(value / step) * step;
    if (Math.abs(grid - value) <= Math.max(0, threshold)) candidates.push(grid);
  }
  let nearest = value;
  let distance = Math.max(0, threshold);
  for (const point of candidates) {
    if (!Number.isFinite(point) || point < 0) continue;
    const delta = Math.abs(point - value);
    if (delta <= distance) { nearest = point; distance = delta; }
  }
  return Math.round(nearest * 1e6) / 1e6;
}

export function timecodeTicks(duration, pixelsPerSecond, targetGapPx = 72) {
  const safeDuration = Math.max(0, Number(duration) || 0);
  const scale = Math.max(MIN_PIXELS_PER_SECOND, Number(pixelsPerSecond) || MIN_PIXELS_PER_SECOND);
  const targetSeconds = targetGapPx / scale;
  const power = 10 ** Math.floor(Math.log10(Math.max(targetSeconds, 0.001)));
  const fraction = targetSeconds / power;
  const multiplier = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  const step = power * multiplier;
  if (!Number.isFinite(step) || step <= 0) return [];
  const ticks = [];
  for (let time = 0; time <= safeDuration + step * 1e-6; time += step) {
    ticks.push({ time: Math.min(time, safeDuration), major: true });
  }
  if (ticks.length === 0) ticks.push({ time: 0, major: true });
  return ticks;
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_PIXELS_PER_SECOND, MIN_PIXELS_PER_SECOND, snapTime, timeAtTimelineX, timecodeTicks, timelineWidth } from '../public/video/timeline-geometry.mjs';
import { readFile } from 'node:fs/promises';
const editorHtml = await readFile(new URL('../public/video/index.html', import.meta.url), 'utf8');
const editorCss = await readFile(new URL('../public/video/video.css', import.meta.url), 'utf8');

test('ComeCut-style editor dock has unique timeline IDs and a contained 16:7 preview stage', () => {
  for (const id of ['timelineDock', 'timeline', 'timelineViewport', 'timelineContent', 'ruler', 'trackList', 'playhead', 'video', 'overlayCanvas']) {
    assert.equal((editorHtml.match(new RegExp(`id="${id}"`, 'g')) || []).length, 1, `${id} must have one owner`);
  }
  assert.match(editorHtml, /class="timeline-dock"[\s\S]*id="timeline"/);
  assert.match(editorCss, /grid-template-rows:minmax\(0,1fr\) auto/);
  assert.match(editorCss, /#video,.minimal-editor #overlayCanvas\{[^}]*object-fit:contain/);
  assert.match(editorCss, /\.timeline-dock\{grid-column:1 \/ -1;grid-row:2/);
});

test('timeline width clamps zoom and preserves a usable empty viewport', () => {
  assert.equal(timelineWidth(0, 64, 480), 480);
  assert.equal(timelineWidth(10, 1000, 320), 10 * MAX_PIXELS_PER_SECOND);
  assert.equal(timelineWidth(10, 0, 320), 320);
  assert.equal(timelineWidth(10, 0, 0), 10 * MIN_PIXELS_PER_SECOND);
});

test('time mapping includes horizontal scroll and clamps to the timeline bounds', () => {
  const rect = { left: 100, width: 400 };
  assert.equal(timeAtTimelineX(200, rect, 100, 20, 10), 12.8);
  assert.equal(timeAtTimelineX(100, rect, 0, 20, 10), 0);
  assert.equal(timeAtTimelineX(800, rect, 0, 20, 10), 20);
  assert.equal(timeAtTimelineX(400, rect, 0, 20, 10, 222), 7.8);
  assert.equal(timeAtTimelineX(10, { left: 0, width: 0 }, 0, 20, 10), 0);
});

test('snapTime prefers the nearest candidate inside threshold and leaves distant time alone', () => {
  assert.equal(snapTime(4.96, { threshold: 0.1, points: [3, 5, 8] }), 5);
  assert.equal(snapTime(4.7, { threshold: 0.1, points: [5] }), 4.7);
  assert.equal(snapTime(4.62, { step: 0.25, threshold: 0.13 }), 4.5);
  assert.equal(snapTime(-2), 0);
});

test('time ruler selects a practical tick interval as zoom changes', () => {
  const wide = timecodeTicks(60, 64);
  const close = timecodeTicks(60, 320);
  assert.ok(wide.length > 0 && wide.length < 40);
  assert.ok(close.length > wide.length);
  assert.equal(wide[0].time, 0);
  assert.ok(wide.every((tick, index) => index === 0 || tick.time > wide[index - 1].time));
});

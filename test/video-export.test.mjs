import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject, reduceProject } from '../public/video/video-state.mjs';
import { createFrameRenderer } from '../public/video/video-export.mjs';
import { createHistory, undo, redo } from '../public/video/video-state.mjs';

function recordingContext() {
  const text = [];
  return {
    text,
    font: '',
    fillStyle: '',
    fillRect() {},
    save() {},
    restore() {},
    translate() {},
    scale() {},
    fillText(value) { text.push(value); },
  };
}

test('undo and redo revisions stay monotonic for audit clients', () => {
  let history = createHistory(createProject());
  const initialRevision = history.present.revision;
  const withTrack = reduceProject(history.present, { type: 'media.video.track.add', track: { id: 'audio-1', kind: 'audio' } });
  history = { past: [history.present], present: withTrack, future: [] };
  const editRevision = history.present.revision;
  history = undo(history);
  assert.equal(history.present.revision, editRevision + 1);
  assert.equal(history.present.tracks.length, 1);
  history = redo(history);
  assert.equal(history.present.revision, editRevision + 2);
  assert.equal(history.present.tracks.length, 2);
  assert.ok(history.present.revision > initialRevision);
});

test('frame renderer reuses its composite plan and keeps overlay z-order across frames', () => {
  let project = createProject();
  project = reduceProject(project, {
    type: 'media.video.overlay.add',
    overlay: { id: 'late', kind: 'text', name: 'late', content: 'late', start: 0, end: 4 },
  });
  project = reduceProject(project, {
    type: 'media.video.overlay.add',
    overlay: { id: 'early', kind: 'text', name: 'early', content: 'early', start: 0, end: 4 },
  });
  project.overlays.find(item => item.id === 'late').zIndex = 2;
  project.overlays.find(item => item.id === 'early').zIndex = 1;

  const context = recordingContext();
  const render = createFrameRenderer(context, 640, 360, project, new Map(), new Map());
  render(0);
  project.overlays.reverse();
  project.overlays.forEach((item, index) => { item.zIndex = index; });
  render(1);

  assert.deepEqual(context.text, ['early', 'late', 'early', 'late']);
});

test('frame renderer precomputes subtitle layout and honors half-open clip intervals', () => {
  let project = createProject();
  const textTrack = { id: 'text-main', kind: 'text' };
  project = reduceProject(project, { type: 'media.video.track.add', track: textTrack });
  project = reduceProject(project, {
    type: 'media.video.clip.add',
    clip: { id: 'cue', trackId: textTrack.id, text: 'first\nsecond', start: 1, duration: 2, style: { size: 0.1, weight: 700, family: 'serif', color: '#0f0' } },
  });
  project = reduceProject(project, {
    type: 'media.video.clip.add',
    clip: { id: 'short', trackId: textTrack.id, text: 'short', start: 3, duration: 0.5 },
  });

  const context = recordingContext();
  const render = createFrameRenderer(context, 640, 360, project, new Map(), new Map());
  render(1);
  assert.deepEqual(context.text, ['first', 'second']);
  assert.equal(context.font, '700 36px serif');
  assert.equal(context.fillStyle, '#0f0');

  context.text.length = 0;
  render(3);
  assert.deepEqual(context.text, ['short']);

  context.text.length = 0;
  render(3.5);
  assert.deepEqual(context.text, []);
});

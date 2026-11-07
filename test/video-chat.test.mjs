import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8');
const load = vm.runInNewContext(`(() => { let registered; window.__ModuleLoader__ = { load(value) { registered = value } }; ${source}\n; return registered })()`, {
  window: {},
  console,
  setTimeout,
  clearTimeout,
  AbortController,
  URL,
  URLSearchParams,
  crypto: { randomUUID: () => 'test-id' },
  location: { origin: 'http://localhost' },
});
const React = { createElement: () => null, useState: value => [value, () => {}], useRef: value => ({ current: value }), useEffect() {}, useLayoutEffect() {} };
const plugin = load.factory(name => name === 'react' ? React : {});

test('video helper prompts are local suggestions for the DSH conversation', () => {
  const suggestions = plugin.chat.videoSuggestions;
  assert.equal(suggestions.length, 6);
  assert.ok(suggestions.some(text => text.includes('读取当前工程和选中片段')));
  assert.ok(suggestions.some(text => text.includes('先给出问题清单')));
  assert.ok(suggestions.some(text => text.includes('不要直接写入')));
  assert.equal(typeof plugin.chat.sendPrompt, 'function');
});

test('assistant suggestions are progressively disclosed without changing send behavior', () => {
  assert.equal(plugin.chat.suggestionsFor(false).length, 3);
  assert.equal(plugin.chat.suggestionsFor(true).length, 6);
  assert.deepEqual(Array.from(plugin.chat.suggestionsFor(false)), Array.from(plugin.chat.videoSuggestions.slice(0, 3)));
});

test('chat CSS installs once and is safe when the document is unavailable', () => {
  assert.equal(plugin.chat.installChatStyles(null), false);
  const styles = new Map();
  const head = { appendChild(node) { styles.set(node.id, node); } };
  const doc = { head, createElement() { return { id: '', textContent: '' }; }, getElementById(id) { return styles.get(id) || null; } };
  assert.equal(plugin.chat.installChatStyles(doc), true);
  assert.equal(plugin.chat.installChatStyles(doc), false);
  assert.match(styles.get('media-video-chat-layout').textContent, /\.mv-chat-suggestions/);
});

test('ComeCut-inspired assistant starters cover editing, audio, subtitles, and a no-write plan', () => {
  const suggestions = plugin.chat.videoSuggestions;
  assert.ok(suggestions.some(text => text.includes('音量')));
  assert.ok(suggestions.some(text => text.includes('字幕')));
  assert.ok(suggestions.some(text => text.includes('配音工作流')));
  assert.ok(suggestions.some(text => text.includes('不要执行')));
  assert.ok(plugin.chat.assistantContract.includes('先读取当前工程状态'));
  assert.ok(plugin.chat.assistantContract.includes('不得声称已执行'));
});

test('video tool cards use human-readable operation and status labels', () => {
  const card = plugin.chat.toolCard({ toolName: 'media_video_apply_command', result: { status: 'applied', revision: 4, operation: 'media.video.clip.trim', clipId: 'clip-123456789' } }, false);
  assert.equal(card.name, '编辑时间线');
  assert.equal(card.status, '已应用');
  assert.match(card.line, /修剪片段/);
  assert.match(card.line, /clip-123/);
  const pending = plugin.chat.toolCard({ toolName: 'media_video_apply_command', result: { status: 'pending', operation: 'media.video.clip.remove', clipId: 'clip-abc' } }, false);
  assert.equal(pending.status, '等待确认');
  assert.match(pending.line, /移除片段/);
});

test('ComeCut-inspired assistant starters only fill the composer and never submit automatically', () => {
  let draft = '';
  let focused = false;
  const accepted = plugin.chat.chooseSuggestion(plugin.chat.videoSuggestions[0], value => { draft = value; }, { focus() { focused = true; } });
  assert.equal(accepted, true);
  assert.equal(draft, plugin.chat.videoSuggestions[0]);
  assert.equal(focused, true);
  assert.equal(plugin.chat.chooseSuggestion('  ', value => { draft = value; }, null), false);
});

test('transcript scroll follows near the bottom and preserves manual history reading', () => {
  const follows = plugin.chat.shouldStickToBottom;
  assert.equal(follows(1000, 930, 50, 48), true);
  assert.equal(follows(1000, 800, 50, 48), false);
  assert.equal(follows(1000, 900, 50), false);
});

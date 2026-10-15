import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';
import {positionAt, DURATION_MS} from '../public/timeline.js';
test('duration is twelve seconds and position remains bounded', () => {
  assert.equal(DURATION_MS, 12000);
  assert.equal(positionAt(100, 100), 0);
  assert.equal(positionAt(100, 6100), 0.5);
  assert.equal(positionAt(100, 12100), 1);
  assert.equal(positionAt(100, 13000), 1);
  assert.equal(positionAt(100, 0), 0);
});
test('actual monitor controller waits for START, finishes once and stays stopped', () => {
  let click, time = 500, frames = [];
  const button = {disabled: false, addEventListener: (_, callback) => {click = callback;}};
  const rail = {value: '', style: {setProperty: (_, value) => {rail.value = value;}}};
  const status = {textContent: 'Ready'};
  const context = vm.createContext({positionAt, performance: {now: () => time},
    document: {querySelector: selector => ({'#start': button, '#rail': rail, '#status': status})[selector]},
    requestAnimationFrame: callback => {frames.push(callback);}});
  const code = fs.readFileSync(new URL('../public/monitor.js', import.meta.url), 'utf8').replace(/^import[^\n]+\n/, '');
  vm.runInContext(code, context);
  assert.equal(frames.length, 0);
  click(); assert.equal(status.textContent, 'Running'); assert.equal(button.disabled, true);
  click(); assert.equal(frames.length, 1);
  frames.shift()(time + 6000); assert.equal(rail.value, '50%'); assert.equal(frames.length, 1);
  frames.shift()(time + 12000); assert.equal(rail.value, '100%'); assert.equal(status.textContent, 'Finished');
  assert.equal(button.disabled, false); assert.equal(frames.length, 0);
  time += 20000; assert.equal(rail.value, '100%');
  click(); assert.equal(rail.value, '0%'); assert.equal(frames.length, 1);
});

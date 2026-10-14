#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { readProject, stageProject } from './project-files.mjs';

let stage; let child; let closed; let failure; let report;
const controller = new AbortController();
const interrupted = () => controller.abort(new Error('smoke cancelled'));
process.on('SIGINT', interrupted); process.on('SIGTERM', interrupted);
const signalChild = (signal) => {
  try { if (process.platform === 'win32') child.kill(signal); else process.kill(-child.pid, signal); }
  catch (error) { if (error.code !== 'ESRCH') throw error; }
};
try {
  const args = process.argv.slice(2);
  if (!args[0] || args[0].startsWith('--') || (args.length !== 1 && !(args.length === 3 && args[1] === '--timeout-ms'))) throw new Error('usage: node smoke.mjs <project> [--timeout-ms <100..60000>]');
  const timeout = args.length === 3 ? Number(args[2]) : 15000;
  if (!Number.isInteger(timeout) || timeout < 100 || timeout > 60000) throw new Error('timeout must be 100..60000 milliseconds');
  const { root, manifest } = readProject(args[0]);
  if (!manifest.audio.supportedModes.includes('none')) throw new Error('project does not declare None mode');
  stage = fs.mkdtempSync(path.join(os.tmpdir(), 'pnds-smoke-'));
  const copy = path.join(stage, 'project'); stageProject(root, copy);
  const listeners = [];
  try {
    for (let i = 0; i < 2; i++) {
      const server = net.createServer(); listeners.push(server);
      await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    }
    manifest.scoreServer.performerPort = listeners[0].address().port;
    manifest.scoreServer.monitorPort = listeners[1].address().port;
    fs.writeFileSync(path.join(copy, 'manifest.json'), JSON.stringify(manifest, null, 2));
  } finally { await Promise.all(listeners.map((server) => new Promise((resolve) => server.close(resolve)))); }
  const env = { ...process.env, PNDS_HOST_IP: '127.0.0.1' };
  for (const key of ['PNDS_OSC_TARGET', 'PNDS_AUDIO_OUTPUT_BUS', 'PNDS_AUDIO_OUTPUT_CHANNELS', 'PNDS_PERFORMER_URL', 'PNDS_NODE_ID', 'PNDS_HUB_URL', 'PNDS_HUB_TOKEN', 'PNDS_HUB_ROOM']) delete env[key];
  child = spawn(process.execPath, [path.join(copy, manifest.scoreServer.entry), '--audio-mode', 'none'], { cwd: path.join(copy, manifest.scoreServer.workingDirectory), env, detached: process.platform !== 'win32', stdio: 'ignore' });
  closed = new Promise((resolve) => { child.once('error', (error) => resolve({ error })); child.once('close', (code, signal) => resolve({ code, signal })); });
  let childClosed;
  closed.then((value) => { childClosed = value; });
  const start = Date.now(); let health;
  while (Date.now() - start < timeout) {
    controller.signal.throwIfAborted();
    if (childClosed) throw new Error(`server exited before ready (${childClosed.error?.message ?? childClosed.code ?? childClosed.signal})`);
    try {
      const response = await fetch(`http://127.0.0.1:${manifest.scoreServer.performerPort}/__pnds/health`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(500)]) });
      if (response.ok) health = await response.json();
    } catch { controller.signal.throwIfAborted(); }
    if (health?.status === 'error') throw new Error('health reports error');
    if (health?.status === 'ready') break;
    await delay(50, undefined, { signal: controller.signal });
  }
  if (health?.status !== 'ready') throw new Error('health ready timeout');
  if (health.projectId !== manifest.id || health.audioMode !== 'none' || health.audio?.status !== 'disabled' || health.audio.target !== null || health.audio.error !== null || health.scoreServer?.performerPort !== manifest.scoreServer.performerPort || health.scoreServer.monitorPort !== manifest.scoreServer.monitorPort || health.scoreServer.error !== null) throw new Error('health identity, mode, audio or scoreServer fields do not match None contract');
  report = { health, runtime: process.version, mode: 'none', processStopped: false };
} catch (error) { failure = error; }
finally {
  if (child?.pid) {
    try {
      signalChild('SIGTERM');
      const timeout = () => delay(1500).then(() => null);
      let result = await Promise.race([closed, timeout()]);
      if (!result) { signalChild('SIGKILL'); result = await Promise.race([closed, timeout()]); }
      if (!result) throw new Error('server termination could not be confirmed');
      if (report) report.processStopped = true;
    } catch (error) { failure ??= error; }
  }
  if (stage) fs.rmSync(stage, { recursive: true, force: true });
  process.off('SIGINT', interrupted); process.off('SIGTERM', interrupted);
}
if (failure) { console.error(`smoke: ${failure.message}`); process.exitCode = 1; }
else console.log(JSON.stringify(report, null, 2));

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { test } from 'node:test';
import crypto from 'node:crypto';

const repo = path.resolve(import.meta.dirname, '..');
const tool = (name) => path.join(repo, 'pnds-port', 'tools', name);
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pnds-skill-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const project = path.join(dir, 'source');
  fs.mkdirSync(project);
  const manifest = {
    schemaVersion: 1, id: 'test-score', name: 'Test Score', version: '0.1.0',
    scoreServer: { entry: 'custom/main.js', workingDirectory: '.', performerPort: 6868, monitorPort: 6869 },
    audio: { defaultMode: 'none', supportedModes: ['none'] },
  };
  write(project, 'manifest.json', JSON.stringify(manifest));
  write(project, 'custom/main.js', '// runtime');
  return { dir, project, manifest };
}
function write(dir, name, content) {
  fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
  fs.writeFileSync(path.join(dir, name), content);
}
function run(name, args, env) {
  return spawnSync(process.execPath, [tool(name), ...args], { encoding: 'utf8', env: env ?? process.env });
}

test('distribution preserves arbitrary runtime assets and excludes only contract paths', (t) => {
  const { dir, project } = fixture(t);
  write(project, 'modules/qr/index.js', '// module');
  write(project, 'supercollider/source/synth.scd', 'SynthDef');
  write(project, 'sources/original.txt', 'source material');
  write(project, 'docs/creator-handoff.md', 'private author task');
  write(project, 'tests/test.js', 'test');
  write(project, 'public/docs/readme.txt', 'runtime nested docs');
  write(project, 'public/.gitkeep', 'exclude');
  const result = run('pack.mjs', [project, '--out', dir]);
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  const names = execFileSync('unzip', ['-Z1', report.pndsFile], { encoding: 'utf8' });
  assert.match(names, /Test Score\/modules\/qr\/index.js/);
  assert.match(names, /Test Score\/custom\/main.js/);
  assert.match(names, /Test Score\/supercollider\/source\/synth.scd/);
  assert.match(names, /Test Score\/sources\/original.txt/);
  assert.match(names, /Test Score\/public\/docs\/readme.txt/);
  assert.doesNotMatch(names, /creator-handoff|\/tests\/|\.gitkeep/);
  assert.equal(report.sha256, crypto.createHash('sha256').update(fs.readFileSync(report.pndsFile)).digest('hex'));
  assert.equal(report.runtimeVerified, false);
});

test('missing dependencies or declared SynthDefs block packaging without staging debris', (t) => {
  const { dir, project, manifest } = fixture(t);
  const temp = path.join(dir, 'temp'); fs.mkdirSync(temp);
  const env = { ...process.env, TMPDIR: temp };
  write(project, 'package.json', JSON.stringify({ optionalDependencies: { optional: '1.0.0' } }));
  const dependencyFailure = run('pack.mjs', [project, '--out', dir], env);
  assert.equal(dependencyFailure.status, 1);
  assert.match(dependencyFailure.stderr, /node_modules/);
  write(project, 'package.json', '{}');
  manifest.audio.synthdefs = ['missing.scsyndef'];
  write(project, 'manifest.json', JSON.stringify(manifest));
  const assetFailure = run('pack.mjs', [project, '--out', dir], env);
  assert.equal(assetFailure.status, 1);
  assert.match(assetFailure.stderr, /synthdefs/);
  assert.deepEqual(fs.readdirSync(temp), []);
  assert.equal(fs.existsSync(path.join(dir, 'Test Score-0.1.0.pnds')), false);
});

test('bundling materializes in-project links with permissions and skips external links', (t) => {
  const { dir, project } = fixture(t);
  write(project, 'assets/run.sh', '#!/bin/sh\n'); fs.chmodSync(path.join(project, 'assets/run.sh'), 0o755);
  fs.symlinkSync('assets/run.sh', path.join(project, 'linked.sh'));
  write(dir, 'secret.txt', 'outside'); fs.symlinkSync('../secret.txt', path.join(project, 'external.txt'));
  const result = run('pack.mjs', [project, '--out', dir]);
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  const unpack = path.join(dir, 'unpack');
  execFileSync('unzip', ['-q', report.pndsFile, '-d', unpack]);
  assert.equal(fs.lstatSync(path.join(unpack, 'Test Score/linked.sh')).isSymbolicLink(), false);
  assert.equal(fs.statSync(path.join(unpack, 'Test Score/linked.sh')).mode & 0o777, 0o755);
  assert.equal(fs.existsSync(path.join(unpack, 'Test Score/external.txt')), false);
});

test('packaging rejects escaping paths and protected output and leaves the source unchanged', (t) => {
  const { dir, project, manifest } = fixture(t);
  const before = fs.readFileSync(path.join(project, 'manifest.json'), 'utf8');
  const inside = run('pack.mjs', [project, '--out', path.join(project, 'output')]);
  assert.equal(inside.status, 1); assert.match(inside.stderr, /outside/);
  assert.equal(fs.readFileSync(path.join(project, 'manifest.json'), 'utf8'), before);
  write(dir, 'outside.js', 'outside'); manifest.scoreServer.entry = '../outside.js';
  write(project, 'manifest.json', JSON.stringify(manifest));
  const escaping = run('pack.mjs', [project, '--out', dir]);
  assert.equal(escaping.status, 1); assert.match(escaping.stderr, /relative path/);
});

test('an explicit overwrite replaces the whole archive without stale entries', (t) => {
  const { dir, project } = fixture(t);
  write(project, 'obsolete.txt', 'old');
  const first = run('pack.mjs', [project, '--out', dir]); assert.equal(first.status, 0, first.stderr);
  fs.rmSync(path.join(project, 'obsolete.txt'));
  const denied = run('pack.mjs', [project, '--out', dir]); assert.equal(denied.status, 1); assert.match(denied.stderr, /already exists/);
  const replacement = run('pack.mjs', [project, '--out', dir, '--overwrite']); assert.equal(replacement.status, 0, replacement.stderr);
  const names = execFileSync('unzip', ['-Z1', JSON.parse(replacement.stdout).pndsFile], { encoding: 'utf8' });
  assert.doesNotMatch(names, /obsolete/);
});

test('TouchOSC parser reports nested controls and rejects non-TouchOSC material', (t) => {
  const { dir } = fixture(t);
  write(dir, 'not-tosc.tosc', 'not an XML layout');
  const invalid = run('tosc-parser.mjs', [path.join(dir, 'not-tosc.tosc')]);
  assert.equal(invalid.status, 1); assert.match(invalid.stderr, /TouchOSC|XML|node/);
  write(dir, 'layout.tosc', `<node type="GROUP" ID="root"><properties><property type="s"><key><![CDATA[name]]></key><value><![CDATA[group]]></value></property></properties><node type="FADER" ID="fader"><properties><property type="s"><key><![CDATA[name]]></key><value><![CDATA[gain]]></value></property><property type="i"><key><![CDATA[steps]]></key><value>12</value></property></properties><messages><osc><enabled>1</enabled><path><partial><type>CONSTANT</type><conversion>STRING</conversion><value><![CDATA[/]]></value></partial><partial><type>PROPERTY</type><conversion>STRING</conversion><value><![CDATA[parent.name]]></value></partial><partial><type>CONSTANT</type><conversion>STRING</conversion><value><![CDATA[/]]></value></partial><partial><type>PROPERTY</type><conversion>STRING</conversion><value><![CDATA[name]]></value></partial></path><arguments><partial><type>VALUE</type><conversion>FLOAT</conversion><value><![CDATA[x]]></value><scaleMin>0</scaleMin><scaleMax>1</scaleMax></partial></arguments></osc></messages></node></node>`);
  const parsed = run('tosc-parser.mjs', [path.join(dir, 'layout.tosc')]); assert.equal(parsed.status, 0, parsed.stderr);
  const control = JSON.parse(parsed.stdout).controls[0].children[0];
  assert.equal(control.type, 'FADER'); assert.equal(control.steps, 12);
  assert.equal(control.osc.pathResolved, '/group/gain');
  assert.deepEqual(control.osc.args, [{ type: 'VALUE', conversion: 'FLOAT', variable: 'x', scaleMin: 0, scaleMax: 1 }]);
});

test('platform lookup reads the supplied App corpus and refuses incomplete evidence', (t) => {
  const { dir } = fixture(t); const app = path.join(dir, 'Custom App.app');
  write(app, 'Contents/Info.plist', '<plist><dict><key>CFBundleShortVersionString</key><string>1.6.1</string></dict></plist>');
  for (const name of ['README', 'manifest', 'structure', 'runtime-contract', 'audio-modes', 'network', 'page-interaction', 'pnds-bundle']) write(app, `Contents/Resources/help/en/reference/${name}.md`, `# ${name}\n`);
  const result = run('platform-info.mjs', ['--app', app, '--locale', 'en']);
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout); assert.equal(report.appVersion, '1.6.1');
  assert.equal(report.source, 'installed-app'); assert.equal(report.referenceFiles.length, 8);
  fs.rmSync(path.join(app, 'Contents/Resources/help/en/reference/manifest.md'));
  const missing = run('platform-info.mjs', ['--app', app]); assert.equal(missing.status, 1);
  assert.match(missing.stderr, /manifest.md/);
});

function smokeServer(project, healthOverride = '') {
  write(project, 'custom/main.js', `const http=require('node:http'); const fs=require('node:fs'); const m=JSON.parse(fs.readFileSync('manifest.json')); const p=m.scoreServer.performerPort, q=m.scoreServer.monitorPort;
const health={status:'ready',projectId:m.id,audioMode:'none',audio:{status:'disabled',target:null,error:null},scoreServer:{performerPort:p,monitorPort:q,error:null}${healthOverride}};
const servers=[p,q].map(port=>http.createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(health));}).listen(port,'127.0.0.1'));
process.on('SIGTERM',()=>{for(const server of servers)server.close();});`);
}

test('explicit None smoke checks real health on a copy and stops the server', (t) => {
  const { dir, project } = fixture(t); smokeServer(project);
  const before = fs.readFileSync(path.join(project, 'manifest.json'), 'utf8');
  const temp = path.join(dir, 'temp'); fs.mkdirSync(temp);
  const result = run('smoke.mjs', [project, '--timeout-ms', '3000'], { ...process.env, TMPDIR: temp });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout); assert.equal(report.health.audio.status, 'disabled'); assert.equal(report.processStopped, true);
  assert.equal(fs.readFileSync(path.join(project, 'manifest.json'), 'utf8'), before);
  assert.deepEqual(fs.readdirSync(temp), []);
});

test('smoke rejects mismatched health and cleans up the copied runtime', (t) => {
  const { dir, project } = fixture(t); smokeServer(project, ",projectId:'wrong'");
  const temp = path.join(dir, 'temp'); fs.mkdirSync(temp);
  const result = run('smoke.mjs', [project, '--timeout-ms', '2000'], { ...process.env, TMPDIR: temp });
  assert.equal(result.status, 1); assert.match(result.stderr, /health|projectId/);
  assert.deepEqual(fs.readdirSync(temp), []);
});

test('TouchOSC compressed layouts retain the same observable control inventory', async (t) => {
  const { dir } = fixture(t); const { gzipSync, deflateSync } = await import('node:zlib');
  const xml = `<node type='GROUP' ID='g'><properties><property type='s'><key><![CDATA[name]]></key><value><![CDATA[Score]]></value></property></properties></node>`;
  for (const [name, bytes] of [['gzip', gzipSync(xml)], ['zlib', deflateSync(xml)]]) {
    write(dir, `${name}.tosc`, bytes);
    const result = run('tosc-parser.mjs', [path.join(dir, `${name}.tosc`)]);
    assert.equal(result.status, 0, result.stderr); assert.equal(JSON.parse(result.stdout).controls[0].name, 'Score');
  }
  write(dir, 'broken.tosc', `<node type='GROUP'></node></node>`);
  const broken = run('tosc-parser.mjs', [path.join(dir, 'broken.tosc')]); assert.equal(broken.status, 1); assert.match(broken.stderr, /closing/);
});

test('a single copied Skill directory supplies tools and references with no sibling checkout', (t) => {
  const { dir, project } = fixture(t);
  const standalone = path.join(dir, 'standalone');
  fs.cpSync(path.join(repo, 'pnds-validate'), standalone, { recursive: true });
  const manifest = JSON.parse(fs.readFileSync(path.join(standalone, 'resource-manifest.json'), 'utf8'));
  for (const [file, expected] of Object.entries(manifest.files)) {
    const bytes = fs.readFileSync(path.join(standalone, file));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), expected, file);
  }
  const result = spawnSync(process.execPath, [path.join(standalone, 'tools/pack.mjs'), project, '--out', dir], { encoding: 'utf8', cwd: dir });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).runtimeVerified, false);
});

test('display names starting with a dash remain archive paths rather than zip options', (t) => {
  const { dir, project, manifest } = fixture(t); manifest.name = '-Score';
  write(project, 'manifest.json', JSON.stringify(manifest));
  const result = run('pack.mjs', [project, '--out', dir]); assert.equal(result.status, 0, result.stderr);
  const names = execFileSync('unzip', ['-Z1', JSON.parse(result.stdout).pndsFile], { encoding: 'utf8' });
  assert.match(names, /-Score\/manifest.json/);
});

test('packaging preserves a destination created while zip is running unless overwrite was authorized', (t) => {
  const { dir, project } = fixture(t);
  const fakeBin = path.join(dir, 'bin');
  const temp = path.join(dir, 'temp'); fs.mkdirSync(temp);
  const destination = path.join(dir, 'Test Score-0.1.0.pnds');
  write(fakeBin, 'zip', `#!/usr/bin/env node
const fs = require('node:fs');
fs.writeFileSync(process.env.PNDS_TEST_CONCURRENT_OUTPUT, 'concurrent output');
fs.writeFileSync(process.argv.slice(2)[3], 'new archive');
`);
  fs.chmodSync(path.join(fakeBin, 'zip'), 0o755);
  const env = { ...process.env, PATH: `${fakeBin}${path.delimiter}${process.env.PATH}`, TMPDIR: temp, PNDS_TEST_CONCURRENT_OUTPUT: destination };
  const denied = run('pack.mjs', [project, '--out', dir], env);
  assert.equal(denied.status, 1, denied.stdout);
  assert.match(denied.stderr, /exists|EEXIST/);
  assert.equal(fs.readFileSync(destination, 'utf8'), 'concurrent output');
  assert.deepEqual(fs.readdirSync(temp), []);
  assert.deepEqual(fs.readdirSync(dir).filter((name) => name.startsWith('.pnds-')), []);
  const allowed = run('pack.mjs', [project, '--out', dir, '--overwrite'], env);
  assert.equal(allowed.status, 0, allowed.stderr);
  assert.equal(fs.readFileSync(destination, 'utf8'), 'new archive');
  assert.deepEqual(fs.readdirSync(temp), []);
  assert.deepEqual(fs.readdirSync(dir).filter((name) => name.startsWith('.pnds-')), []);
});

test('packaging rejects performer addresses that the Host manifest contract rejects', (t) => {
  const { dir, project, manifest } = fixture(t);
  const invalid = ['-bad.local', 'bad-.local', 'ok..local', `${'a'.repeat(64)}.local`, [63, 63, 63, 62].map((length) => 'a'.repeat(length)).join('.'), [], true];
  for (const performerAddress of invalid) {
    manifest.performerAddress = performerAddress; write(project, 'manifest.json', JSON.stringify(manifest));
    const result = run('pack.mjs', [project, '--out', dir]);
    assert.equal(result.status, 1, `accepted ${JSON.stringify(performerAddress)}: ${result.stdout}`);
    assert.match(result.stderr, /performerAddress/);
    assert.equal(fs.existsSync(path.join(dir, 'Test Score-0.1.0.pnds')), false);
  }
});

test('packaging accepts Host-compatible address limits, IPv4 and undeclared values', (t) => {
  const { dir, project, manifest } = fixture(t);
  const valid = [null, '', '  ', '127.0.0.1', ' work-stage.local ', [63, 63, 63, 61].map((length) => 'a'.repeat(length)).join('.')];
  for (const performerAddress of valid) {
    manifest.performerAddress = performerAddress; write(project, 'manifest.json', JSON.stringify(manifest));
    const result = run('pack.mjs', [project, '--out', dir, '--overwrite']);
    assert.equal(result.status, 0, `rejected ${JSON.stringify(performerAddress)}: ${result.stderr}`);
  }
});

test('packaging rejects malformed present optional manifest fields even in None mode', (t) => {
  const { dir, project, manifest } = fixture(t);
  const invalid = [
    { ...manifest, description: 42 },
    { ...manifest, audio: { ...manifest.audio, standaloneTarget: 42 } },
    { ...manifest, audio: { ...manifest.audio, outputChannels: null } },
    { ...manifest, audio: { ...manifest.audio, scsynth: { blockSize: 'x', audioBusChannels: 2 } } },
    { ...manifest, audio: { ...manifest.audio, scsynth: { audioBusChannels: 2 } } },
    { ...manifest, audio: { ...manifest.audio, scsynth: { blockSize: 1, audioBusChannels: 4294967296 } } },
    { ...manifest, audio: { ...manifest.audio, scsynth: { blockSize: -1, audioBusChannels: 2 } } },
    { ...manifest, audio: { ...manifest.audio, scsynth: { blockSize: 1.5, audioBusChannels: 2 } } },
    { ...manifest, audio: { ...manifest.audio, scsynth: { blockSize: 1, audioBusChannels: 2, sampleRate: null } } },
    { ...manifest, audio: { ...manifest.audio, scsynth: { blockSize: 1, audioBusChannels: 2, sampleRate: 4294967296 } } },
    { ...manifest, audio: { ...manifest.audio, scsynth: [] } },
  ];
  for (const value of invalid) {
    write(project, 'manifest.json', JSON.stringify(value));
    const result = run('pack.mjs', [project, '--out', dir]);
    assert.equal(result.status, 1, `accepted ${JSON.stringify(value)}: ${result.stdout}`);
    assert.match(result.stderr, /description|standaloneTarget|outputChannels|scsynth/);
    assert.equal(fs.existsSync(path.join(dir, 'Test Score-0.1.0.pnds')), false);
  }
});

test('packaging preserves current nullable optional strings and lenient capability declarations', (t) => {
  const { dir, project, manifest } = fixture(t);
  const valid = [
    { ...manifest, description: null, telematic: 'not a boolean', scoreServer: { ...manifest.scoreServer, supportsPerformerUrl: 42, needsHttps: [] }, audio: { ...manifest.audio, standaloneTarget: null, synthdefs: null, scsynth: null } },
    { ...manifest, description: 'A score', audio: { ...manifest.audio, standaloneTarget: '127.0.0.1:57110', scsynth: { blockSize: 0, audioBusChannels: 0 } } },
    { ...manifest, audio: { ...manifest.audio, scsynth: { blockSize: 4294967295, audioBusChannels: 4294967295, sampleRate: 4294967295 } } },
  ];
  for (const value of valid) {
    write(project, 'manifest.json', JSON.stringify(value));
    const result = run('pack.mjs', [project, '--out', dir, '--overwrite']);
    assert.equal(result.status, 0, `rejected ${JSON.stringify(value)}: ${result.stderr}`);
  }
});

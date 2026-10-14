#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { contains, readProject, stageProject } from './project-files.mjs';

// Static packaging only. Never installs, compiles or starts the project.
let stage;
let temporaryOutput;
try {
  const args = process.argv.slice(2);
  if (!args[0] || args[0].startsWith('--')) throw new Error('usage: node pack.mjs <project> [--out <directory>] [--overwrite]');
  let outputDirectory;
  let overwrite = false;
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--out' && args[i + 1] && !args[i + 1].startsWith('--')) outputDirectory = args[++i];
    else if (args[i] === '--overwrite') overwrite = true;
    else throw new Error(`unknown or incomplete option: ${args[i]}`);
  }
  const { root, manifest } = readProject(args[0]);
  const clean = (value) => value.replace(/[/\\:*?"<>|\x00-\x1f]/g, '-');
  const rootName = clean(manifest.name);
  if (!rootName.trim() || rootName === '.' || rootName === '..' || rootName === 'pnds-bundle.json') throw new Error('unsafe bundle root name');
  const outDir = path.resolve(outputDirectory ?? path.dirname(root));
  // Resolve through the nearest existing parent before creating directories.
  let ancestor = outDir;
  while (!fs.existsSync(ancestor)) ancestor = path.dirname(ancestor);
  if (contains(root, fs.realpathSync(ancestor))) throw new Error('output must be outside the source project');
  fs.mkdirSync(outDir, { recursive: true });
  const actualOut = fs.realpathSync(outDir);
  if (contains(root, actualOut)) throw new Error('output must be outside the source project');
  const pndsFile = path.join(actualOut, `${rootName}-${clean(manifest.version)}.pnds`);
  if (fs.existsSync(pndsFile) || fs.lstatSync(pndsFile, { throwIfNoEntry: false })) {
    if (fs.lstatSync(pndsFile).isSymbolicLink()) throw new Error('output must not be a symlink');
    if (!overwrite) throw new Error('output already exists; choose another directory or confirm --overwrite');
  }
  stage = fs.mkdtempSync(path.join(os.tmpdir(), 'pnds-pack-'));
  const bundleRoot = path.join(stage, rootName);
  stageProject(root, bundleRoot);
  readProject(bundleRoot); // Excluded/missing declared assets must fail too.
  fs.writeFileSync(path.join(stage, 'pnds-bundle.json'), JSON.stringify({
    formatVersion: 1, packedWith: 'pnds-agent-skills 0.2.0', packedAt: new Date().toISOString(), sourcePlatform: `${process.platform}-${process.arch}`,
  }, null, 2) + '\n');
  temporaryOutput = path.join(actualOut, `.pnds-${crypto.randomUUID()}.zip`);
  execFileSync('zip', ['-q', '-r', '-X', temporaryOutput, '--', rootName, 'pnds-bundle.json'], { cwd: stage, stdio: ['ignore', 'ignore', 'pipe'] });
  const sha256 = crypto.createHash('sha256').update(fs.readFileSync(temporaryOutput)).digest('hex');
  if (overwrite) {
    if (fs.lstatSync(pndsFile, { throwIfNoEntry: false })?.isSymbolicLink()) throw new Error('output must not be a symlink');
    fs.renameSync(temporaryOutput, pndsFile);
  } else {
    // Atomic no-clobber publication: another writer can create the destination
    // while zip runs; link fails with EEXIST without replacing that file.
    fs.linkSync(temporaryOutput, pndsFile);
    fs.rmSync(temporaryOutput);
  }
  temporaryOutput = undefined;
  console.log(JSON.stringify({ pndsFile, sha256, rootDir: rootName, runtimeVerified: false }, null, 2));
} catch (error) {
  console.error(`pack: ${error.message}`);
  process.exitCode = 1;
} finally {
  if (temporaryOutput) fs.rmSync(temporaryOutput, { force: true });
  if (stage) fs.rmSync(stage, { recursive: true, force: true });
}

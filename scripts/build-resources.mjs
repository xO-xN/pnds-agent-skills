import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const root = path.resolve(import.meta.dirname, '..');
export const skills = ['pnds-create', 'pnds-investigate', 'pnds-assess', 'pnds-runtime', 'pnds-modules', 'pnds-validate', 'pnds-port', 'pnds-cm1'];
export function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(path.join(directory, entry.name)).map((file) => `${entry.name}/${file}`) : [entry.name]).sort();
}
const digest = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const check = process.argv.includes('--check');
for (const skill of skills) {
  const destination = path.join(root, skill);
  for (const file of files(path.join(root, 'resources'))) {
    const source = fs.readFileSync(path.join(root, 'resources', file));
    const target = path.join(destination, file);
    if (check) {
      if (!fs.existsSync(target) || !source.equals(fs.readFileSync(target))) throw new Error(`bundled resource is stale: ${skill}/${file}; run npm run build`);
    } else { fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, source); }
  }
  const resources = Object.fromEntries(files(destination).filter((file) => file !== 'resource-manifest.json').map((file) => [file, digest(fs.readFileSync(path.join(destination, file)))]));
  const manifest = Buffer.from(JSON.stringify({ formatVersion: 1, skill, workflowVersion: '0.2.0', hostProtocol: 1, dependencies: { node: '>=24 <25', pack: ['zip'], archiveInspection: ['unzip'], internalCompilation: ['sclang when needed'], platformManual: 'installed App corpus or explicitly matched versioned source' }, files: resources }, null, 2) + '\n');
  const target = path.join(destination, 'resource-manifest.json');
  if (check) {
    if (!fs.existsSync(target) || !manifest.equals(fs.readFileSync(target))) throw new Error(`resource manifest is stale: ${skill}; run npm run build`);
  } else fs.writeFileSync(target, manifest);
}
console.log(`${skills.length} self-contained Skill resources ${check ? 'verified' : 'built'}`);

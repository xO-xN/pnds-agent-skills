import fs from 'node:fs';
import path from 'node:path';

export function contains(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}
export function readProject(input) {
  const root = fs.realpathSync(input);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  const segment = (value) => typeof value === 'string' && value.trim() && !/[\\/]/.test(value) && !value.includes('..');
  if (manifest.schemaVersion !== 1) throw new Error('unsupported manifest schemaVersion');
  if (!segment(manifest.id) || !segment(manifest.version) || typeof manifest.name !== 'string' || !manifest.name.trim()) {
    throw new Error('manifest requires name and safe id/version path segments');
  }
  const server = manifest.scoreServer;
  if (!server || ![server.performerPort, server.monitorPort].every((v) => Number.isInteger(v) && v >= 1 && v <= 65535) || server.performerPort === server.monitorPort) {
    throw new Error('scoreServer requires two distinct valid ports');
  }
  const modes = manifest.audio?.supportedModes;
  if (!Array.isArray(modes) || !modes.length || modes.some((m) => !['internal', 'external', 'none'].includes(m)) || !modes.includes(manifest.audio.defaultMode)) {
    throw new Error('audio modes are missing or invalid');
  }
  for (const [value, field] of [[manifest.description, 'description'], [manifest.audio.standaloneTarget, 'audio.standaloneTarget']]) {
    if (value != null && typeof value !== 'string') throw new Error(`${field} must be a string or null`);
  }
  const scsynth = manifest.audio.scsynth;
  if (scsynth != null) {
    const fields = ['blockSize', 'audioBusChannels'];
    if (Object.hasOwn(scsynth, 'sampleRate')) fields.push('sampleRate');
    for (const field of fields) {
      const value = scsynth[field];
      if (!Number.isInteger(value) || value < 0 || value > 4294967295) throw new Error(`audio.scsynth.${field} must be a u32 integer`);
    }
  }
  const channels = Object.hasOwn(manifest.audio, 'outputChannels') ? manifest.audio.outputChannels : 2;
  if (!Number.isInteger(channels) || channels < 1 || channels > 64) throw new Error('outputChannels must be 1..64');
  const checkPath = (value, field, directory = false) => {
    if (typeof value !== 'string' || !value || path.isAbsolute(value) || value.includes('\\') || value.split('/').includes('..')) throw new Error(`${field} must be an in-project relative path`);
    const target = path.resolve(root, value);
    if (!fs.existsSync(target) || !contains(root, fs.realpathSync(target))) throw new Error(`${field} missing or outside project: ${value}`);
    const stat = fs.statSync(target);
    if (directory ? !stat.isDirectory() : !stat.isFile()) throw new Error(`${field} has wrong file type: ${value}`);
  };
  checkPath(server.entry, 'scoreServer.entry');
  checkPath(server.workingDirectory, 'scoreServer.workingDirectory', true);
  const defs = manifest.audio.synthdefs ?? [];
  if (!Array.isArray(defs)) throw new Error('audio.synthdefs must be a path array');
  for (const def of defs) checkPath(def, 'audio.synthdefs');
  if (modes.includes('internal')) {
    const sc = manifest.audio.scsynth;
    if (!defs.length || !Number.isInteger(sc?.blockSize) || sc.blockSize < 1 || !Number.isInteger(sc.audioBusChannels) || sc.audioBusChannels < 2 * channels) throw new Error('internal audio requires SynthDefs, blockSize and enough audio buses');
  }
  if (manifest.performerAddress != null) {
    if (typeof manifest.performerAddress !== 'string') throw new Error('performerAddress must be a string');
    const host = manifest.performerAddress.trim();
    if (host && (host.length > 253 || host.split('.').some((label) => !label || label.length > 63 || !/^[a-zA-Z0-9-]+$/.test(label) || label.startsWith('-') || label.endsWith('-')))) {
      throw new Error('performerAddress must be a bare hostname of at most 253 characters, with 1..63-character labels that do not start or end with a hyphen');
    }
  }
  if (fs.existsSync(path.join(root, 'package.json'))) {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    const deps = Object.keys(pkg.dependencies ?? {});
    const optional = Object.keys(pkg.optionalDependencies ?? {});
    if (deps.length || optional.length) {
      checkPath('node_modules', 'production node_modules', true);
      for (const dep of deps.filter((name) => !optional.includes(name))) checkPath(`node_modules/${dep}`, `dependency ${dep}`, true);
    }
  }
  return { root, manifest };
}

export function stageProject(root, destination) {
  const copy = (source, target, relative, ancestors = []) => {
    const name = path.basename(source);
    if (name === '.DS_Store' || name.startsWith('.git')) return;
    const real = fs.realpathSync(source);
    if (!contains(root, real)) return;
    const stat = fs.statSync(real);
    if (stat.isDirectory()) {
      if (['docs', 'test', 'tests'].includes(relative)) return;
      if (ancestors.includes(real)) throw new Error(`cyclic directory symlink: ${relative}`);
      fs.mkdirSync(target, { recursive: true, mode: stat.mode & 0o777 });
      for (const entry of fs.readdirSync(source)) copy(path.join(source, entry), path.join(target, entry), relative ? `${relative}/${entry}` : entry, [...ancestors, real]);
      fs.chmodSync(target, stat.mode & 0o777);
    } else if (stat.isFile()) {
      fs.copyFileSync(source, target);
      fs.chmodSync(target, stat.mode & 0o777);
    } else throw new Error(`unsupported asset type: ${relative}`);
  };
  copy(root, destination, '');
}

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
execFileSync(process.execPath, [path.join(root, 'scripts/build-resources.mjs'), '--check'], { stdio: 'inherit' });
const skills = fs.readdirSync(root).filter((name) => fs.existsSync(path.join(root, name, 'SKILL.md')));
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
for (const skill of skills) {
  const directory = path.join(root, skill);
  const entry = fs.readFileSync(path.join(directory, 'SKILL.md'), 'utf8');
  if (!entry.startsWith(`---\nname: ${skill}\ndescription: `) || !entry.includes('\n---\n')) throw new Error(`invalid Skill frontmatter: ${skill}`);
  for (const file of walk(directory)) {
    if (file.endsWith('.mjs')) execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
    if (!file.endsWith('.md')) continue;
    const markdown = fs.readFileSync(file, 'utf8');
    if (/\/Users\//.test(markdown)) throw new Error(`maintainer-specific path in ${file}`);
    for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1].split('#')[0];
      if (!target || /^[a-z]+:/i.test(target)) continue;
      const resolved = path.resolve(path.dirname(file), target);
      const relative = path.relative(directory, resolved);
      if (relative.startsWith('..') || path.isAbsolute(relative) || !fs.existsSync(resolved)) throw new Error(`missing or outside bundled link in ${file}: ${target}`);
    }
  }
}
console.log(`${skills.length} Skill entrypoints, local links and tool syntax checked`);

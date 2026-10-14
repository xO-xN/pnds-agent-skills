#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

try {
  const args = process.argv.slice(2);
  let app; let locale = 'en';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--app' && args[i + 1]) app = args[++i];
    else if (args[i] === '--locale' && args[i + 1]) locale = args[++i];
    else throw new Error(`unknown or incomplete option: ${args[i]}`);
  }
  if (!app || !['en', 'zh-CN'].includes(locale)) throw new Error('usage: node platform-info.mjs --app <PNDS.app> [--locale en|zh-CN]');
  const appRoot = fs.realpathSync(app);
  const plist = path.join(appRoot, 'Contents/Info.plist');
  let content = fs.readFileSync(plist, 'utf8');
  if (!content.includes('<plist')) content = execFileSync('plutil', ['-convert', 'xml1', '-o', '-', plist], { encoding: 'utf8' });
  const appVersion = content.match(/<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/)?.[1];
  if (!appVersion) throw new Error(`installed App version missing: ${plist}`);
  const corpus = path.join(appRoot, 'Contents/Resources/help', locale);
  const referenceFiles = ['README', 'manifest', 'structure', 'runtime-contract', 'audio-modes', 'network', 'page-interaction', 'pnds-bundle'].map((name) => path.join(corpus, 'reference', `${name}.md`));
  const missing = referenceFiles.filter((file) => !fs.existsSync(file) || !fs.statSync(file).isFile());
  if (missing.length) throw new Error(`installed corpus incomplete: ${missing.join(', ')}`);
  console.log(JSON.stringify({ source: 'installed-app', appVersion, locale, corpus, referenceFiles }, null, 2));
} catch (error) {
  console.error(`platform-info: ${error.message}`);
  process.exitCode = 1;
}

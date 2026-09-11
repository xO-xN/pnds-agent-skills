#!/usr/bin/env node
// pack.mjs — assemble a .pnds bundle from a PNDS score project directory.
//
// Usage: node pack.mjs <project-dir> [--out <output-dir>]
//
// Mirrors the PNDS Template release CI (allowlist staging, dependency
// verification, --audio-mode none smoke boot against /__pnds/health, then
// `zip -X` with a single project root + top-level pnds-bundle.json).
// Produces <name>-<version>.pnds in --out (default: the project's parent
// directory) and prints its path + sha256.
//
// This tool is used at creation time only (the making agent runs it once).
// Generated projects do NOT carry a packaging script — repackaging later can
// use the App's Settings → Developer Tools → 打包工程, or this tool again.
// The working project directory is never mutated: staging happens in a
// temp dir; npm operations (prune/ci) run inside the staging copy only.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import net from "node:net";
import crypto from "node:crypto";
import { execFileSync, spawn } from "node:child_process";

const args = process.argv.slice(2);
const projectDir = path.resolve(args[0] ?? "");
const outIdx = args.indexOf("--out");
const outDir = outIdx !== -1 ? path.resolve(args[outIdx + 1]) : path.dirname(projectDir);

if (!projectDir || !fs.existsSync(path.join(projectDir, "manifest.json"))) {
  console.error("usage: node pack.mjs <project-dir> [--out <output-dir>]");
  console.error("       <project-dir> must contain manifest.json");
  process.exit(2);
}

const manifest = JSON.parse(fs.readFileSync(path.join(projectDir, "manifest.json"), "utf8"));
const { id, name, version } = manifest;
if (!id || !name || !version) throw new Error("manifest.json is missing id / name / version");

const ALLOWED = [
  "manifest.json",
  "package.json",
  "server.js",
  "README.md",
  "LICENSE",
  "lib",
  "audio",
  "public",
  "node_modules",
  path.join("supercollider", "synthdefs"),
];
const FORBIDDEN = [
  "docs",
  "test",
  "tests",
  ".github",
  ".git",
  "sources",
  path.join("supercollider", "source"),
  path.join("supercollider", "debug"),
  ".gitignore",
  "package-lock.json",
  ".DS_Store",
];

const clean = (s) => s.replace(/[/\\:*?"<>|]/g, "-");
const run = (cmd, cmdArgs, cwd) =>
  execFileSync(cmd, cmdArgs, { cwd, stdio: ["ignore", "ignore", "inherit"] });

// --- stage ------------------------------------------------------------------
const stage = fs.mkdtempSync(path.join(os.tmpdir(), "pnds-pack-"));
const dist = path.join(stage, "dist");
const bundleRoot = path.join(dist, clean(name));
fs.mkdirSync(bundleRoot, { recursive: true });
for (const entry of ALLOWED) {
  const src = path.join(projectDir, entry);
  if (!fs.existsSync(src)) continue;
  fs.cpSync(src, path.join(bundleRoot, entry), { recursive: true, verbatimSymlinks: false });
}
// strip junk anywhere in the staging tree
const strip = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) strip(p);
    if (e.name === ".DS_Store" || e.name.startsWith(".lh")) fs.rmSync(p, { recursive: true, force: true });
  }
};
strip(bundleRoot);

// --- dependencies -----------------------------------------------------------
const pkgPath = path.join(bundleRoot, "package.json");
const prodDeps = fs.existsSync(pkgPath)
  ? Object.keys(JSON.parse(fs.readFileSync(pkgPath, "utf8")).dependencies ?? {})
  : [];
if (prodDeps.length > 0) {
  if (fs.existsSync(path.join(bundleRoot, "node_modules"))) {
    run("npm", ["prune", "--omit=dev"], bundleRoot);
  } else {
    run("npm", ["ci", "--omit=dev"], bundleRoot);
  }
  const missing = prodDeps.filter((d) => !fs.existsSync(path.join(bundleRoot, "node_modules", d)));
  if (missing.length) throw new Error(`missing from bundle: ${missing.join(", ")}`);
  // npm prune/ci (re)writes the lockfile in staging; the bundle must not ship it
  fs.rmSync(path.join(bundleRoot, "package-lock.json"), { force: true });
}
for (const f of FORBIDDEN) {
  if (fs.existsSync(path.join(bundleRoot, f)))
    throw new Error(`${f} must not be in the performance bundle`);
}
const synthdefs = manifest.audio?.synthdefs ?? [];
for (const sd of synthdefs) {
  if (!fs.existsSync(path.join(bundleRoot, sd)))
    throw new Error(`manifest synthdef missing from bundle: ${sd}`);
}

// --- smoke boot (--audio-mode none) ------------------------------------------
// The smoke server must not compete with a running session for the manifest
// ports: patch the staging manifest to free ports for the boot, then restore
// the original bytes before zipping.
const manifestPath = path.join(bundleRoot, "manifest.json");
const originalManifest = fs.readFileSync(manifestPath, "utf8");
const freePort = () =>
  new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
const smokePerformerPort = await freePort();
const smokeMonitorPort = await freePort();
fs.writeFileSync(
  manifestPath,
  JSON.stringify({ ...manifest, scoreServer: { ...manifest.scoreServer, performerPort: smokePerformerPort, monitorPort: smokeMonitorPort } }, null, 2) + "\n"
);
const server = spawn(process.execPath, [manifest.scoreServer.entry, "--audio-mode", "none"], {
  cwd: bundleRoot,
  stdio: ["ignore", "ignore", "pipe"],
});
let health = null;
const t0 = Date.now();
try {
  while (Date.now() - t0 < 15000 && !health) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      const res = await fetch(`http://127.0.0.1:${smokePerformerPort}/__pnds/health`);
      if (res.ok) health = await res.json();
    } catch {}
  }
  if (!health || health.status !== "ready")
    throw new Error(`smoke boot failed (health=${JSON.stringify(health)})`);
  if (health.projectId !== id)
    throw new Error(`smoke health reports projectId=${health.projectId}, expected ${id}`);
} finally {
  server.kill("SIGTERM");
  fs.writeFileSync(manifestPath, originalManifest);
}

// --- bundle ------------------------------------------------------------------
const bundleMeta = {
  formatVersion: 1,
  packedWith: "pnds-port skill",
  packedAt: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
  sourcePlatform: `${process.platform}-${process.arch}`,
};
fs.writeFileSync(path.join(dist, "pnds-bundle.json"), JSON.stringify(bundleMeta, null, 2) + "\n");
const pndsFile = path.join(outDir, `${clean(name)}-${version}.pnds`);
fs.mkdirSync(path.dirname(pndsFile), { recursive: true });
run("zip", ["-q", "-r", "-X", pndsFile, clean(name), "pnds-bundle.json"], dist);

const hash = crypto.createHash("sha256").update(fs.readFileSync(pndsFile)).digest("hex");
console.log(JSON.stringify({ pndsFile, sha256: hash, rootDir: clean(name), health }, null, 2));
fs.rmSync(stage, { recursive: true, force: true });

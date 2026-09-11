# Phase 5 — Packaging 打包

The deliverable is BOTH the project folder and a `.pnds` bundle. Generated projects do not carry a pack script — the skill packs via its own tool.

## Use

```sh
node <skill-dir>/tools/pack.mjs <project-dir> [--out <dir>]
```

Default output: the project's parent directory. Prints `{pndsFile, sha256, rootDir, health}`.

## What it does (and why you can trust it)

Mirrors the Template's release CI exactly:

1. **Allowlist staging** into a temp dir — only `manifest.json, package.json, server.js, README.md, LICENSE, lib/, audio/, public/, node_modules/, supercollider/synthdefs/` enter the bundle; `docs/`, `test/`, `sources/`, `supercollider/source/`, `supercollider/debug/`, `.git*`, `package-lock.json`, `.DS_Store` stay out by construction (never by hoping an exclude-list caught them). The working project is never mutated.
2. **Dependencies**: `npm prune --omit=dev` inside staging (or `npm ci --omit=dev` if node_modules absent); verifies every `dependencies` entry actually present.
3. **Structural checks**: every manifest `synthdefs` path present in staging; forbidden paths absent.
4. **Smoke boot** `--audio-mode none` on FREE ports (manifest ports are temporarily patched in staging and restored before zipping — so packaging never fights a running session); requires health `status:"ready"` AND `projectId` matching the manifest.
5. **Bundle**: `zip -X` with single root dir `<clean name>` + top-level `pnds-bundle.json` (formatVersion 1), prints sha256.

## Version discipline

Same `id` + `version` always reinstalls over itself — any content change must bump `manifest.json` `version` (patch for fixes, minor for capabilities). Before repacking an edited project, check the version.

## Alternatives (tell the user, don't run)

- App → 设置（⌘,）→ 开发者工具 → 打包工程 — the canonical packer with UI; same layout rules.
- The project's CI can adopt the Template's `.github/workflows/package.yml` if the user turns the folder into a released repo later.

## Distribution

Hand the user the `.pnds` path + sha256. Recipients need only PNDS App on the performance Mac (no Node, no SuperCollider, no internet at runtime; phones need only the LAN). Every install is the same universal bundle; the only runtime choice is each performer's player ID on the performer page.

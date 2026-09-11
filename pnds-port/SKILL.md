---
name: pnds-port
description: Port an existing digital-musical-score "triple" (a p5.js sketch from OpenProcessing + SuperCollider .scd file(s) + TouchOSC .tosc file(s)) into a runnable PNDS score project — generating the complete project folder AND its .pnds bundle in one shot, faithful to the original. Use whenever the user wants to 移植 / 转成 / 制作 a 数字乐谱的 PNDS 版（pnds 版）, submits OpenProcessing + SuperCollider + TouchOSC materials together, or asks to turn such a work into a PNDS project/bundle.
---

# pnds-port — 数字乐谱移植

Port a digital musical score from its original runtime (OpenProcessing p5.js + local SuperCollider + TouchOSC devices) into a PNDS score project. The output is one self-contained project directory plus a `.pnds` bundle, installable on every endpoint's PNDS App.

Glossary for the terms used throughout (端点 endpoint, 角色 role, 指挥乐谱 conductor, 演奏者界面 performer UI, 移植契约 port map, 死内容 dead content, 最小同步集 minimal sync set): see `design/CONTEXT.md`. Design rationale lives in `design/adr/`.

## Target architecture (fixed)

```text
Endpoint (one per venue: a Mac running PNDS App + this project)
├── monitor page  = 指挥乐谱 (the original p5.js conductor, projected big-screen),
│                   opening identity picker selects this endpoint's 角色 (role),
│                   hub connection form (url/token/room/node)
├── performer pages = 演奏者界面 (the original TouchOSC UI, as web controls;
│                   phones join via LAN, pick a 座位 (seat) = player number)
├── score server (Node, from PNDS Template modules) ── holds conductor state,
│   routes performer controls to the work audio layer
└── local scsynth (App-owned, internal mode) — plays ONLY this endpoint's role sounds

Endpoints ↔ endpoints: pnds-hub (stateless Socket.IO relay; control events only,
audio is explicitly out of scope — no JackTrip here)
```

One universal `.pnds` for all endpoints; a role is chosen at runtime, never baked into the bundle.

## Non-negotiables

1. **Fidelity order 保真排序**: sound 1:1 (SynthDefs verbatim, parameter mapping verbatim) > interaction semantics 1:1 (same controls, ranges, defaults, behaviors — simultaneous multi-touch included) > conductor visuals structure-preserved (same sections/pointer/node logic, rendering adapted to web) > network layer (TouchOSC UDP necessarily becomes Socket.IO + hub relay; do not chase wire-level resemblance).
2. **Triple completeness**: p5.js source code + .scd + .tosc are all required. Missing or unparseable → STOP, list exactly what is missing and what format is expected. An OpenProcessing URL alone is NOT the p5 source (Cloudflare blocks fetching; the API returns metadata only).
3. **OSCdef semantics move to the work layer** (`audio/controller.js`); SynthDefs ship as `supercollider/source/*.scd`, compiled to `.scsyndef`. Runtime never needs sclang. Third-party UGens in the original → STOP and ask (the App's scsynth bundles standard plugins only).
4. **Sync judgment rule 同步判据**: an interaction that changes the conductor visuals ⇒ discrete event relayed via hub; an interaction that only affects sound ⇒ local. Never sync continuous values (pointer angle etc. is always derived locally — clock drift is tolerated by design, see design/adr/0003).
5. **Stop-and-ask criteria** (everything else proceeds with the choice recorded in the port map): ① missing/broken input files; ② a sound-affecting control with no matching OSCdef (or an OSCdef with no sender) that the instructions cannot resolve; ③ conductor authority model undecidable from the sources; ④ instructions contradict the code; ⑤ fidelity-order conflict that cannot be resolved by degrading down the order.
6. **Project conventions**: npm only; Node >= 24 < 25 in `engines`; ports 6868/6869 unless taken; `id` = kebab-case piece name; first `version` 0.1.0; `tokenKey` = `<id>-token`; `outputChannels` = max channel count across the original's groups; `audioBusChannels >= 2 × outputChannels`. No git unless the user asks for it (default: plain local folder). Hub-synced works declare `"telematic": true` in the manifest (App v1.4.0 contract: gates the 「节点」 settings section and the four hub env vars; optional `performerAddress` gives performers a readable connect address — playbook §3).
7. **Performer page platform rules**: multi-touch is mandatory — TouchOSC players drive several controls at once (DOM controls get it for free; a p5 canvas needs `touches[]` + touch-id→control tracking with `touch-action: none`; Template `performer.js` is the pattern). The first version never forces portrait/landscape: responsive both ways, no rotate-hint overlay — orientation enforcement is a creator decision for later iterations, and desktop browsers open the performer page in landscape windows (playbook §4).

## Workflow — six phases, one gate each

Run phases in order. Each phase below names the reference to read BEFORE working it.

**Phase 1 — Validate 校验.** Read `reference/input-validation.md`. Accept or reject the input triple. Gate: every required file present and parseable.

**Phase 2 — Analyze 分析.** Read `reference/analysis.md`. Use `tools/tosc-parser.mjs` on each .tosc. Produce: OSC address cross-map, group pairing, dead-content list, conductor authority ruling, minimal sync set, deployment-topology ruling, known-deltas ledger. Gate: every open question either resolved from evidence or escalated per the stop criteria.

**Phase 3 — Port map 移植契约.** Read `reference/port-map-template.md`. Write `docs/port-map.md` inside the new project. Gate: port map complete; every row either maps, is dead content, or is a recorded known delta.

**Phase 4 — Generate 生成.** Read `reference/conversion-playbook.md` (module reuse map, per-target conversion rules, compile SynthDefs via `/Applications/SuperCollider.app/Contents/MacOS/sclang` with PATH fallback). Copy originals into `sources/`. Gate: project runs.

**Phase 5 — Verify 验证.** `npm run check` green, `npm test` green (new logic carries new tests), smoke boot `node server.js --audio-mode none` reaches health `ready`, then the **cold-open walkthrough**: both pages opened in a real browser with cleared storage and visually verified (monitor form clickable/typeable, performer seat card appears cold — node tests cannot see the screen; full checklist in `reference/conversion-playbook.md` §9). Only then package with `tools/pack.mjs` (read `reference/packaging.md`). Gate: walkthrough passed AND bundle exists with sha256.

**Phase 6 — Handoff 交接.** Report to the user: install steps, hub setup (App v1.4.0+ with `"telematic": true`: fill 设置「节点」栏三项 — 节点名 / hub 地址 / token, injection is all-or-nothing — and pick the Room group 1–3 in the sidebar, changes apply next launch; else monitor form or terminal env standalone; pnds-hub deployment is the user's), role/seat operation flow, manual acceptance checklist (per-role sounds, cross-endpoint conductor events, local-autonomy fallback, phone multi-touch + both orientations, conductor keys work inside the App), and the known-deltas list. Real-sound verification is the user's — the agent automates only "the right parameters reach the right synths".

## Tools bundled with this skill

- `tools/tosc-parser.mjs <file.tosc>...` — .tosc → JSON control inventory (paths, args, scales, steps, frames). Tested against real files.
- `tools/pack.mjs <project-dir> [--out dir]` — allowlist staging, dependency verify, none-mode smoke boot (on free ports, never fighting a running session), `zip -X` bundle + sha256. The project itself never carries a pack script; repackaging later can use the App's 打包工程 or this tool.

## Iterating

If the user asks for changes to a project this skill already produced, read that project's `docs/port-map.md` first, change the map, then the code — the map is the audit trail for what was decided and why. Content changes to a distributed project require a `version` bump in manifest.json (same id+version always reinstalls over itself).

## Calibration example

`reference/case-co-here.md` is a complete worked analysis of a real, complex triple (Co-here/Co-hear: 3 .scd + 3 .tosc + performer instructions). When in doubt about how deep an analysis should go, match its depth. Its conductor section is pending the p5 source and shows how open questions are recorded rather than guessed.

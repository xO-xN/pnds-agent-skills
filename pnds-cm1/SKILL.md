---
name: pnds-cm1
description: Port a polished classroom networked digital score project (p5.js sketch + SuperCollider .scd + ONE TouchOSC .tosc) into a runnable PNDS project for LOCAL-network performance — one monitor page (conductor score, START, QR join) plus per-player web controls; no hub, no roles. Built for phase 1 of Prof. Kenneth Fields' computer music course. Invoke ONLY when the user explicitly chooses this skill (用 pnds-cm1 / CM1 / 课程第一阶段 / 本地网络版移植); pnds-cm1 and pnds-port serve different needs — never auto-select between them.
---

# pnds-cm1 — 计算机音乐课程第一阶段：本地网络移植

Port a classroom networked digital score project from its original runtime (OpenProcessing p5.js + local SuperCollider + TouchOSC phones) into a PNDS project for **local-network performance**: one Mac, performers' phones on the same LAN, no hub, no roles. The output is one self-contained project directory plus a `.pnds` bundle, installable in PNDS App.

Built for phase 1 of Prof. Kenneth Fields' computer music course. Input premise: the work arrives **polished and runnable standalone** — the p5 sketch already carries its logic rules (and usually its own start / duration design). This skill ports, it does not redesign or repair the piece.

Glossary for the terms used throughout (三件套 triple, 指挥乐谱 conductor, 演奏者界面 performer UI, 座位 seat, 演奏生命周期 performance lifecycle, 移植契约 port map, 死内容 dead content, 输出基准 output baseline): see `design/CONTEXT.md`. Design rationale lives in `design/adr/`.

## Target architecture (fixed)

```text
Endpoint (one Mac running PNDS App + this project; phones join over the LAN)
├── monitor page = 指挥乐谱 (the original p5 sketch, projected big-screen):
│   performance lifecycle (START; pause/reset/jump only if the sketch has
│   them), QR join code, player-ID presence
├── performer pages = 演奏者界面 (the original TouchOSC UI as web controls;
│   phones scan the QR and pick a player ID = 座位)
├── score server (Node, from PNDS Template modules) — holds score state
│   server-side, routes performer controls to the work audio layer
└── local scsynth (App-owned, internal mode) — plays the work's sounds

No hub, no role picker, no telematic: everything happens on this one endpoint.
```

One universal `.pnds`; the only runtime choice is each performer's player ID.

## Non-negotiables

1. **Fidelity order 保真排序**: sound 1:1 (SynthDefs verbatim, parameter mapping verbatim) > interaction semantics 1:1 (same controls, ranges, defaults, behaviors — simultaneous multi-touch included) > conductor visuals structure-preserved (same sections/pointer/node logic, rendering adapted to web) > network layer (TouchOSC UDP necessarily becomes local Socket.IO; do not chase wire-level resemblance).
2. **Triple completeness, single-UI norm**: p5.js source code + .scd file(s) + **one** .tosc file are all required. The regular course input is a single TouchOSC UI shared by all players; multiple .tosc files are a special case the user must explain (which players use which UI) — unexplained → STOP. Missing or unparseable input → STOP, listing exactly what is missing and what format is expected. An OpenProcessing URL alone is NOT the p5 source (Cloudflare blocks fetching; the API returns metadata only).
3. **OSCdef semantics move to the work layer** (`audio/controller.js`); SynthDefs ship as `supercollider/source/*.scd`, compiled to `.scsyndef`. Runtime never needs sclang. Third-party UGens in the original → STOP and ask (the App's scsynth bundles standard plugins only).
4. **Performance lifecycle 演奏生命周期**: the final monitor must run the original's lifecycle correctly. Sketch already has a start button / transport / duration → port them faithfully and verify they work inside the App. Sketch merely auto-runs on page load → explicitize as a monitor START button (recorded as a known delta). Sketch has **no intrinsic end** → STOP and ask the user for the duration or end definition before generating; record the ruling in the port map. Never ship an unlimited performance.
5. **Stop-and-ask criteria** (everything else proceeds with the choice recorded in the port map): ① missing/broken input files; ② a sound-affecting control with no matching OSCdef (or an OSCdef with no sender) that the instructions cannot resolve; ③ no intrinsic end and no user-supplied duration; ④ multiple .tosc files the user has not explained; ⑤ instructions contradict the code; ⑥ a fidelity-order conflict that cannot be resolved by degrading down the order.
6. **Project conventions**: npm only; Node >= 24 < 25 in `engines`; ports 6868/6869 unless taken; `id` = kebab-case piece name; first `version` 0.1.0; `tokenKey` = `<id>-token`; `outputChannels` = the original's channel count; `audioBusChannels >= 2 × outputChannels`. No git unless the user asks for it (default: plain local folder). **Never declare `"telematic"`** — that manifest contract belongs to pnds-port's multi-endpoint architecture, not to a local work.
7. **Performer page platform rules**: multi-touch is mandatory — TouchOSC players drive several controls at once (DOM controls get it for free; a p5 canvas needs `touches[]` + touch-id→control tracking with `touch-action: none`; Template `performer.js` is the pattern). Responsive in BOTH orientations, no rotate-hint overlay. Visual language **inherits the original p5 sketch's design** (colors, style) by default — record the mapping in the port map; a deviation is a decision, never an accident.
8. **Output baseline 输出基准 is binding**: `reference/output-contract.md` defines the feature floor every generated project must satisfy on both pages. Phase 5 gates on it. An item that genuinely does not apply must appear as a port-map N/A row with evidence — a silently missing feature is a violation and blocks packaging.

## Workflow — six phases, one gate each

Run phases in order. Each phase below names the reference to read BEFORE working it.

**Phase 1 — Validate 校验.** Read `reference/input-validation.md`. Accept or reject the input triple. Gate: every required file present and parseable; the .tosc count ruling made (single = proceed, multiple = user explanation).

**Phase 2 — Analyze 分析.** Read `reference/analysis.md`. Use `tools/tosc-parser.mjs` on the .tosc. Produce: OSC address cross-map, dead-content list, lifecycle ruling (start / duration / end behavior), voice-model ruling, known-deltas ledger. Gate: every open question either resolved from evidence or escalated per the stop criteria.

**Phase 3 — Port map 移植契约.** Read `reference/port-map-template.md`. Write `docs/port-map.md` inside the new project, including the baseline N/A section. Gate: port map complete; every row either maps, is dead content, or is a recorded known delta.

**Phase 4 — Generate 生成.** Read `reference/conversion-playbook.md` (module reuse map, per-target conversion rules, compile SynthDefs via `/Applications/SuperCollider.app/Contents/MacOS/sclang` with PATH fallback). Copy originals into `sources/`. Gate: project runs.

**Phase 5 — Verify 验证.** `npm run check` green, `npm test` green (new logic carries new tests), smoke boot `node server.js --audio-mode none` reaches health `ready`, then the **cold-open walkthrough**: both pages opened in a real browser with cleared storage and visually verified (monitor renders the score with working lifecycle controls; performer waiting card appears cold — node tests cannot see the screen; full checklist in `reference/conversion-playbook.md` §8). Then run the **output-baseline audit** against `reference/output-contract.md`: every monitor and performer item passes or carries a port-map N/A row. Only then package with `tools/pack.mjs` (read `reference/packaging.md`). Gate: walkthrough passed AND baseline audit passed AND bundle exists with sha256.

**Phase 6 — Handoff 交接.** Report to the user: install steps (double-click the `.pnds`; no hub, no node settings, nothing to configure beyond audio mode), the performance flow (scan QR → pick player ID → monitor START → piece runs its bounded duration → auto-wrap), manual acceptance checklist (per-seat sounds, START visible on every page, duration actually ends the performance, phone multi-touch + both orientations, conductor keys work inside the App), and the known-deltas list. Real-sound verification is the user's — the agent automates only "the right parameters reach the right synths".

## Tools bundled with this skill

- `tools/tosc-parser.mjs <file.tosc>...` — .tosc → JSON control inventory (paths, args, scales, steps, frames). Tested against real files.
- `tools/pack.mjs <project-dir> [--out dir]` — allowlist staging, dependency verify, none-mode smoke boot (on free ports, never fighting a running session), `zip -X` bundle + sha256. The project itself never carries a pack script; repackaging later can use the App's 打包工程 or this tool.

## Iterating

If the user asks for changes to a project this skill already produced, read that project's `docs/port-map.md` first, change the map, then the code — the map is the audit trail for what was decided and why. Content changes to a distributed project require a `version` bump in manifest.json (same id+version always reinstalls over itself).

## Calibration example

`reference/case-inarticulate-iii.md` is the reference shape of a cm1 output: a real local-network PNDS work (one SynthDef family, QR join, player-ID picker, observation monitor). When in doubt about what the target looks like, match its shape.

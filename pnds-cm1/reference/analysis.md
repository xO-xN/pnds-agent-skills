# Phase 2 — Analysis 分析

Produce the facts the port map is built from. Everything concluded here lands in `docs/port-map.md` (Phase 3) with its evidence. Depth calibration: `case-inarticulate-iii.md` for the target shape; for analysis depth on messy real triples, pnds-port's `case-co-here.md` is the gold standard (its hub-related sections simply do not apply here).

## 1. TouchOSC inventory

Run: `node tools/tosc-parser.mjs "<file>.tosc"`. You get the control tree with types (FADER/BUTTON/XY/RADIO/PAGER/LABEL/GROUP), names, resolved OSC paths, argument specs (variable, FLOAT/INTEGER conversion, scaleMin/Max), steps counts, frames, and MIDI mirrors.

Read carefully — these properties of the format bite:

- **Paths are name-derived**: typically `CONSTANT "/" + PROPERTY name` → `/fader3`. Controls inside named GROUPs may use `parent.name` prefixes (`/2/fader7`). The parser resolves both; trust `pathResolved`, not filename guesses.
- **One address, two arg shapes**: RADIO can send INTEGER 1..N or FLOAT 0–1 (check `conversion` + scales) and the SC side often accepts both — record the actual shape.
- **MIDI mirrors** (`midi.enabled`) run in parallel with OSC — always dead content in the port (record, never generate).
- **Pager** sends `/pagerN` with the page index; whether anything listens is a cross-validation question, not an assumption.
- Empty LABELs are layout placeholders; LABELs with text are instructions to the performer — capture the text in the port map.
- The canvas frame (e.g. 640×860 portrait) is a layout-proportion hint only — the port page stays responsive both ways.

## 2. SuperCollider facts

Per .scd, extract a table:

| fact | why it matters |
|---|---|
| SynthDef names + control args | naming contract; controller mapping targets |
| OSCdef addresses, arg types, full mapping math (scaling like `×2.2`, `linexp`, defaults, gate semantics, hot-swap/retrigger logic) | moves verbatim into `audio/controller.js` |
| voice architecture: one always-on synth vs one-per-radio-slot swapped via `synth.set`/respawn | decides the port's voice model |
| timing: internal envelopes (`Line.kr` durations) vs Routines/Tasks | internal timing stays in the SynthDef; Routines become controller/server logic — flag them |
| `s.options` (memSize etc.), buffers, buses beyond out 0 | known-deltas candidates (manifest cannot express memorySize) |
| output channel count per SynthDef (`Out.ar(0, stereo)` vs multichannel) | feeds `outputChannels` |

## 3. p5 conductor facts — lifecycle audit first

From the source, extract in this order:

- **Lifecycle 演奏生命周期 (the ruling that feeds non-negotiable #4)**: Does the sketch have an explicit start control (button/key)? Does it auto-run on load? What is the total duration / does it reach an end state? Which transport controls exist (pause/reset/jump/section-skip)? Ruling: `ported-as-is` (controls exist) / `explicitized` (auto-run → START, known delta) / `no-intrinsic-end` (→ stop-criterion ③, ask the user for duration or end definition — do not guess).
- **Section/timeline structure**: section list, what advances them (time-based auto? operator action? performer action?), the pointer/rotation model, node/sector state rules.
- **Input surface**: every `keyPressed`/`mousePressed`/`touchStarted` and what it changes. **Taps on the score canvas itself** — these are conductor-affecting performer inputs; in the port they need a performer-page affordance — design decision for the port map (baseline P7).
- **State that is shared vs local**: in a single-endpoint port everything shared lives in the server's score state and is broadcast; cosmetic-only state stays in the page.
- **Determinism**: which visuals derive from a clock vs from discrete events. The port's clock is the SERVER's (single authority) — better than the original's per-browser clocks; note it as a known delta if the original visibly relied on client drift.
- **Network use in the sketch** (rare): if the original p5 sketch itself sends/receives OSC or WebSocket, record it; local Socket.IO replaces it. If it conflicts with the triple assumptions, stop-criteria may apply.
- **Visual language**: extract the palette, key colors, and design character — the performer page inherits them (baseline P9).

## 4. Instructions facts

Performer-facing constraints, defaults, the operational flow (who opens what, in which order), player counts, any network setup prose. Contradictions with code → stop-criterion ⑤.

## 5. Cross-validation OSC 交叉验证

Build the full address matrix:

- **wired**: .tosc sends ⇄ .scd listens (normal; record the arg semantics).
- **dead-sent**: .tosc sends, nothing listens (e.g. spare page controls, `/pager1`) → dead content.
- **orphan listener**: .scd listens, no .tosc sends it — check whether the p5 sketch or the instructions imply a sender; if none found and the address affects sound → stop-criterion ②.
- **dual path families**: the SC side sometimes registers both `/x` and `/1/x` for the same control (author convenience). Collapse them to ONE control id in the port; note the family in the map.

## 6. Voice-model ruling 声部模型裁决

Question the sources must answer: **did the original run one SuperCollider per performer** (each phone → own machine) or one shared? Evidence: OSCdef state design (single `\currentSound` variable = shared voice; per-sender state = per-performer), instructions phrasing ("player 1 taps radio 1"), control semantics (radio as instrument choice per player).

This decides the port's **voice model**: per-seat synth voices (the PNDS natural: one client = one voice, Inarticulate III's shape) vs one shared voice with control arbitration. Wrong guesses here wreck interaction fidelity — if evidence is split, ask (stop criteria).

## 7. Server state model 服务器状态模型

Single endpoint means no sync-protocol work, but the broadcast design still decides whether pages render correctly:

- Score state (section index, anchors, node/sector states, lifecycle flags) lives server-side (`lib/conductor.js`); pages are views.
- **Cold-connect replay**: every new socket receives the full state snapshot on connection — a fresh phone on a fresh server must render, never wait for the next event.
- Continuous quantities (pointer angle) derive on the page from the server's event anchors; control values route phone → server → controller and are never broadcast to other phones.

## 8. Known-deltas ledger 已知差异

Check every one; each becomes a port-map row:

- `s.options.memSize` → not expressible in manifest (`audio.scsynth` has only blockSize/audioBusChannels); test compile + App run; if synths fail to allocate, surface to the user.
- Sample rate → App-side (default 48000), original may assume 44100.
- Third-party UGens → forbidden at runtime (stop criterion if present).
- TouchOSC-specific behaviors dropped: MIDI mirrors, value-mirroring feedback, host config in app.
- Per-browser clock → single server clock (an improvement; note if the original exploited drift).
- Topology: original N×(laptop+phone+browser) → one endpoint, phones as web clients.
- Auto-run sketch → explicit START on the monitor (the page must not start performing the moment the session loads).
- Anything the .scd does at `waitForBoot` beyond SynthDef registration (CmdPeriod, server options).

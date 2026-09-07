# Phase 2 — Analysis 分析

Produce the facts the port map is built from. Everything concluded here lands in `docs/port-map.md` (Phase 3) with its evidence. Depth calibration: `case-co-here.md`.

## 1. TouchOSC inventory

Run per file: `node tools/tosc-parser.mjs "<file>.tosc"`. You get the control tree with types (FADER/BUTTON/XY/RADIO/PAGER/LABEL/GROUP), names, resolved OSC paths, argument specs (variable, FLOAT/INTEGER conversion, scaleMin/Max), steps counts, frames, and MIDI mirrors.

Read carefully — these properties of the format bite:

- **Paths are name-derived**: typically `CONSTANT "/" + PROPERTY name` → `/fader3`. Controls inside named GROUPs may use `parent.name` prefixes (`/2/fader7`). The parser resolves both; trust `pathResolved`, not filename guesses.
- **One address, two arg shapes**: RADIO can send INTEGER 1..N or FLOAT 0..1 (check `conversion` + scales) and the SC side often accepts both — record the actual shape.
- **MIDI mirrors** (`midi.enabled`) run in parallel with OSC — always dead content in the port (record, never generate).
- **Pager** sends `/pagerN` with the page index; whether anything listens is a cross-validation question, not an assumption.
- Empty LABELs are layout placeholders; LABELs with text are instructions to the performer — capture the text in the port map.

## 2. SuperCollider facts

Per .scd, extract a table:

| fact | why it matters |
|---|---|
| SynthDef names + control args | naming contract; controller mapping targets |
| OSCdef addresses, arg types, full mapping math (scaling like `×2.2`, `linexp`, defaults, gate semantics, hot-swap/retrigger logic) | moves verbatim into `audio/controller.js` |
| voice architecture: one always-on synth vs one-per-radio-slot swapped via `synth.set`/respawn | decides the port's voice model |
| timing: internal envelopes (`Line.kr` durations) vs Routines/Tasks | internal timing stays in the SynthDef; Routines become controller/server logic — flag them |
| `s.options` (memSize etc.), buffers, buses beyond out 0 | known-deltas candidates (manifest cannot express memorySize) |
| output channel count per SynthDef (`Out.ar(0, stereo)` vs multichannel) | feeds `outputChannels` = max across groups |

## 3. p5 conductor facts

From the source, extract:

- **Section/timeline structure**: section list, what advances them (time-based? auto or operator? performer action?), the pointer/rotation model (speed, direction reversals), node/sector state rules.
- **Input surface**: every `keyPressed`/`mousePressed`/`touchStarted` and what it changes. Identity selection at start (the "开场身份输入") — options presented, values, where held. **Taps on the score canvas itself** (e.g. "tap your own node") — these are conductor-affecting performer inputs; in the port they need a home (performer page affordance or monitor interaction) — design decision for the port map.
- **State that is shared vs local**: everything every viewer must see identically becomes the sync set; anything cosmetic stays local.
- **Network use in the sketch** (rare): if the original p5 sketch itself sends/receives OSC or WebSocket, that changes the sync design — analyze and record; if it conflicts with the triple assumptions, stop-criterion ③/⑤ may apply.
- **Determinism**: which visuals derive from a clock (port: derive locally from event anchors) vs from discrete events (port: relay).

## 4. Instructions facts

Performer-facing constraints, defaults, the operational flow (who opens what, in which order), venue/group naming, any network setup prose. Contradictions with code → stop-criterion ④.

## 5. Cross-validation OSC 交叉验证

Build the full address matrix:

- **wired**: .tosc sends ⇄ .scd listens (normal; record the arg semantics).
- **dead-sent**: .tosc sends, nothing listens (e.g. spare page controls, `/pager1`) → dead content.
- **orphan listener**: .scd listens, no .tosc sends it — check whether the p5 sketch or the instructions imply a sender; if none found and the address affects sound → stop-criterion ②.
- **dual path families**: the SC side sometimes registers both `/x` and `/1/x` for the same control (author convenience). Collapse them to ONE control id in the port; note the family in the map.

## 6. Group pairing 多组配对

When there are multiple .scd / .tosc: pair them by **OSC address-set overlap** (the .tosc whose address family matches the .scd's OSCdef family), corroborated by filenames and the instructions' group names (e.g. "PKU → Field II"). Ambiguous pairing → ask the user (stop criteria).

## 7. Conductor authority ruling 权威模型裁决

Decide: **conductor-role 主导角色** (the work defines a leader with a specific start UI; that endpoint drives, others follow) or **synchronized-start 同步开始** (any endpoint can start; all begin together).

Evidence: gating in the p5 sketch (does one participant's choice control the others' state?), instructions ("conductor presses...", "everyone presses start"), asymmetries in the identity picker. Record the ruling + evidence. Undecidable → stop-criterion ③, ask the user.

## 8. Deployment topology ruling 部署拓扑裁决

Question the sources must answer: **how many SuperCollider instances ran in the original?** One per venue (shared controls, single voice) or one per performer (each phone → own laptop)? Evidence: OSCdef state design (single `\currentSound` variable = shared voice; per-sender state = per-performer), instructions phrasing ("player 1 taps radio 1"), control semantics (radio as instrument choice per player).

This decides the port's **voice model**: per-seat synth voices (PNDS natural: one client = one voice) vs one shared voice per endpoint with control arbitration. Wrong guesses here wreck interaction fidelity — if evidence is split, ask (stop criteria).

## 9. Minimal sync set derivation 最小同步集

Enumerate every interaction from §3 that changes conductor visuals. Each becomes a relayed discrete event. Default vocabulary (extend per work):

- `start` / `reset` — performance lifecycle (permission per authority ruling)
- `section` — `{index, id}` transitions (auto-timer or operator)
- `tap` — performer canvas-taps affecting visuals (`{seat/node, state}`)
- `presence` — endpoint heartbeat (who's online, for monitor display)

NOT synced, ever: performer control values (fader/xy/radio), audio, local registry detail, continuous visuals. Clock drift is tolerated (ADR-0003): continuous quantities derive locally from the last received event anchor.

## 10. Known-deltas ledger 已知差异

Check every one; each becomes a port-map row:

- `s.options.memSize` → not expressible in manifest (`audio.scsynth` has only blockSize/audioBusChannels); test compile + App run; if synths fail to allocate, surface to the user.
- Sample rate → App-side (default 48000), original may assume 44100.
- Third-party UGens → forbidden at runtime (stop criterion if present).
- TouchOSC-specific behaviors dropped: MIDI mirrors, value-mirroring feedback, host config in app.
- Per-browser clock → per-endpoint clock (better than original, still not synced).
- Topology: original N×(laptop+phone+browser) → endpoints with local performers.
- Anything the .scd does at `waitForBoot` beyond SynthDef registration (CmdPeriod, server options).

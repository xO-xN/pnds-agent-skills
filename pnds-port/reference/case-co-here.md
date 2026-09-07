# Worked example — Co-here/Co-hear

A real, complex triple analyzed with this skill's method. Use it to calibrate analysis depth. Facts below were extracted from the actual files (parser-verified); items marked **OPEN** were deliberately left as questions rather than guesses — that is the correct behavior.

## Inputs

- 3 × SuperCollider: `Co Field I-Core.scd`, `Co Field II- Temporal.scd`, `Co Field III — Resonant Drift.scd`
- 3 × TouchOSC: `Core Field for CCOM.tosc`, `Temporal Field for PKU.tosc`, `Resonant Drift for武汉.tosc`
- `Co here-Co hear Performer Instructions.docx`
- p5 sketch: OpenProcessing @u547616/2942435 ("Co-here/Co-hear", p5 1.11.11, license by-nc-sa) — **OPEN: source code not yet submitted**; only metadata fetched via `https://openprocessing.org/api/sketch/2942435`.

## Roles & pairing

| role | original group | .scd | .tosc | evidence |
|---|---|---|---|---|
| ccom-a | CCOM-A (players 1–5) | Field I-Core | Core Field (CCOM) | instructions "CCOM-A → Field I, faders 1–5"; address families match |
| ccom-b | CCOM-B (players 6–10) | Field I-Core (same) | Core Field (same) | instructions: same sound, 6th fader unused |
| pku | PKU | Field II-Temporal | Temporal Field (PKU) | radio1 5 steps ⇔ 5 SynthDefs |
| wuhan | Wuhan | Field III-Resonant Drift | Resonant Drift (武汉) | radio1 3 steps ⇔ 3 SynthDefs |

CCOM-A and CCOM-B share one instrument — in the port they are two ROLES (different endpoints) sharing the same SynthDef set and UI variant. outputChannels = 2 (all groups stereo).

## Sound side (from the .scd files)

- Field I: ONE monolithic SynthDef `\duskTriPlusWormMidOctOSC` — 6 layers mixed internally (incl. a one-shot 420 s `Line.kr` "worm"); start/stop via button gate; faders are layer gains with per-fader scaling (×2.2, ×2.8, ×2.4); xy maps to pitch base (linexp 45–280 Hz), motion, reverb wet. All timing internal — no Routines. Stereo Out.ar(0).
- Field II: 5 SynthDefs, one active at a time, swapped on `/radio1` (INTEGER 1–5 or float 0–1) with per-sound default sets; `/button1` start/stop; `/fader1` amplitude (max 0.58 for sound 1 else 0.42); fader2–6 → `\p2..\p6`; xy → `\x,\y`. `s.options.memSize = 262144` — **known delta** (manifest cannot express it).
- Field III: 3 SynthDefs (`wuhanMist`, `wuhanElectricField`, `wuhanFracturedFog`), same control scheme as Field II (radio 1–3, amp max 0.35). memSize 262144 likewise.
- No hard-coded IPs anywhere; everything listens on the lang port via OSCdefs; no buffers/samples; core UGens only (no third-party — verified).

## Control side (parser output, verified)

- All three interfaces: 640×860 canvas; controls `button1`, `xy1`, `fader1–6` (+ `radio1` steps=5 / steps=3). All controls also emit MIDI CC mirrors in parallel — **dead content** (dropped, recorded).
- CCOM interface has a PAGER (`pager1`, 3 pages): page 1 holds the wired controls (`/button1` etc.); pages 2–3 hold `fader7`/`button2`/`button3` whose paths resolve via parent-name to `/2/fader7`, `/2/button2`, `/3/button3` — **no OSCdef listens on any of them → dead content**. (Early manual analysis misread these as `/1/...`; the parser's `pathResolved` is ground truth — always run it.)
- `/pager1` (page index) — nothing listens → dead content.
- SC side registers dual families (`/x` and `/1/x`) for Field I's main controls → collapse to one control id in the port; record the family.
- Radio semantics: int-or-float duality kept on the SC side ("re-tap radio" instruction exists because of a default-recognition quirk) — port keeps 1..N integer semantics with seat presets; the quirk itself becomes unnecessary.

## Conductor (from instructions; p5 source pending)

Sections A–F: fixed score (sectors/nodes light per score, entries/timing/density dictated) → climax D (all sectors lit, improvisation, small-range xy) → E open listening field (pointer stops, screen darkens, players self-cue by ear, tap own node to light it, reverse pointer sweeps signal withdrawal, tap again to dim) → F fixed score returns. The p5 page is the shared visual conductor; humans close the loop (nothing in the files shows SC/TouchOSC sending to the sketch).

- **OPEN (stop-criterion ③)**: authority model — instructions don't name a leader; sketch source will decide (auto-advance timers vs any-viewer start). Default hypothesis: synchronized-start.
- **OPEN (deployment topology)**: one SC per venue vs one per performer. The single `\currentSound` variable in Field II suggests per-performer instances (each PKU player their own laptop + radio-locked instrument), which fits per-seat voices in PNDS; instructions' "player 1 taps radio 1" corroborates radio-slot ≈ player identity. Resolve with the user before generating.
- Port design note: section-E node taps need a performer-page affordance (the original tap was on the sketch canvas each performer had open).

## Minimal sync set (draft)

`start`, `section` {index}, `reset`, `tap` {node/seat, state}, `presence` {role, seats}. Pointer angle/section timers derive locally from event anchors. Not synced: faders/xy/radio, audio, per-endpoint registry detail.

## Dead content & known deltas (summary)

Dead: `/2/*`, `/3/*` spare controls, `/pager1`, all MIDI mirrors, empty LABELs. Deltas: memSize inexpressible (test in App; escalate if allocation fails), 48 kHz App sample rate vs original assumption, TouchOSC host config replaced by endpoint LAN, per-browser clocks → per-endpoint clocks, topology N-laptops → 4 endpoints.

## Port skeleton this case implies (preview)

id `co-here-co-hear`, v0.1.0; roles ccom-a/ccom-b (shared UI variant `core-field`, 5 seats each), pku (5 seats), wuhan (3 seats); monitor = circular-field conductor with role picker + hub form; performer pages per role; controller with three mapping tables (one per .scd family); all SynthDefs compiled into one universal bundle.

# Port map template 移植契约模板

Copy this skeleton to the generated project's `docs/port-map.md` and fill every section. Every row must end in one of three states: **mapped** (→ where it lives in the port), **dead content** (recorded, not generated), or **known delta** (unavoidable divergence + mitigation). Nothing silently dropped. §11 is the audit trail the output baseline reads.

```md
# Port Map — <piece name>

Original: <title, author, OpenProcessing URL if any, license note>
Generated: <project id> @ <version>, <date>. Analysis evidence kept in `sources/`.

## 1. Identity

| field | value | source |
|---|---|---|
| id / name | | title / instructions |
| players / seats | <seat count> | instructions + control/inventory evidence |
| outputChannels | | original SynthDefs |
| seat → defaults policy | | instructions (locked? preset only?) |

## 2. Players & seats 座位

| seats | performer UI | control family | notes |
|---|---|---|---|

Voice model ruling: **per-seat / shared** — evidence: <...>.
Multi-UI special case (if the user explained multiple .tosc): <the player↔UI assignment, verbatim from the user>.

## 3. Control map 控件映射

Control id = the trailing OSC address segment (e.g. `fader3`).

| control id | UI type | range/args | SynthDef(s) | param(s) | mapping math | default(s) | locked to seat? |
|---|---|---|---|---|---|---|---|

Implied orientation (from .tosc frames): <portrait/landscape — layout-proportion hint only; the page itself stays responsive both ways, no rotate enforcement (playbook §4)>.

## 4. Conductor 指挥乐谱 & lifecycle 演奏生命周期

- Lifecycle ruling: **ported-as-is / explicitized / user-ruled-duration** — evidence: <...>.
- START / pause / reset / jump controls ported: <list, or "START only (original auto-ran)" as known delta>.
- Total duration & end behavior: <duration; what wraps at the end (synth release, end-state visual)>.
- Sections: <list, advance trigger (auto/manual), timings>
- Pointer/continuous visuals: <model; derived on-page from server event anchors>
- Node/sector rules: <...>
- Performer interactions on the score (taps etc.) → ported to: <performer page affordance / monitor>
- p5 source files transplanted into: <monitor.js structure notes>
- Key map vs page-interaction.md: <original keys → ported keys, with remap reasons (⌘ / system / reserved keys remapped into the safe zone: plain chars, ⇧/⌥ combos, F1–F12)>
- Visual language inherited by the performer page: <palette/colors/design elements taken from the sketch>

## 5. Server state & broadcast 服务器状态

| event | payload | emitted by | received by | notes |
|---|---|---|---|---|

State snapshot on cold connect: <what a fresh socket receives>. Lifecycle events (start/end) broadcast to all pages: <...>.

## 6. Audio

| SynthDef (original name) | source file | scsyndef | edits vs original |
|---|---|---|---|

`edits vs original` must stay mechanical (e.g. "Out.ar(0,…) → Out.ar(out,…)"); anything else is a known delta.

## 7. Dead content 死内容

| item | kind | evidence |
|---|---|---|

## 8. Known deltas 已知差异

| delta | original | port | mitigation / verification |
|---|---|---|---|

## 9. Decision log 歧义裁决

| question | ruling | evidence | who decided (analysis / user) |
|---|---|---|---|

## 10. Manual acceptance checklist 人工验收

Per seat: each control moved → expected sound change. Lifecycle: START visible on every page; duration actually ends the performance (synths released, end-state visual). Performer platform: two-finger simultaneous controls on a phone; page usable in both orientations; no rotate trap on a desktop landscape window; lock/unlock restores seat + state. QR: phone scan joins the performer page. Monitor keys: every conductor binding fires inside the App (page-interaction.md safe zone, no reserved-key collisions).

## 11. Output baseline N/A 输出基准豁免

Every M/P item from the skill's `reference/output-contract.md` that does NOT apply to this work, with evidence. Empty section = all items required and satisfied.

| baseline id | why N/A | evidence / user decision |
|---|---|---|
```

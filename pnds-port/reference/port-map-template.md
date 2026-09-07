# Port map template 移植契约模板

Copy this skeleton to the generated project's `docs/port-map.md` and fill every section. Every row must end in one of three states: **mapped** (→ where it lives in the port), **dead content** (recorded, not generated), or **known delta** (unavoidable divergence + mitigation). Nothing silently dropped.

```md
# Port Map — <piece name>

Original: <title, author, OpenProcessing URL if any, license note>
Generated: <project id> @ <version>, <date>. Analysis evidence kept in `sources/`.

## 1. Identity

| field | value | source |
|---|---|---|
| id / name | | title / instructions |
| roles | <role list, see §2> | instructions + pairing analysis |
| seats per role | | instructions |
| outputChannels | | max across original groups |
| seat → defaults policy | | instructions (locked? preset only?) |

## 2. Roles 角色

| role | original group | .scd | .tosc | performer UI file | seats | notes |
|---|---|---|---|---|---|---|

Conductor authority model: **conductor-role / synchronized-start** — evidence: <...>.
Who may start / advance / reset: <...>.

## 3. Control map 控件映射

One table per role. Control id = the trailing OSC address segment (e.g. `fader3`).

| control id | UI type | range/args | SynthDef(s) | param(s) | mapping math | default(s) | locked to seat? |
|---|---|---|---|---|---|---|---|

Implied orientation (from .tosc frames): <portrait/landscape — layout-proportion hint only; the page itself stays responsive both ways, no rotate enforcement (playbook §4)>.

Voice model ruling: **per-seat / shared-per-endpoint** — evidence: <...>.

## 4. Conductor 指挥乐谱

- Sections: <list, advance trigger (auto/manual), timings>
- Pointer/continuous visuals: <model; derived locally from event anchors>
- Node/sector rules: <...>
- Performer interactions on the score (taps etc.) → ported to: <performer page affordance / monitor>
- p5 source files transplanted into: <monitor.js structure notes>

## 5. Sync set 最小同步集

| event | payload | emitted by | relayed to | notes |
|---|---|---|---|---|

Explicitly NOT synced: <list>.

## 6. Audio

| SynthDef (original name) | source file | scsyndef | used by role(s) | edits vs original |
|---|---|---|---|---|

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

Per role: each control moved → expected sound change. Cross-endpoint: section transition visible everywhere; tap visible everywhere; hub drop → local autonomy; reconnect → convergence. Performer platform: two-finger simultaneous controls on a phone; page usable in both orientations; no rotate trap on a desktop landscape window; monitor shows the full hub room name + node id.
```

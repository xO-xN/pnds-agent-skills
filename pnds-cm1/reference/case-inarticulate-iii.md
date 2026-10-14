# Reference shape — Inarticulate III

Historical local-network reference work (v1.2.1, hand-built). This case supplies implementation evidence, not a complete current CM1 output or a regression run performed by this Skill. Its absence of START/bounded end does not waive current course requirements; read output-contract.md and obtain the author's necessary course decisions.

## Shape

- **One endpoint, no hub, no roles**: manifest has no `telematic` field; nothing to configure at runtime except audio mode/device. "A networked digital score for three performers."
- **Monitor page** (6869): landscape observation layout — center keeps the full interaction area; left panel shows the performance strategy (演奏规则 + performer tips, straight from the work's own instructions); right panel is a live OSC control-stream observer (every `/p*` address with its last sent value — in External mode those are the real OSC addresses, in Internal mode the same semantics mapped onto `/n_set`). The QR join code is served here.
- **Performer page** (6868): pick Player 1 / 2 / 3, then perform by touch — primary touch moves that performer's voice, a second simultaneous touch bends its PitchShift. When two performers come within threshold, the score draws a line between them and couples their sound.
- **Historical no-START behavior**: performers self-start by touching. The current CM1 course requires a START and bounded end; this historical shape alone does not satisfy that gate. Course adaptation must discuss and record those artistic changes with the author.

## Conventions worth copying

| convention | where |
|---|---|
| SynthDef name = file name = manifest entry (`inarticulate-iii`) | supercollider + manifest |
| one source .scd (defs only), one debug bridge .scd (authoring-only placement must follow current bundle exclusions) | supercollider/source, supercollider/dev |
| external-mode OSC protocol documented in the README, explicitly "not a PNDS-wide standard" | README §External OSC |
| Historical QR used LAN address; current released QR must prioritize full `PNDS_PERFORMER_URL` and the matched fallback contract | lib/qr.js, lib/network.js |
| output-bus contract: App-injected `PNDS_AUDIO_OUTPUT_BUS` else bus 0; malformed value fails start, never silently falls back | audio/osc-controller.js |
| group 1000 / node 1001 internal IDs; never attach to group 1 (sclang's, absent in bare scsynth) | audio |
| health `status:"ready"` + `projectId` match as the App's display signal; SIGINT/SIGTERM full teardown (`[shutdown] complete.`) | lib/health.js, lib/lifecycle.js |
| Historical shared page inferred role by port; full performer URL adaptation instead uses server-provided role and same-origin performer assets; keep runtime assets local | public/index.html |
| viewport `user-scalable=no, viewport-fit=cover` + standalone meta on the performer surface | public/index.html |
| `npm run check` (syntax over server + controllers + sketch) + `npm test` (regression) | package.json |

## Module layout (what Template reuse looks like composed)

`lib/` — players, config, audio-engine, osc-transport, health, network, qr, lifecycle. `audio/controller.js` — the work's audio semantics. `public/` — shared.js (constants), sketch.js (p5 visuals), client lib. One `server.js` composes it. This is the module reuse map (playbook §1) assembled; a cm1 port of comparable size should differ mainly in `controller.js`, `conductor.js`, and the two pages' content.

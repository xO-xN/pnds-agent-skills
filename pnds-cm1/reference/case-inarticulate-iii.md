# Reference shape — Inarticulate III

The calibration target for a pnds-cm1 output: a real, finished local-network PNDS work (v1.2.1, the reference implementation of the PNDS V1 project contract). It was hand-built rather than ported, so it shows the TARGET shape free of porting baggage. When in doubt what a cm1 output should look like, match this.

## Shape

- **One endpoint, no hub, no roles**: manifest has no `telematic` field; nothing to configure at runtime except audio mode/device. "A networked digital score for three performers."
- **Monitor page** (6869): landscape observation layout — center keeps the full interaction area; left panel shows the performance strategy (演奏规则 + performer tips, straight from the work's own instructions); right panel is a live OSC control-stream observer (every `/p*` address with its last sent value — in External mode those are the real OSC addresses, in Internal mode the same semantics mapped onto `/n_set`). The QR join code is served here.
- **Performer page** (6868): pick Player 1 / 2 / 3, then perform by touch — primary touch moves that performer's voice, a second simultaneous touch bends its PitchShift. When two performers come within threshold, the score draws a line between them and couples their sound.
- **No START**: the piece has no conductor timeline — performers self-start by touching. This is the P7/M2 boundary case: lifecycle controls exist **iff** the original work has them; this one doesn't, so it correctly has none. (A cm1 port whose sketch auto-runs or has explicit start controls lands on the other side of that iff.)

## Conventions worth copying

| convention | where |
|---|---|
| SynthDef name = file name = manifest entry (`inarticulate-iii`) | supercollider + manifest |
| one source .scd (defs only), one debug bridge .scd (never packaged) | supercollider/source, supercollider/dev |
| external-mode OSC protocol documented in the README, explicitly "not a PNDS-wide standard" | README §External OSC |
| QR built from `PNDS_HOST_IP` (App-injected LAN IPv4; manual runs fall back to first non-loopback) | lib/qr.js, lib/network.js |
| output-bus contract: App-injected `PNDS_AUDIO_OUTPUT_BUS` else bus 0; malformed value fails start, never silently falls back | audio/osc-controller.js |
| group 1000 / node 1001 internal IDs; never attach to group 1 (sclang's, absent in bare scsynth) | audio |
| health `status:"ready"` + `projectId` match as the App's display signal; SIGINT/SIGTERM full teardown (`[shutdown] complete.`) | lib/health.js, lib/lifecycle.js |
| shared single index.html: `PNDS_IS_MONITOR` by port; socket.io + p5 loaded via document.write cross-port; no CDN (performances run offline) | public/index.html |
| viewport `user-scalable=no, viewport-fit=cover` + standalone meta on the performer surface | public/index.html |
| `npm run check` (syntax over server + controllers + sketch) + `npm test` (regression) | package.json |

## Module layout (what Template reuse looks like composed)

`lib/` — players, config, audio-engine, osc-transport, health, network, qr, lifecycle. `audio/controller.js` — the work's audio semantics. `public/` — shared.js (constants), sketch.js (p5 visuals), client lib. One `server.js` composes it. This is the module reuse map (playbook §1) assembled; a cm1 port of comparable size should differ mainly in `controller.js`, `conductor.js`, and the two pages' content.

# Phase 4 — Conversion playbook 生成手册

Source of truth for platform contracts: the App's `docs/zh-CN/reference/` (manifest, structure, runtime-contract, pnds-bundle) and the PNDS Template itself. This playbook tells you what to reuse, what to write, and what the rules are per conversion target. The composed living reference for the target shape is Inarticulate III (`case-inarticulate-iii.md`).

## 0. Skeleton

1. Output directory: default `/Users/xiaoxiang/Coding/PNDS app 开发/<id>/` (sibling of the Template; the user's convention) unless the user names one. No git unless asked.
2. Copy the PNDS Template (`/Users/xiaoxiang/Coding/PNDS app 开发/PNDS Template`) wholesale except `node_modules`, `.git*`, `.DS_Store`.
3. Copy the original triple + instructions into `sources/` (never packaged — allowlist excludes it; the bundle's `docs/` exclusion also keeps the port map out of the runtime, which is intended).
4. Run the Template's own init flow (`docs/start.md`): set `id`, `name`, `version` 0.1.0, description, `tokenKey` = `<id>-token`, README, LICENSE, rewrite `docs/implementation.md` to describe THIS piece, update `docs/start.md`-declared identity spots. Keep ports 6868/6869.
5. `npm install` (npm only).

## 1. Module reuse map 模块复用清单

Before writing ANY module from scratch, check this table. Reuse beats reinvention — these modules are tested and contract-compliant.

| port need | reuse | notes |
|---|---|---|
| player join/claim/reconnect | `lib/players.js` (Template) | unchanged |
| seats persistence (seat ↔ client) | `lib/seats-store.js` | unchanged record shape (no role field here) |
| Socket.IO protocol semantics | `lib/protocol.js` | add events: seat/lifecycle/score (see §5) |
| config/CLI/env | `lib/config.js` | keep `--audio-mode`, `--osc-target` |
| scsynth boot + OSC primitives | `lib/audio-engine.js` + `lib/osc-transport.js` | unchanged; internal mode only |
| health endpoint | `lib/health.js` | unchanged |
| LAN IP / QR | `lib/network.js`, `lib/qr.js` | the join QR is baseline M4 |
| graceful shutdown | `lib/lifecycle.js` | unchanged |
| monitor theme/locale following | `lib/theme-follow.js`, `lib/locale-follow.js` | baseline M6 — wire them |
| browser client lib | `public/client.js` | unchanged; deadband send already built in |
| shared constants | `public/shared.js` | rewrite contents: events table, seats, control ids |
| work audio layer | **rewrite** `audio/controller.js` | the OSCdef semantics land here (§3) |
| score state machine + lifecycle | **new** `lib/conductor.js` | per-work, from the port map (§5) |
| performer/monitor pages | **rewrite** `public/performer.js`, `public/monitor.js` | p5 or plain DOM, per §4/§5 |

There is no hub leg, no role registry, no `telematic` manifest field in this architecture.

## 2. Players & seats

- Seat count from the port map (instructions + control evidence). `maxClients` for the registry = seat count.
- **Performer joining = player-ID picker**: phone scans the QR (or types the URL) → picks Player 1..N → server binds client↔seat (seats-store), applies `seatDefaults` (radio slot, fader defaults), serves the control page. Seat stays bound across reconnects via the claim token (baseline P6).
- Locking policy per port map (seat-locked radio vs free).
- **Monitor has NO identity picker**: no role card, no hub form, nothing to configure. The monitor's opening state is the score itself plus the QR and seat presence.

## 3. SuperCollider conversion

**Sources**: one `supercollider/source/<origname>.scd` per original file, containing ONLY SynthDefs (`.add`). Strip OSCdefs, `waitForBoot` scaffolding, server options, routines — their semantics are ported elsewhere (OSCdef → controller; routines → controller/conductor).

**SynthDef body policy: verbatim**, with only these mechanical edits:
1. Add/ensure an `out` control arg and replace fixed `Out.ar(0, x)` with `Out.ar(out, x)` (App bus discipline; controller passes `PNDS_AUDIO_OUTPUT_BUS + channel - 1`).
2. Nothing else. If the design seems to need more, that's a known delta — record it, don't hide it.

**Naming contract** (no exceptions): `SynthDef('name', …)` symbol = scsyndef filename = manifest `audio.synthdefs` entry. Dashed names need quoted symbols.

**Compile**: prefer sclang directly —

```sh
/Applications/SuperCollider.app/Contents/MacOS/sclang <file>.scd   # or PATH sclang
```

The .scd must be compile-safe standalone (SynthDefs with `.add`; no language-side state). If sclang is missing → leave compilation to the user via App → 设置 → 开发者工具 → 编译 SynthDef, and say so explicitly in the handoff (packaging REQUIRES the scsyndef files present).

**Controller translation** (`audio/controller.js`), per OSCdef from the port map:
- Control id (`fader3`) + args → `synth.set` / engine calls, preserving the original's mapping math exactly (scalings, `linexp` ranges, defaults).
- Button gate semantics (spawn on >0.5, release on ≤0.5 with the original's release time) → voice lifecycle in the controller.
- Radio swap (release + respawn + defaults) → per the voice-model ruling: per-seat voices (each client owns its synth instance(s), node IDs from the engine's scheme) or one shared voice (arbitrate writes; document the arbitration in the port map).
- XY: two-float control, apply the original's per-axis mappings.

**Manifest audio block**: `defaultMode: "internal"`, `supportedModes: ["internal","external","none"]`, `outputChannels` from port map, `audioBusChannels >= 2 × outputChannels` (e.g. 64), `synthdefs` lists every scsyndef, `blockSize` 64. **No `telematic` field — ever.**

**Optional A/B debug bridge**: adapting the original .scd (with its OSCdefs) into `supercollider/debug/` lets the user run external mode against the original sound for comparison. Encourage it when sound fidelity is in doubt; it is never packaged.

## 4. Performer UI conversion (TouchOSC → web)

Map per control (port map §3 is the authority):

| TouchOSC | web |
|---|---|
| FADER | vertical range slider, same 0–1 range |
| BUTTON (toggle) | toggle button, same 0/1 |
| XY | 2D pad, x/y normalized, same arg order |
| RADIO (N steps) | N-segment selector, same INTEGER (or 0–1 float) semantics |
| PAGER | tabs (pages become tabs) |
| LABEL (with text) | caption; empty labels dropped |

- Control ids keep the original names (`fader3`) — they are the Socket.IO control payload ids; shared.js carries the events + ids table.
- Layout: mirror page structure and rough spatial arrangement (frames are in the parser output); visuals are web-native (CSS), NOT a TouchOSC skin. Fidelity order puts interaction above pixel layout.
- **Style inheritance 风格沿用 (baseline P9)**: the page's palette and design language come from the original p5 sketch — extract its colors/character in Phase 2 and carry them into the CSS. The performer page should read as the same work as the monitor, not as generic Template chrome.
- Send path: `public/client.js` deadband `control` events → server → controller. Never let the phone talk OSC directly.
- Orientation 方向（responsive by default）: the first version NEVER forces portrait or landscape — build the page usable in BOTH orientations (DOM controls reflow; canvas letterboxes and rescales). The original TouchOSC layout's implied orientation goes into the port map as a layout-proportion hint only. A blocking "rotate your device" overlay is forbidden.
- **Multi-touch 多点触控 (mandatory, baseline P4)**: TouchOSC players routinely drive several controls simultaneously, so simultaneous input is interaction fidelity, not polish. Beware: one p5 canvas driven by `mousePressed`/`mouseDragged` is single-touch on phones — p5 maps only the first touch to mouse events. Two compliant implementations:
  - DOM controls (preferred when the control set maps to sliders/buttons/pads): native elements track each finger independently — multi-touch for free.
  - p5 canvas controls: handle `touchStarted`/`touchMoved`/`touchEnded`, iterate the WHOLE `touches` array each event, hit-test every active touch, and track `touch.id` → control so a gesture keeps the control it grabbed. The Template's `performer.js` is the reference pattern. Add `touch-action: none` and `user-select: none` on the touch surface, or the browser steals the second finger for scrolling/pinch-zoom.
- Both platform rules are the App's own contract, not just this skill's taste — `docs/{zh-CN,en}/reference/page-interaction.md` (performer 页): 触屏、多点触控、横竖屏自适应全部可用，完全由工程自理，用标准 viewport 与响应式布局适配。 Same doc's discipline: keep persistent interaction state in relative/normalized coordinates so an orientation or size change never strands it in old pixels.
- **Shared index.html discipline（共享 HTML 纪律）**: one index.html serves BOTH ports, so role-specific DOM must be created or revealed only by its role's script. Never ship a role-specific element the other role's script doesn't know about — an orphan overlay on the wrong port is an invisible fullscreen click-blocker. Rules for every fullscreen overlay (`position:fixed; inset:0`): (a) start with the `hidden` class, (b) populate BEFORE showing — an empty visible overlay is a black screen, (c) exactly one owning script is responsible for show/hide.

## 5. Monitor / conductor conversion (p5 → monitor page)

- **Transplant logic, adapt I/O**: copy constants, section tables, timing values, geometry and drawing logic from the original sketch into `public/monitor.js` as faithfully as the container allows. Replace the sketch's input layer with server events; the monitor renders server-authoritative score state, never its own private timeline.
- **Lifecycle controls (baseline M2/M3)**: per the port map ruling — ported-as-is (the sketch's own start/transport, verified working), explicitized (START button replacing auto-run; the page must not begin performing the moment the session loads), or user-ruled-duration (the asked-for end wraps the performance: release synths, render the end state). The START surface must be usable WITHOUT a keyboard (a button on screen); keyboard shortcuts are an additional channel, never the only one.
- **QR + presence (baseline M4/M5)**: render the join QR (server's `/qr` endpoint, `PNDS_HOST_IP`-based) and the seat registry (who is in which seat), so the operator can confirm the ensemble before START. An instructions/strategy panel beside the score (Inarticulate III's left panel pattern) is recommended when the original has performer-facing rules worth showing.
- **No native JS dialogs, anywhere**: `alert` / `confirm` / `prompt` are forbidden on both pages. The App's monitor is a WKWebView iframe that does not implement the JS text-input panel — `prompt` silently no-ops inside the App while working in a desktop browser, a divergence local testing will not catch. All interaction and text input is in-page DOM UI.
- **Keyboard safety 键位安全区**: before transplanting the sketch's `keyPressed` handlers, check EVERY binding against the App's `page-interaction.md` tables — plain characters/digits, `⇧`/`⌥` combos and `F1`–`F12` are the safe zone; avoid `⌘`-anything (native menu accelerators never yield — `⌘W`/`⌘Q`/`⌘M`/`⌘O`/`⌘R`/… reserved forever, and future App versions may add more); macOS system combos (`⌘Tab`, `⌘Space`, screenshots) are unusable in any web page. Remap unsafe keys to safe ones and record each remap in the port map (§4 key-map line). Table-B conditional keys are usable but yield when the page lacks focus — if one carries a performance-critical action, focus an element at page open.
- Monitor runtime obligations (runtime-contract §10 — all mandatory, baseline M7): iframe-embeddable (no X-Frame-Options blocking), resize-safe canvas (update drawing buffer + coordinate mapping on viewport resize; keep interactive state in normalized coordinates), keep the top-center strip free of critical UI (App window title/drag overlay), tolerate `?theme=`/`?lang=` params, wire `theme-follow.js`/`locale-follow.js`.
- Score state lives in `lib/conductor.js` on the SERVER (lifecycle flags, section index + anchors, node/sector states); monitor and performer pages are views. p5 is the natural rendering lib (already bundled in the Template) but plain DOM/canvas is fine.

## 6. server.js wiring

Keep the Template composition shape: two Express servers (6868/6869), static public/, `/__config.js`, `/__pnds/health` (performer port mandatory), `/qr` (monitor), theme/locale bridge scripts (monitor), Socket.IO on performer server, registry + seats + audio engine + controller + conductor, lifecycle shutdown. Health payload per runtime-contract §5; `projectId` = manifest id.

**Cold-connect replay 冷连接补发** (mandatory): every new socket receives `state` and `conductorState` immediately on connection — don't rely on event-driven broadcasting alone. A fresh phone hitting a fresh server (nothing has happened yet, no join, no config change) must still receive enough state to render its page. Same duty on the page side: the page must be able to render a waiting state from the initial snapshot, never a blank screen (baseline P1).

## 7. Tests

Keep the Template's lib tests green. Add (node --test, injected-transport style like `controller.test.js`):

- controller mapping: control id + value → expected synth args (including scaling math, defaults per seat, button gate transitions, radio swap sequencing).
- conductor/lifecycle: start → running → end wraps (synths released, end-state flag); transport permissions.
- seats: seat pick → defaults applied; claim token rebinds after reconnect (restore).
- integration: boot `--audio-mode none`, health ready, join → seat → control reaches controller.

Sound correctness is NOT automated — the handoff checklist covers it by ear.

## 8. Definition of done (Phase 4+5)

In order — the cold-open walkthrough and baseline audit gate packaging:

1. `npm run check` green; `npm test` green (new logic carries new tests).
2. sclang compile produced every manifest scsyndef.
3. `node server.js --audio-mode none` reaches health `ready`.
4. **Cold-open walkthrough 双页冷开走查** — open `http://127.0.0.1:6868/` and `http://127.0.0.1:6869/` in a real browser with cleared storage (incognito), against the running none-mode server, and verify by LOOKING at the rendered pages (browser automation if available; screenshots count):
   - monitor: the score renders cold with the lifecycle controls visible and clickable; the QR is visible; no dark layer sitting above content.
   - performer: the waiting card appears WITHOUT any prior interaction (fresh system, nothing joined yet — a "waiting" card is acceptable, a blank/black page is not); after picking a player ID, controls appear.
   - performer multi-touch + orientation: on a phone (mark PENDING for the user if no device is available) hold one control while moving another — both track simultaneously — and check the page is usable in both portrait and landscape; on the desktop browser confirm no rotate/orientation overlay traps the landscape window (§4 rule).
   - reload both pages (warm path) and re-check.
   A node test suite cannot see CSS stacking, DOM gating or z-order — this walkthrough is the ONLY gate that catches "black screen" class bugs. Do not package before it passes. If no browser is available to the agent, run the static audit below and mark the walkthrough as PENDING in the handoff for the user.
5. **Static overlay audit**: check the shared index.html — every `position:fixed` fullscreen container starts `hidden`, is populated before being shown, and has exactly one owning script (see §4 discipline).
6. **Output-baseline audit 输出基准审计** — walk M1–M7 and P1–P9 in `reference/output-contract.md`; each item passes or carries a port-map §11 N/A row. Nothing blank.
7. `node <skill>/tools/pack.mjs <project>` produced `<name>-<version>.pnds` + sha256.
8. Port map has zero unresolved rows; handoff report written.

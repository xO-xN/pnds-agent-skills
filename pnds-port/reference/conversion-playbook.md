# Phase 4 — Conversion playbook 生成手册

Source of truth for platform contracts: the App's `docs/zh-CN/reference/` (manifest, structure, runtime-contract, supercollinder, pnds-bundle) and the PNDS Template itself. This playbook tells you what to reuse, what to write, and what the rules are per conversion target.

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
| seats persistence (seat ↔ client) | `lib/seats-store.js` | extend the stored record with role |
| Socket.IO protocol semantics | `lib/protocol.js` | add events: role/seat/conductor/hub (see §6) |
| config/CLI/env | `lib/config.js` | keep `--audio-mode`, `--osc-target` |
| scsynth boot + OSC primitives | `lib/audio-engine.js` + `lib/osc-transport.js` | unchanged; internal mode only |
| health endpoint | `lib/health.js` | unchanged |
| LAN IP / QR | `lib/network.js`, `lib/qr.js` | unchanged |
| graceful shutdown | `lib/lifecycle.js` | unchanged |
| monitor theme/locale following | `lib/theme-follow.js`, `lib/locale-follow.js` | optional but cheap — wire them |
| hub client | **adapt** Telematic-Network-Diagnostics `lib/hub-leg.js` | strip the probe burst to a slow heartbeat; keep reconnect, `hub:config` handling, token-never-echoed discipline |
| browser client lib | `public/client.js` | unchanged; deadband send already built in |
| shared constants | `public/shared.js` | rewrite contents: events table, roles, control ids |
| work audio layer | **rewrite** `audio/controller.js` | the OSCdef semantics land here (§3) |
| conductor state machine | **new** `lib/conductor.js` | per-work, from the port map (§5) |
| role registry | **new** `lib/roles.js` | per-work: role defs, seat counts, control sets |
| performer/monitor pages | **rewrite** `public/performer.js`, `public/monitor.js` | p5 or plain DOM, per §4/§5 |

## 2. Roles, seats, identity

- `lib/roles.js`: the port map's role table as data — `{ id, name, seats, synthdefs, controls, seatDefaults(seat) }`.
- **Monitor opening = role picker**: the "开场身份输入". First screen lists roles (from `lib/roles.js`), plus hub config (url/token/room/node). Persist in `localStorage` (key `<id>-endpoint-config`); re-ask only via an explicit "change role" control. Server applies the role to: enabled SynthDef set, performer UI variant, conductor permissions.
- **Performer joining = seat picker**: phone opens performer URL → picks seat number within the endpoint's role → server binds client↔seat (seats-store), applies `seatDefaults` (radio slot, fader defaults), serves the role's control page. Seat stays bound across reconnects via the claim token.
- Locking policy per port map (seat-locked radio vs free).
- `maxClients` for the registry = max seats across roles.

## 3. SuperCollider conversion

**Sources**: one `supercollider/source/<role>-<origname>.scd` per original file, containing ONLY SynthDefs (`.add`). Strip OSCdefs, `waitForBoot` scaffolding, server options, routines — their semantics are ported elsewhere (OSCdef → controller; routines → controller/conductor).

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
- Radio swap (release + respawn + defaults) → per the voice-model ruling: per-seat voices (each client owns its synth instance(s), node IDs from the engine's scheme) or one shared voice per endpoint (arbitrate writes; document the arbitration in the port map).
- XY: two-float control, apply the original's per-axis mappings.
- Multi-role: the controller routes by the endpoint's role; only the role's SynthDefs get instantiated (all defs are loaded/declared regardless — universal bundle).

**Manifest audio block**: `defaultMode: "internal"`, `supportedModes: ["internal","external","none"]`, `outputChannels` from port map, `audioBusChannels >= 2 × outputChannels` (e.g. 64), `synthdefs` lists EVERY role's scsyndef, `blockSize` 64.

**Manifest networked fields (App v1.4.0, hub-synced works)**: declare the App's networked-capability boolean so v1.4.0+ shows the 「节点」 settings section and injects the four hub env vars at session start; optionally add the performer-address string field (a readable connect address such as `mywork.local` that replaces the injected LAN IP on the QR/monitor when present; absent → today's IP fallback, zero project change). Field names live in the App's `docs/zh-CN/reference/manifest.md` — read it at generation time and use its current names (they were still being finalized while v1.4.0 was in flight; older Apps silently ignore unknown manifest fields, so declaring early is safe). The room is derived by the App as `{manifest.id}_{分组号}` — the project never invents room names.

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
- Send path: `public/client.js` deadband `control` events → server → controller. Never let the phone talk OSC directly.
- Performer page shows: role-appropriate controls, seat identity, and any conductor affordances the port map assigns to performers (e.g. "tap my node" during open-listening sections).
- Orientation 方向（responsive by default）: the first version NEVER forces portrait or landscape — orientation enforcement is a creator decision for later iterations (requested via the port map), not a port default. Build the page usable in BOTH orientations (DOM controls reflow; canvas letterboxes and rescales). The original TouchOSC layout's implied orientation goes into the port map as a layout-proportion hint only. A blocking "rotate your device" overlay is forbidden in the first version: desktop browsers open the performer URL in landscape windows and would sit trapped on the hint (a real run hit exactly this — the Template's rotate overlay is that piece's own creator choice, not a pattern to copy).
- **Multi-touch 多点触控 (mandatory on the performer page)**: TouchOSC players routinely drive several controls simultaneously (hold a fader while working the XY pad), so simultaneous input is interaction fidelity, not polish. Beware: one p5 canvas driven by `mousePressed`/`mouseDragged` is single-touch on phones — p5 maps only the first touch to mouse events. Two compliant implementations:
  - DOM controls (preferred when the control set maps to sliders/buttons/pads): native elements track each finger independently — multi-touch for free.
  - p5 canvas controls: handle `touchStarted`/`touchMoved`/`touchEnded`, iterate the WHOLE `touches` array each event, hit-test every active touch, and track `touch.id` → control so a gesture keeps the control it grabbed (grab rules gate only NEW touches). The Template's `performer.js` is the reference pattern (`faderTouchIds` Map + `switchTouchIds` Set). Add `touch-action: none` and `user-select: none` on the touch surface, or the browser steals the second finger for scrolling/pinch-zoom.
- **Shared index.html discipline（共享 HTML 纪律）**: one index.html serves BOTH ports, so role-specific DOM must be created or revealed only by its role's script. Never ship a role-specific element the other role's script doesn't know about — an orphan overlay on the wrong port is an invisible fullscreen click-blocker (a real run shipped exactly this bug: the performer's seat overlay rendered on the monitor page and swallowed every input). Rules for every fullscreen overlay (`position:fixed; inset:0`): (a) start with the `hidden` class, (b) populate BEFORE showing — an empty visible overlay is a black screen, (c) exactly one owning script is responsible for show/hide.

## 5. Monitor / conductor conversion (p5 → monitor page)

- **Transplant logic, adapt I/O**: copy constants, section tables, timing values, geometry and drawing logic from the original sketch into `public/monitor.js` as faithfully as the container allows. Replace the sketch's input layer (keyboard identity selection etc.) with server events; the monitor renders server-authoritative conductor state, never its own private timeline.
- **No native JS dialogs, anywhere**: `alert` / `confirm` / `prompt` are forbidden on both pages. The App's monitor is a WKWebView iframe that does not implement the JS text-input panel — `prompt` silently no-ops inside the App while working in a desktop browser, a divergence local testing will not catch. All interaction and text input (identity, hub config, seat names) is in-page DOM UI: forms, cards, pickers.
- Monitor runtime obligations (runtime-contract §10 — all mandatory): iframe-embeddable (no X-Frame-Options blocking), resize-safe canvas (update drawing buffer + coordinate mapping on viewport resize; keep interactive state in normalized coordinates), keep the top-center strip free of critical UI (App window title/drag overlay), tolerate `?theme=`/`?lang=` params. Wire `theme-follow.js`/`locale-follow.js` if the visuals use theme-appropriate colors (recommended).
- Opening flow: role picker + hub form (see §2/§6) → conductor view. Include per authority ruling: start/advance/reset controls (conductor-role mode) or synchronized start affordance (all endpoints), plus "change role", hub status, endpoint presence list.
- Conductor state lives in `lib/conductor.js` on the SERVER (section index + anchors, node/sector states, permissions); monitor and performer pages are views. p5 is the natural rendering lib (already bundled in the Template) but plain DOM/canvas is fine.

## 6. Hub sync layer

Adapt TND's `lib/hub-leg.js`:

- Connect: `{ auth: { token, room, node } }`, `reconnection: true`. Config precedence (TND's frozen env contract, App-injected since v1.4.0 when the manifest declares the capability): env `PNDS_NODE_ID` / `PNDS_HUB_URL` / `PNDS_HUB_TOKEN` / `PNDS_HUB_ROOM` present → they PREFILL the monitor form and are the working defaults (fresh env beats stale localStorage); a manual form submission overrides for the session (probe use) and persists to localStorage for App-less runs; env absent → localStorage, else empty form. Never require the env — standalone `node server.js` with terminal env or a hand-filled form must keep working.
- The monitor's hub status shows the FULL effective room name and node id — the App's settings UI displays only the room group number, so the project's monitor is where operators confirm every endpoint landed in the same derived room.
- Emit via `relay`: conductor events from the port map's sync set (`start`/`section`/`tap`/`reset`), plus a slow `presence` heartbeat (e.g. 1–5 s) with role + seat count. The hub stamps `{from, hubReceivedAt}`; recipients trust `from`.
- Receive: apply OTHER endpoints' events to the local conductor state (idempotent application; ignore own-origin events via `from`).
- **Convergence after reconnect**: on `reconnected`/`welcome`, every endpoint broadcasts a `snapshot` `{sectionIndex, nodeStates, startedAt}` once; each endpoint adopts the most advanced sectionIndex it sees. Do not build a fancier consensus — the hub is stateless by design.
- **Local autonomy**: hub unreachable ⇒ conductor continues locally, monitor shows "遥现中断", everything local keeps working (this is also the single-endpoint rehearsal mode). No auto-freeze.
- Clock: anchor continuous visuals on receipt time of section events; no clock-sync protocol (ADR-0003).

## 7. server.js wiring

Keep the Template composition shape: two Express servers (6868/6869), static public/, `/__config.js`, `/__pnds/health` (performer port mandatory), `/qr` (monitor), theme/locale bridge scripts (monitor), Socket.IO on performer server, registry + seats + audio engine + controller + conductor + hub leg, lifecycle shutdown (also disconnect the hub leg). Health payload per runtime-contract §5; `projectId` = manifest id.

**Cold-connect replay 冷连接补发** (mandatory): every new socket receives `state`, `conductorState` and `hubState` immediately on connection — don't rely on event-driven broadcasting alone. A fresh phone hitting a fresh endpoint (nothing has happened yet, no join, no config change) must still receive enough state to render its page. A real run shipped without this and performer pages stayed black forever on a cold system: the seat card waited for a `conductorState` that only fired on the next unrelated event. Same duty on the page side: the page must be able to render a waiting state from the initial snapshot, never a blank screen.

## 8. Tests

Keep the Template's lib tests green. Add (node --test, injected-transport style like `controller.test.js`):

- controller mapping per role: control id + value → expected synth args (including scaling math, defaults per seat, button gate transitions, radio swap sequencing).
- conductor: section transitions, authority permissions (who may emit what), snapshot convergence.
- roles/seats: seat pick → defaults applied; role → enabled synth set.
- hub-leg (adapted from TND's `hub-leg.test.js`): relay round-trip with stamps, reconnect behavior.
- integration: boot `--audio-mode none`, health ready, join → seat → control reaches controller.

Sound correctness is NOT automated — the handoff checklist covers it by ear.

## 9. Definition of done (Phase 4+5)

In order — the cold-open walkthrough gates packaging:

1. `npm run check` green; `npm test` green (new logic carries new tests).
2. sclang compile produced every manifest scsyndef.
3. `node server.js --audio-mode none` reaches health `ready`.
4. **Cold-open walkthrough 双页冷开走查** — open `http://127.0.0.1:6868/` and `http://127.0.0.1:6869/` in a real browser with cleared storage (incognito), against the running none-mode server, and verify by LOOKING at the rendered pages (browser automation if available; screenshots count):
   - monitor: the config card is visible, clickable and typeable — role selectable, hub fields accept text, no dark layer sitting above the card; after confirm, the conductor view renders.
   - performer: the seat card appears WITHOUT any prior interaction on another page (fresh system, no role configured yet — a "waiting" card is acceptable, a blank/black page is not); after the monitor picks a role, a seat can be picked and controls appear.
   - performer multi-touch + orientation: on a phone (mark PENDING for the user if no device is available) hold one control while moving another — both track simultaneously — and check the page is usable in both portrait and landscape; on the desktop browser confirm no rotate/orientation overlay traps the landscape window (§4 rule).
   - reload both pages (warm path with stored config) and re-check.
   A node test suite cannot see CSS stacking, DOM gating or z-order — this walkthrough is the ONLY gate that catches "black screen" class bugs. Do not package before it passes. If no browser is available to the agent, run the static audit below and mark the walkthrough as PENDING in the handoff for the user.
5. **Static overlay audit**: check the shared index.html — every `position:fixed` fullscreen container starts `hidden`, is populated before being shown, and has exactly one owning script (see §4 discipline).
6. `node <skill>/tools/pack.mjs <project>` produced `<name>-<version>.pnds` + sha256.
7. Port map has zero unresolved rows; handoff report written.

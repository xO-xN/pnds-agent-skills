# Pulse Field — author-confirmed PNDS initial implementation

Status: actual user confirmed “确认，按上述方案完成验收案例” on 2026-10-14; initial editable implementation delivered. The precise approved scope is recorded in evidence/pulse-author-confirmation.json and projects/pulse-field/docs/decisions.md. Input: inputs/browser-source, SHA256 ledger inputs-preservation.json. Target: PNDS App 1.6.1 development contract, protocol 1; installed/released capability and hardware still need verification.

## Confirmed implementation scope

Use one local PNDS Host, monitor operator START and an observation-only performer page. Preserve the original widening block (100px height, cyan #61d9ed, width 100→600px), dark #112033 background and twelve-second visual duration. Preserve repeated START's overlapping twelve-second tones and restarted visual clock; do not change it into one-shot, ignore repeated clicks, add seats, roles, hub, QR, faders or a different interaction. This approved acceptance case has one local monitor operator; performer is observation-only. No additional monitor synchronization policy is introduced. Return editable source and records only; no ordinary package.

The user chose Internal synthesis: authorable SC sine SynthDef with frequency 220Hz and gain 0.05, each START owns its own node in the project's owned group and ends after twelve seconds. No unapproved envelope smoothing or pitch/timbre change; original hard start/stop can click, so audition the direct equivalent before proposing a fade. The user explicitly chose MONO outputChannels=1, replacing the original provisional stereo proposal. Actual device routing and source reference playback still require audition. Use App-injected private output bus and effective channel count; never write directly to hardware bus or start independent scsynth. App master gain and output-device path are technical differences from browser destination; perceived loudness/timbre and sample-timing equivalence are pending measured comparison.

## Files and technical flow

Prepare schema-1 manifest with stable new project identity, two distinct server ports, Internal only (None will not silently drop original sound), outputChannels=2, compiled SynthDef path and adequate scsynth buses. Provide Node24 server, performer/monitor assets, declared local production dependencies, editable SC source and compiled .scsyndef when compilation is available. Host provides audio target/private bus/count; project loads compiled assets and creates owned group before health ready. Each monitor START reaches project server directly; server delivers tone event and original visual start semantics. Health reflects listener/audio readiness and matching id/ports; SIGINT/SIGTERM release owned nodes/group/timers/sockets/listeners. No Host Rust/React performance bridge or new protocol fields.

Record original source provenance/license, author decisions and their scope, exact file hashes/revisions, sound/visual/interaction/time mapping and validation limitations in source docs. If compilation/runtime assets are missing, preserve editable work and report the precise blocked check; never create a placeholder compiled artifact or mark distribution ready.

## Actual author decisions and deferred acceptance

1. Internal route replacing browser AudioContext, with 220Hz/gain0.05/direct twelve-second sine behavior and mandatory original-versus-PNDS audition. Author supplies acceptable loudness/timbre/timing tolerance; no generic fidelity priority chooses it.
2. Local monitor owns START; performer is observation-only; preserve overlapping repeated START/reset behavior. Clarify whether multiple monitor windows may initiate starts and whether reload resumes visuals or shows stopped (original reload is stopped).
3. Explicit mono output; verify actual reference routing and levels against original browser playback and performance device.
4. Initial editable source only, with actual App opening, compilation/audio readiness, browser cold/warm/fullscreen/resize, phones if later joining is chosen, sound and performance tests recorded individually. Distribution is a separate explicit task.

## Alternatives and constraints

External is viable only with an author-selected replacement engine and defined OSC mapping reproducing this sine/start/stop/routing behavior; its installation/output-device/master path remain outside the App. None does not preserve the source tone and is not approved. Running unmanaged browser sound under a Host mode is unresolved, so it is not silently selected. No source license or artistic tolerances are established by the tiny fixture README.

## Acceptance before declaring conversion complete

Verify unchanged source baseline; author-confirmed decision record; compiled artifact and source mapping; private-bus/owned-group/readiness/shutdown tests; actual App creation opening and session under bundled Node; audible comparison to source with repeated START/end/reload behavior; visual/timing comparison and measured monitor-copy behavior; accurate source handoff with remaining native/device checks. The actual author confirmation, editable source, compiled artifact, public controlled HTTP/UDP checks and handoff are now completed. Native sound/device/performance acceptance remains deferred by the user.

Environment: Codex collaboration capability_acceptance subagent; inherited exact model identifier is not exposed. Native Skill invocation is unavailable; the seven selected entries and their independent capability/reference files were read directly. Each Skill directory was independently copied without sibling installation, and public helpers executed from those isolated directories. Resource manifests/hashes and actual commands are in evidence/harness.json and per-case JSON. App target is the explicitly supplied 1.6.1 DEVELOPMENT corpus, Host protocol 1; this is not an installed or released App claim. Node v24.19.0 (PATH), macOS arm64. Actual App creation opening, bundled Node, WKWebView, phones, sound/devices and performance remain unverified by this harness; the user deferred native/device acceptance this turn.


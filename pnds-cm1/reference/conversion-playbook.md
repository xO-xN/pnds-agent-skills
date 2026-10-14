# CM1 implementation / 课程生成

After the author confirms the plan, follow bundled runtime/module capabilities and the installed App manual. Choose a user-authorized output directory. Obtain a versioned starter explicitly if useful; no Template sibling checkout is assumed. New work sets its own identity; modifying a course project preserves existing id/token/storage recovery.

## Structure and audio

Prepare the declared entry/working directory, both HTTP servers, performer health and project-owned resources. Production dependencies are local at runtime. Use a discovered sclang for compiled SynthDefs; runtime never needs sclang. Retain source bodies and mapping math; adapt Internal output bus to `PNDS_AUDIO_OUTPUT_BUS` and channel count. Any audible difference is an author decision. All declared synthdefs must exist for distribution even if the current smoke uses None.

CM1 remains a local Mac plus LAN phones, no hub/roles/telematic. The work's voice model determines per-player or shared synths; the player-ID UI is not an audio ownership rule. OSCdef/routine semantics move into project logic with confirmed mappings and timing.

## Released modules and wiring

Read each selected release's README/compatibility metadata before importing. Standard QR resolves the full Host performer URL before LAN fallback; serve the actual QR image route on monitor and render its address/label. Players handles technical join/recovery; the work supplies player-ID policy and controls. Theme/locale are monitor-only scripts with optional first-frame/message adaptation. Monitor-state is view synchronization, not the conductor score state. Use the real provided code and public API; preserve provenance/creator tasks.

The module set does not include a multitouch module. Implement performer gestures in the work's pages. Track each touch/pointer identity independently, preserve simultaneous controls and normalized coordinates through portrait/landscape resize; avoid orientation-blocking overlays.

## Course pages and lifecycle

Monitor opens directly to score, QR and player presence. Visible START triggers the confirmed lifecycle; bounded end releases the work's resources and renders an end state. Port optional pause/reset/jump only if the original has them. Keyboard bindings respect the matched App page contract and also have visible controls where course flow needs them.

Phones scan, choose player ID, receive defaults and controls. Cold connection has enough initial state to render without a prior event; lock/unlock, reload and reconnect restore according to the original/confirmed policy. Clear shared-page overlays must have one owning script and start hidden until populated. Native JS dialogs are inappropriate for embedded text entry; use in-page controls. Preserve the p5 visual language or record an author-approved deviation.

## Course validation gate

Run the project's checks and changed-behavior tests. Exercise real join/player selection/control/recovery, lifecycle START → bounded end, resources/stop and None-mode health. Use `tools/smoke.mjs` only for explicit execution; it checks None, not sound.

Observe both pages cold with cleared test storage in an actual browser and warm after reload. Monitor score/START/QR/presence must render; performer must show waiting/player choice and then controls. Inspect overlays and both desktop viewport orientations. Real phone simultaneous touch, portrait/landscape, sleep/reconnect, real audio per player and App shortcuts/embedding are separate acceptance evidence.

Audit every M/P item in [output contract](output-contract.md) as passed or evidence-backed N/A; pending is not passing. Missing browser/audio/device/compiler access remains explicit. Return source/progress rather than falsely marking course completion. Course source-plus-bundle delivery retains checks/assets/structure/SHA256 and installation verification; [packaging](packaging.md) and the generic validation capability explain the tool boundary.

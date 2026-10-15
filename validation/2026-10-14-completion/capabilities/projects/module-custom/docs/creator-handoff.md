# Creator handoff

- [ ] existing-caption: Rename the monitor caption to “Shared cyan bar”; preserve the performer wording and START.

- [x] qr-wiring: Copied fixed QR 0.2.0 source; added declared qrcode 1.5.4; wired server route/config/full URL and monitor QR/label, preserving existing-caption task above.
- [x] qr-http: Actual HTTP tests passed for fallback/full URL/invalid credentials; macOS Vision independently decoded generated 480px PNG, full decoded destination returned original performer wording; startup/shutdown checked. These are Node/HTTP/image tests, not browser/phone/native observations.
- [ ] qr-app-open: Open /tmp/pnds-161-workflow-results/qr-piece in App 1.6.1 creation mode with None, choose intended LAN IP and confirm embedded monitor/performer. Acceptance: original caption/START/wording, QR/label share actual performer URL; runtime runs under bundled Node 24.18.1. Not yet observed.
- [ ] qr-phone: On intended LAN scan displayed QR with real phone, verify same piece and inspect layout/resize/fullscreen. If trusted HTTPS is enabled, verify complete URL and origin; identity tokens are origin-scoped and protocol/domain/port changes join anew. No claim of phone acceptance.

Source-only validation evidence is recorded in docs/validation.md; any later explicitly authorized distribution has a separate report at /tmp/pnds-161-workflow-results/reports/case08b-distribution.md. Existing-score-claim-v1 remains byte-preserved in public/shared.js; the fixture never wired actual seat recovery, so no recovery feature is claimed.

- [x] qr-source-validation: Reviewed static subset and isolated None health/shutdown smoke passed; source-only handoff has no .pnds. Actual App creation-mode opening remains pending as listed above.


## Current completion task — 2026-10-14

This is a saved portable acceptance fixture. Earlier absolute paths in inherited records are historical evidence pointers, not runtime dependencies. Current executable project: /tmp/pnds161-acceptance-projects/module-custom. Current evidence: validation/2026-10-14-completion/capabilities/evidence in the maintenance repository. Native App/device acceptance is deferred by the user and has not occurred.

- [x] completion-node-runtime: Exact saved pages served via actual LAN; matching None health and graceful shutdown observed.
- [ ] completion-app-open: User starts App environment; open this saved source in creation mode and inspect monitor/performer under bundled runtime.
- [ ] completion-devices: Perform any applicable browser, resize/fullscreen, phone and venue performance checks.

Current custom fork version is 0.4.4 (was 0.4.3): content differs from the earlier distributed source. Stable existing-score identity preserved; no package produced in this maintenance task.

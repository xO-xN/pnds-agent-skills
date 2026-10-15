# Validation — 2026-10-14

Environment: portable Codex collaboration subagent; inherited model, exact model ID unavailable. Native Skill invocation unavailable; pnds-create 0.2.0 SKILL.md and bundled assess/runtime/validate capabilities read directly. Resource and corpus hashes are in ../evidence/inputs-before.json from the results root. Manual: PNDS App 1.6.1 explicit DEVELOPMENT snapshot; Host protocol 1. Runtime checks use PATH Node v24.19.0, not App bundled Node 24.18.1.

- Static structure: passed helper subset (manifest, containment, modes, dependencies). Command/evidence: case01-structure.json.
- Automated behavior: passed `npm run check`, 2 tests. Real controller code evaluated with fake DOM and controlled animation clock: no frame before START; running at 50% after 6000ms; 100% after 12000ms; no frame remains after stop. This is code behavior, not browser paint/performance acceptance. Evidence: case01-check.json.
- None health/shutdown: first sandbox attempt failed EPERM binding localhost; the explicitly authorized escalation passed on an isolated copy using helper-selected free ports. Matching project, ports, disabled audio, null target/errors; child exit confirmed. Evidence: case01-none-smoke.json and case01-none-smoke-authorized.json.
- Real browser cold/warm rendering, App creation-mode opening, App bundled runtime, native embedding/fullscreen/resize, phone/device observation and venue timing: not run; manual acceptance pending.
- Sound/device: not applicable to chosen None; no sound proven.
- Distribution and installation: not run; not requested. No .pnds generated.

Inputs and exact commands/output are recorded outside the project at /tmp/pnds-161-workflow-results/evidence. Final saved source hashes are in outputs-final.json. Structure checked; creation-mode opening not yet verified.


## Current completion task — 2026-10-14

This is a saved portable acceptance fixture. Earlier absolute paths in inherited records are historical evidence pointers, not runtime dependencies. Current executable project: /tmp/pnds161-acceptance-projects/runtime-new. Current evidence: validation/2026-10-14-completion/capabilities/evidence in the maintenance repository. Native App/device acceptance is deferred by the user and has not occurred.

Environment: Codex collaboration capability_acceptance subagent; inherited exact model identifier is not exposed. Native Skill invocation is unavailable; the seven selected entries and their independent capability/reference files were read directly. Each Skill directory was independently copied without sibling installation, and public helpers executed from those isolated directories. Resource manifests/hashes and actual commands are in evidence/harness.json and per-case JSON. App target is the explicitly supplied 1.6.1 DEVELOPMENT corpus, Host protocol 1; this is not an installed or released App claim. Node v24.19.0 (PATH), macOS arm64. Actual App creation opening, bundled Node, WKWebView, phones, sound/devices and performance remain unverified by this harness; the user deferred native/device acceptance this turn.

Passed: public static subset and real Node HTTP/LAN/None health/unsupported-mode/stop tests. Source-only handoff has zero .pnds. Actual App creation opening, bundled Node, browser/WKWebView and performance remain unverified. Sound is not selected for these explicit None fixtures; no sound claim.

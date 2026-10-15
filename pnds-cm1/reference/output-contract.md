# Output baseline 输出基准

The strict definition of a correct pnds-cm1 output. Every generated project must satisfy every item below on both pages. This is a **course validation hard gate**: an item that fails blocks packaging until fixed. An item that genuinely does not apply to the work is NOT skipped silently — it must appear in the project's `docs/port-map.md` N/A section with evidence. A silently missing feature is a violation, full stop.

The non-negotiables in SKILL.md constrain the *process*; this contract constrains the *result*. The port map records why anything here is N/A; nothing here is advisory.

## Monitor page baseline

| id | item | check |
|---|---|---|
| M1 | **Conductor visuals structure-preserved**: every visual element of the original p5 sketch that carries score meaning (sections, pointer, sectors/nodes, cues) renders with the same logic and timing in the port | walkthrough vs. original |
| M2 | **Performance lifecycle works**: START button present and functional; pause/reset/jump etc. ported if (and only if) the sketch had them; a sketch that auto-ran on load is explicitized as START (known delta recorded) | press every control; score responds |
| M3 | **Bounded duration**: the performance has a defined end; at the end the piece wraps automatically (synths released, end-state visual), never loops forever. No-intrinsic-end originals carry the user-ruled duration in the port map | let it run to the end once |
| M4 | **QR join code**: monitor shows a QR pointing at the actual performer URL (`PNDS_PERFORMER_URL` takes precedence; only when absent use the matched `PNDS_HOST_IP`/performer-port fallback), so phones join by scanning. Default-on; omit ONLY if the user explicitly says so (port-map row) | scan with a phone; lands on performer page |
| M5 | **Player-ID presence**: the monitor shows which seats are taken (the player-ID registry), so the operator can see the ensemble is complete before START | join with one phone; seat shows occupied |
| M6 | **App integration**: theme-follow and locale-follow wired (monitor follows the App's pushed theme/locale) | switch App theme/language |
| M7 | **Cold-open clean**: opened with cleared storage the page renders its real content — no blank/black screen, no overlay blocking input, resize-safe canvas, iframe-embeddable | incognito walkthrough |

## Performer page baseline

| id | item | check |
|---|---|---|
| P1 | **Cold-open waiting card**: opened on a fresh system before anything has happened, the page shows a waiting card — never a blank screen (renders from the initial server snapshot) | incognito, fresh server |
| P2 | **Player-ID picker**: the performer picks their seat (Player 1..N) — single control family by default (one .tosc = one UI); a multi-UI special case follows the user's explanation, recorded in the port map | pick a seat; controls appear |
| P3 | **Controls complete 1:1**: every wired control of the original UI is present with the same type, range, defaults, and linking semantics as the port map's control table | exercise each control; expected sound/param change |
| P4 | **Multi-touch**: two controls driven simultaneously both track (DOM controls, or a canvas with `touches[]` + touch-id tracking + `touch-action: none`) | hold one control, move another |
| P5 | **Both orientations**: usable in portrait AND landscape; no blocking rotate overlay (desktop browsers open this page in landscape windows) | rotate phone; resize desktop window |
| P6 | **State restore**: phone lock/unlock or page refresh returns to the same seat with the same control state (seats-store claim token + state re-push) | lock/unlock mid-"performance" |
| P7 | **Score-feedback affordance** *(conditional)*: if the original lets a performer trigger a discrete visual change on the shared score (e.g. tapping their node), the performer page provides the matching affordance. N/A when the original has no such interaction | perform the action; score updates |
| P8 | **Mobile viewport discipline**: `user-scalable=no` + `viewport-fit=cover` + standalone-capable meta, so the page behaves as an app surface on phones | inspect head; pinch does not zoom |
| P9 | **Visual language inheritance**: the page's colors and design language come from the original p5 sketch (the conductor's style extended to the performers' controls). Deviations are port-map decisions, not accidents | side-by-side with the sketch |

## Evidence levels and deferred acceptance

Audit each item with two explicit columns: (1) implementation plus actual automated/browser evidence, and (2) remaining native/device/sound acceptance. A protocol test, decoded QR or browser pointer check must never be recorded as a phone scan, physical multitouch, lock/unlock, WKWebView embedding or audible result. Browser cold/warm walkthrough remains required for course implementation; source/assets/protocol/health checks alone do not replace it.

When the author explicitly defers sound or actual devices, retain their checks as pending rather than N/A. Once implementation and available browser checks pass, a statically valid source-plus-bundle may be delivered as a **validation artifact** with those limitations. This is not a completed course/publication acceptance claim or an installation round trip. If browser walkthrough or an implementation item is missing, return source/progress and report that gate unresolved. Complete course acceptance still requires the agreed pending checks; genuine feature N/A still needs source evidence in the port map.

## Audit procedure (course validation)

1. After the cold-open walkthrough in the [course validation playbook](conversion-playbook.md#course-validation-gate), walk M1–M7 and P1–P9 explicitly.
2. For each item: pass → tick; fails → fix and re-verify; genuinely N/A → confirm the port map carries the row with evidence, else add it now.
3. M2/M3/M5/P2/P6 additionally covered by node tests where practical (lifecycle transitions, registry, restore) — tests do not replace the walkthrough, they only anchor regressions.
4. Packaging as a validation artifact starts only when the implementation/browser audit table is complete: pass or evidence-backed N/A for every id, nothing blank. Record deferred native/device/sound checks in the separate acceptance column and handoff; never fold pending into pass.

## What this contract deliberately does NOT require

- No hub, roles, cross-endpoint sync, or `telematic` anything (the course is local; general conversion topology is author-decided).
- No orientation enforcement, no rotate overlays (creator decision for later iterations, never a port default).
- No rehearsal-roster or other work-specific conveniences — works may add them; the baseline only guarantees the floor.

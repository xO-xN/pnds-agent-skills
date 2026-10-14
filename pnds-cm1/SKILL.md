---
name: pnds-cm1
description: Port a polished p5.js, SuperCollider and one TouchOSC classroom work to a local-network PNDS project with START, bounded end, QR and player IDs; deliver source and bundle only when the user explicitly chooses CM1 or the course first phase.
---

# CM1 / 课程第一阶段本地网络移植

Use only after the user explicitly selects CM1, pnds-cm1, or the course first phase. General creation/conversion never auto-selects this course. This entry remains independently installable; shared capabilities, references and helpers are bundled locally.

The course input is a polished runnable p5 sketch, SuperCollider `.scd` files and one TouchOSC `.tosc` shared by players. Read [input validation](reference/input-validation.md). Multiple layouts need the author's explanation of player/UI assignment. Missing/unparseable course materials block course implementation; they can still be investigated and reported.

Compose [investigation](capabilities/investigate.md) with [course analysis](reference/analysis.md), then [author discussion](capabilities/assess.md) and [port map](reference/port-map-template.md). Preserve the work's sound, visuals, interaction and timing equally. Course-required changes (auto-run becoming START, choosing an end when none exists) need explicit author discussion and recorded decisions before rewriting. No intrinsic end means the author defines a duration/end. Do not resolve conflicts by degrading a lower-ranked artistic dimension.

After the plan is confirmed, use [runtime preparation](capabilities/adapt-runtime.md), [module integration](capabilities/integrate-modules.md) and the [course playbook](reference/conversion-playbook.md). Match [installed App docs](reference/platform-sources.md). Architecture: one Mac and LAN phones; no hub, role picker, cross-endpoint synchronization or `telematic` declaration. Player IDs do not imply a universal one-voice-per-seat rule; derive voices from the original.

Retain the course [output contract](reference/output-contract.md): monitor START, bounded end/cleanup, QR, player presence, first cold render and recovery; performer player-ID selection, simultaneous multitouch and both orientations. N/A needs evidence in the port map. Optional pause/reset/jump preserve only the original's semantics. Theme/locale and page embedding obligations follow the course baseline and matched platform.

Use [validation/handoff](capabilities/validate-handoff.md) with the course-specific delivery gate: Node checks and new behavioral tests, protocol/control/recovery, compiled declared assets, None-mode ready and shutdown, real browser cold/warm walkthrough and output audit before claiming the course is complete. Real sound and phone acceptance remain separately recorded. If unavailable, return source/progress with pending checks, without marking the complete course gate passed or silently lowering it.

CM1 requires both editable source and .pnds with SHA256. Read [packaging](reference/packaging.md); static packaging does not replace the course validation gate or installation round trip. Handoff explains scan → player ID → START → bounded end, confirmed deltas and actual/pending evidence. No hidden Template checkout or installed sibling Skill is required; tools/dependencies are in [tools](reference/tools.md).

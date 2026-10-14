# Continuing the same work / 创作记录

Read existing decisions, validation notes and `docs/creator-handoff.md` before new work. Preserve their content, project identity, token/storage keys and recovery behavior. Use existing record formats when present; otherwise the following small, evolvable source records are sufficient. These are authoring files, not new manifest fields.

`docs/source-assessment.md` records source paths/revisions and evidence; author statements; unverified claims; platform documentation version; sound/resources, visuals, interaction, timing and network facts; gaps; feasibility and candidate routes. An assessment-only task can deliver this report outside an unchanged source project.

`docs/decisions.md` records each author decision with date, goal, chosen route, alternatives, reason, affected sound/visual/interaction/time behavior, scope of implementation authorization and pending facts. Preserve the author's explicit confirmations across tasks. A tool run or past test is not author confirmation. A change outside the confirmed scope needs a new decision.

`docs/validation.md` is a dated ledger. For each check record input revision or file hash, App/corpus/module version, command/action, environment/harness/model, result (`passed`, `failed`, `not run`, `blocked`), observable evidence and limitation. Keep these separate: structure; actual creation-mode opening; wiring; automated checks; health; browser; sound/device; performance; distribution/install. None-mode health never proves sound. Prior tests become stale after relevant changes.

`docs/creator-handoff.md` keeps the project's existing task format. Where none exists, write specific tasks with stable identifiers, goal, affected files, completed work, pending steps and acceptance. Preserve previous tasks and update only the current task. Failed or cancelled work records partial changes; do not promise automatic rollback.

Keep raw originals in `sources/` only if authorized and useful; include licenses and resource provenance. Under the current bundle contract, `sources/` and `.scd` sources are runtime-package candidates unless the project deliberately relocates authoring-only material beneath root `docs/`. Root `docs/`, `test/` and `tests/` directories are excluded from distribution. Do not put secrets or private conversation into source or bundle records.

# Investigate / 工程调查

Input: arbitrary source material, partial material, or an existing PNDS project, plus the task goal when available. Output: a traceable source assessment. Done: relevant facts and decision-affecting gaps are recorded; implementation has not been started merely because investigation completed.

Read existing source decisions/validation/handoff and establish identity before inspecting an existing PNDS project. Read [platform-sources](../reference/platform-sources.md) when comparing PNDS conditions, and [records](../reference/records.md) for continuing work.

Inventory actual files and dependency declarations, runtime/languages, project identity, audio engines/samples/plugins, pages/visuals, input mappings and ranges, timing/start/end/clock behavior, persistence/recovery, process ownership and network relationships. Cite file paths and relevant code locations or user-provided statements. Mark inference and unverified claims separately. Do not infer the author's artistic goal from a technical implementation.

Missing p5, SuperCollider or TouchOSC never blocks general investigation. For supplied TouchOSC files only, use the bundled parser described in [tools](../reference/tools.md); correlate senders and receivers instead of treating the inventory as full semantics. A URL is a source pointer, not proof that source was retrieved. For inaccessible or binary-only material, report what was actually inspected and the gaps that affect decisions.

Deliver the report without changing source code, reinitializing identity/token keys, starting a performance or packaging. Ask only for gaps that materially change feasibility; retain partial findings for later discussion.

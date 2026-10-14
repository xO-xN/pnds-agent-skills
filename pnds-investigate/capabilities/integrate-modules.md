# Integrate modules / 模块接入与维护

Input: a selected module's real source, README and compatibility metadata; App-generated provenance/handoff or an explicit author task; existing project and decisions. Output: wired code, preserved provenance, combined behavior evidence and remaining tasks. Done: the selected capability is exercised through the actual project's public interface, or accurately reported as incomplete.

Read [platform-sources](../reference/platform-sources.md), [records](../reference/records.md), the selected release's bilingual README and `compatibility.json`. See [module-guide](../reference/module-guide.md) for selecting those resources. No hidden Template checkout or installed sibling Skill is needed. If source/version/manual is missing or incompatible, report that limitation before wiring.

Inspect how this project serves pages, manages dependencies/configuration, routes events/callbacks and closes resources. Preserve App-added provenance and task identifiers. Determine runtime dependencies separately from Host protocol and delivery version. Add required imports/routes/scripts/configuration according to that release's public interface and project architecture; copying files alone is not integration.

Do not import a reference work's roles, seat/voice ownership, sound mapping, UI design or timing as module policy. Artistically meaningful changes require the recorded author decision. Exercise the module and existing functions together via HTTP, real client events and observable page behavior where available. Update actual wiring and validation results, with browser/native/device limitations explicit.

For unknown or customized versions, inspect bytes and provenance; do not infer release from filenames. For upgrade/merge/removal, compare recorded release and author changes, preserve customization, update dependencies/references/cleanup and recheck existing behavior. On failure/cancellation, retain partial work and tasks, identify actual changed files and remaining steps; do not claim success or universal automatic rollback.

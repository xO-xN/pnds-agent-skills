---
name: pnds-modules
description: Wire, combine, upgrade, merge or remove released PNDS technical modules in an existing project while preserving author customization and provenance.
---

# 模块接入与维护 / pnds-modules

Run [the independent capability](capabilities/integrate-modules.md) for this task. Its inputs, outputs and completion condition apply directly; no unified creation entry or other installed Skill is required.

Before platform-dependent work use [the local App source guide](reference/platform-sources.md). Preserve ongoing decisions and evidence using [the source records](reference/records.md). Helpers and dependencies are declared in [tools](reference/tools.md). Every referenced resource is bundled inside this directory; `resource-manifest.json` lists their version and content hashes.

Work in the current external agent's authorized scope. Installing a Skill is optional and never an App runtime prerequisite. If native Skill invocation is unavailable, reading this capability and its conditional references is sufficient; record that invocation limitation. Do not install or change another agent environment automatically.

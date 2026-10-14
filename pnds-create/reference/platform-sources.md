# Platform evidence / 平台资料

The target is the user's installed PNDS App, not the newest repository branch. Read the project's AGENTS.md and recorded App/module versions first. Ask for the App location/version only when it cannot be found from the current task; do not scan other agent installations.

Use `PNDS.app/Contents/Resources/help/<tree>/reference/README.md` as the stable local index (`<tree>` is `en` or `zh-CN`). Read the relevant local files:

| Task | Local relative references |
| --- | --- |
| Structure and identity | `reference/manifest.md`, `reference/structure.md` |
| Start, health, bus, stop | `reference/runtime-contract.md`, `reference/audio-modes.md`, `reference/network.md` |
| Pages and shortcuts | `reference/page-interaction.md` |
| Distribution | `reference/pnds-bundle.md` |
| Modules | `modules/README.md` and the selected module's entry |

The App location is an environment input, not a maintainer path. `node tools/platform-info.mjs --app <PNDS.app> --locale en` inventories the local references and reports the installed version. The tool reports missing resources; it does not download replacements. Local resource layout remains `help/<tree>/…`.

If no installed corpus is accessible, use an explicitly versioned App source checkout or a released tag matching the target App. Official fallback: https://github.com/xO-xN/PNDS-App/tree/main/docs — main may be ahead; label it as fallback and resolve compatibility before implementation. Never assert a remote capability exists in the installed App. If the target cannot be established, investigation/assessment can continue, while dependent implementation remains unresolved.

These Skills resources are workflow guidance at version 0.2.0, Host protocol 1. They are not a mirror of the authoritative platform manual. Module delivery version, required Host protocol, runtime dependencies and work adaptation are separate facts; record all four. The v1.6.1 work is not a released App/module guarantee until those resources have actually been published and matched to the installation.

Discover tools in the actual environment: Node/npm via PATH (use the App's bundled Node for final runtime acceptance), `sclang` via PATH or a user-provided executable location, `zip`/`unzip` via PATH. An absent compiler blocks compiled Internal assets and distribution, not the ability to deliver editable source with pending validation. Do not hardcode a SuperCollider installation or assume a Template sibling checkout. If a starter is needed, obtain a user-provided or explicitly versioned PNDS-Template resource and record its revision; install its production dependencies only within the authorized creation task.

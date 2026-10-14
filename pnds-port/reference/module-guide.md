# Released module resources / 模块资料

Use a module already added by App together with its actual source/provenance and matching release README/compatibility metadata. Otherwise obtain a fixed released resource selected for the installed App. A module directory is not a running installer; external agents wire it within the authorized project task. App file addition itself does not install dependencies, change entrypoints or prove wiring.

The standard set is `qr`, `players`, `theme-follow`, `locale-follow`, `monitor-state`, `hub`. The target App/module release must actually provide the selected item; do not assume a newer online release is installed. Each module README is authoritative for import names, browser delivery paths, dependencies and adaptation hooks. A frozen module uses its own CommonJS package scope where specified; do not guess ESM conversion.

| Module | Integration evidence |
| --- | --- |
| qr | Published performer URL resolution, real image route, monitor QR/label and destination; full Host URL takes precedence over LAN fallback. Do not infer address from monitor request host. |
| players | Join/reject/reconnect, stable claim identity, observer exclusion, release and restart boundary; work policy decides seats/voices. Optional continuous filtering must preserve repeated discrete actions. |
| theme-follow | Monitor-only script exposure, first frame, idempotent message update and missing/malformed fallback; performer retains work behavior. |
| locale-follow | Monitor-only script exposure, initial locale, update and fallback; page owns text rendering. |
| monitor-state | Real monitor snapshot/update, late join/reconnect and lifecycle reset, key validation and performer channel isolation; only view state. |
| hub | Auth/room/relay, local echo prevention, remote summary expiry, reconnect and cleanup; local performer controls remain usable when remote hub fails after normal Host configuration. |

Use actual source and the release examples for API calls. Provenance is an authoring record, not a manifest field. Unknown old files or custom implementations need comparison before upgrade or removal; filename similarity is not version evidence. Full-state recovery, generic limiting frameworks, fixed artistic roles and a multitouch module are outside this module set.

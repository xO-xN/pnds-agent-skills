# pnds-agent-skills

External coding-agent workflows for creating, modifying and assessing PNDS projects. Ordinary work returns editable source and actual decision/validation/handoff records; distribution is explicit. Skills are optional and are not required to use PNDS App or its offline technical modules.

| Skill | Purpose |
| --- | --- |
| [pnds-create](pnds-create/SKILL.md) | Unified new/modify/arbitrary-source assessment entry |
| [pnds-investigate](pnds-investigate/SKILL.md) | Independent source/project fact investigation |
| [pnds-assess](pnds-assess/SKILL.md) | Author discussion, feasibility and implementation confirmation |
| [pnds-runtime](pnds-runtime/SKILL.md) | Installed runtime contract audit/adaptation and initial structure |
| [pnds-modules](pnds-modules/SKILL.md) | Real module wiring, combination and customization-preserving maintenance |
| [pnds-validate](pnds-validate/SKILL.md) | Separate validation stages, explicit packaging and handoff |
| [pnds-port](pnds-port/SKILL.md) | Arbitrary-source assessment then author-confirmed conversion |
| [pnds-cm1](pnds-cm1/SKILL.md) | Explicit course first phase: polished triple, LAN/START/bounded end/QR/player IDs, source plus bundle |

Each directory is independently distributable. Its local capabilities, references and helpers are included; no installed sibling Skill or maintainer Template checkout is required. Copy only the directory needed into the current agent's configured Skills location. The user chooses installation; this repository does not automatically change agent environments. A harness without native Skill invocation can read SKILL.md and its local capability pointers directly.

Use installed PNDS App `Contents/Resources/help/<tree>/…` first, then an explicitly matched versioned source fallback. Missing/mismatched resources are limitations. Workflow version 0.2.0 and Host protocol 1 do not promise that unpublished v1.6.1 capabilities exist in an older App. Each module's fixed source version, Host protocol, runtime dependency and adaptation policy must be checked separately.

Maintain shared resources under `resources/`; `npm run build` writes their self-contained copies and SHA256 manifests to all eight Skills. `npm run check:all` verifies reproducibility/local references and tool behavior (Node 24; `zip`/`unzip` for package tests; controlled localhost access for smoke tests). Helpers never silently install dependencies or compile; None smoke is explicit and separate from static packaging. [Validation evidence](VALIDATION.md) records observed coverage and pending external/native acceptance; [harness requests](test/harness-prompts.md) describe realistic independent tasks.

Sources: [PNDS App](https://github.com/xO-xN/PNDS-App), [PNDS Template](https://github.com/xO-xN/PNDS-Template), and optional [pnds-hub](https://github.com/xO-xN/pnds-hub). Published resources must be matched to the actual installation; remote main is not installed-version evidence.

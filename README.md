# pnds-agent-skills

AI agent skills for the PNDS ecosystem (PNDS App / PNDS Template / `.pnds` projects). Each directory is a self-contained skill — see its `SKILL.md` for what it does and how to run it.

Built for Prof. Kenneth Fields' computer music course: the skills port classroom networked digital score projects (p5.js + SuperCollider + TouchOSC) into PNDS projects.

## Skills

| Skill                                                     | What it does                                                                                                                                                                                     |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [pnds-cm1](./pnds-cm1/) | Port a polished classroom work (p5.js sketch + SuperCollider `.scd` + one TouchOSC `.tosc`) into a runnable PNDS project for **local-network performance** — one monitor page (conductor score, START, QR join) plus per-player web controls; no hub, no roles. Phase 1 of the course. Use only when the user explicitly chooses this skill. |
| [pnds-port](./pnds-port/) | Port an existing digital-musical-score "triple" (an OpenProcessing p5.js sketch + SuperCollider `.scd` file(s) + TouchOSC `.tosc` file(s)) into a runnable PNDS score project for **multi-endpoint telematic performance** — the complete project folder **and** its `.pnds` bundle in one shot, faithful to the original. |

The two skills serve different needs and produce different outputs — the user designates which one to run; agents must not choose between them on their own.

## Install

Clone the repo, then copy (or symlink) the skill directory you want into your agent's skills directory:

```sh
git clone https://github.com/xO-xN/pnds-agent-skills.git
cp -R pnds-agent-skills/<skill-dir> ~/.agents/skills/
# or keep it linked to the repo:
# ln -s "$(pwd)/pnds-agent-skills/<skill-dir>" ~/.agents/skills/<skill-dir>
```

## Related repositories

- [PNDS-App](https://github.com/xO-xN/PNDS-App) — the macOS host that runs PNDS projects
- [PNDS-Template](https://github.com/xO-xN/PNDS-Template) — the creation template for PNDS projects
- [pnds-hub](https://github.com/xO-xN/pnds-hub) — relay server for cross-internet performances

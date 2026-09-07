# pnds-agent-skills

AI agent skills for the PNDS ecosystem (PNDS App / PNDS Template / `.pnds` projects). Each directory is a self-contained skill — see its `SKILL.md` for what it does and how to run it.

## Skills

| Skill                                                     | What it does                                                                                                                                                                                                                                                     |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [pnds-port](./pnds-port/) | Port an existing digital-musical-score "triple" (an OpenProcessing p5.js sketch + SuperCollider `.scd` file(s) + TouchOSC `.tosc` file(s)) into a runnable PNDS score project — the complete project folder **and** its `.pnds` bundle in one shot, faithful to the original. |

## Install

Clone the repo, then copy (or symlink) the skill directory you want into your agent's skills directory:

```sh
git clone https://github.com/xO-xN/pnds-agent-skills.git
cp -R pnds-agent-skills/pnds-port ~/.agents/skills/
# or keep it linked to the repo:
# ln -s "$(pwd)/pnds-agent-skills/pnds-port" ~/.agents/skills/pnds-port
```

## Related repositories

- [PNDS-App](https://github.com/xO-xN/PNDS-App) — the macOS host that runs PNDS projects
- [PNDS-Template](https://github.com/xO-xN/PNDS-Template) — the creation template for PNDS projects
- [pnds-hub](https://github.com/xO-xN/pnds-hub) — relay server for cross-internet performances

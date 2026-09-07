# pnds-agent-skills

PNDS 生态（PNDS App / PNDS Template / `.pnds` 工程）的 AI agent 技能集。每个目录是一个自包含技能——做什么、怎么跑，见各自的 `SKILL.md`。

## 技能

| 技能                                     | 用途                                                                                                                                                                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [pnds-port](./pnds-port/) | 移植既有数字乐谱「三件套」（OpenProcessing p5.js sketch + SuperCollider `.scd` + TouchOSC `.tosc`）为可运行的 PNDS 工程——工程目录**和** `.pnds` 包一次生成，忠实原作。 |

## 安装

clone 本仓库后，把所需技能目录复制（或 symlink）进你 agent 的技能目录：

```sh
git clone https://github.com/xO-xN/pnds-agent-skills.git
cp -R pnds-agent-skills/pnds-port ~/.agents/skills/
# 或保持与仓库联动：
# ln -s "$(pwd)/pnds-agent-skills/pnds-port" ~/.agents/skills/pnds-port
```

## 相关仓库

- [PNDS-App](https://github.com/xO-xN/PNDS-App) | 运行 PNDS 工程的 macOS Host
- [PNDS-Template](https://github.com/xO-xN/PNDS-Template) | PNDS 工程创作模板
- [pnds-hub](https://github.com/xO-xN/pnds-hub) | 跨互联网演奏中继服务器

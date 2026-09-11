# pnds-agent-skills

PNDS 生态（PNDS App / PNDS Template / `.pnds` 工程）的 AI agent 技能集。每个目录是一个自包含技能——做什么、怎么跑，见各自的 `SKILL.md`。

为 Kenneth Fields 教授的计算机音乐课程而建：这些 skill 把课堂的网络数字乐谱作品（p5.js + SuperCollider + TouchOSC）移植为 PNDS 工程。

## 技能

| 技能                                     | 用途                                                                                                                                                                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [pnds-cm1](./pnds-cm1/) | 把完善的课堂作品（p5.js sketch + SuperCollider `.scd` + 单个 TouchOSC `.tosc`）移植为**本地网络演奏**的可运行 PNDS 工程——一个 monitor 页（指挥乐谱、START、QR 入场码）加每演奏者的 web 控件；无 hub、无角色。课程第一阶段。仅在用户明确指定时使用。 |
| [pnds-port](./pnds-port/) | 移植既有数字乐谱「三件套」（OpenProcessing p5.js sketch + SuperCollider `.scd` + TouchOSC `.tosc`）为**多端点遥现演奏**的 PNDS 工程——工程目录**和** `.pnds` 包一次生成，忠实原作。 |

两个技能服务不同的需求与输出——由用户指定调用哪一个，agent 不得自行选择。

## 安装

clone 本仓库后，把所需技能目录复制（或 symlink）进你 agent 的技能目录：

```sh
git clone https://github.com/xO-xN/pnds-agent-skills.git
cp -R pnds-agent-skills/<技能目录> ~/.agents/skills/
# 或保持与仓库联动：
# ln -s "$(pwd)/pnds-agent-skills/<技能目录>" ~/.agents/skills/<技能目录>
```

## 相关仓库

- [PNDS-App](https://github.com/xO-xN/PNDS-App) | 运行 PNDS 工程的 macOS Host
- [PNDS-Template](https://github.com/xO-xN/PNDS-Template) | PNDS 工程创作模板
- [pnds-hub](https://github.com/xO-xN/pnds-hub) | 跨互联网演奏中继服务器

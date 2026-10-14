> Historical design record / 历史设计记录: this describes the former course/telematic organization, not current general conversion policy. The current SKILL.md and installed App contract govern new work.

# ADR-0001 — pnds-cm1 是独立 skill，不是 pnds-port 的本地模式

- 状态：已接受（2026-09-11）
- 背景：Kenneth Fields 教授计算机音乐课程第一阶段需要把课堂三件套作品移植为**本地网络**演奏的 PNDS 工程（单端点、手机扫码入座、monitor 一个 START 即演）。已存在的 pnds-port 面向遥现多场地架构（角色卡、hub 表单、最小同步集、telematic manifest 契约）。

## 语境

同一类输入（三件套）、两种目标架构。课堂第一阶段产量大、形态统一；遥现演出是少数、需跨端协调。pnds-port 的 non-negotiables 与各 phase gate 深度耦合 hub 架构（同步判据、权威模型裁决、hub-leg 复用、telematic 字段）。

## 备选

1. 给 pnds-port 加「本地模式」开关，按作品走分支。
2. 另立 pnds-cm1，pnds-port 原样保留。

## 决策

选 2。另立 pnds-cm1 为自包含 skill（独立 SKILL.md / reference / tools / design），pnds-port 一字不动。

## 理由

- **契约互斥**：cm1 的核心输出基准（monitor 必有 START + 有界时长、无角色卡、永不声明 telematic）与 pnds-port 的保真派生传输（原作有就有、无就无，遥现字段由架构决定）在「结果应长什么样」上直接冲突。一个 skill 内这两套判据只能靠 if/else 分叉，每个 phase 都要双判，gate 语义会稀释。
- **门槛不同**：pnds-port 的分析必产权威模型/拓扑/最小同步集裁决；本地端点上这些问题不存在（server 即权威、单端点）。分支会让 pnds-port 的 gate 清单长期挂着一段「本地模式跳过」。
- **教学场景要统一产出形态**：课程第一阶段的所有产出应该是同一个形状（扫码、选座、START、有时长），这正是输出基准要锁死的东西——它属于 cm1 的身份，不该作为 pnds-port 的可选行为存在。

## 代价与缓解

- 工具与参考资料有复制（tosc-parser、pack、输入校验、SC 转换规则等）。刻意为之：仓库的安装单元是单个 skill 目录。缓解：两 skill 的共享内容限定在稳定层（解析器、打包器、平台契约引述），演化时人工同步。
- 用户必须显式指定用哪个 skill——agent 不得自行二选一（写入双方 description 与仓库 README 的调用规则）。选错方向的代价（该本地却做了遥现 / 该遥现却只做了本地）都是重移植级，故把分发权留给用户。
- 本地作品日后升级遥现 = 经 pnds-port 重移植；cm1 的移植契约可直接充当分析输入，损失有限。

## 后果

pnds-agent-skills 仓库成为双 skill 仓库；README 的 skills 表与调用规则是分发的唯一说明处。

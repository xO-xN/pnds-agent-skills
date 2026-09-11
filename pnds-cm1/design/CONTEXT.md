# pnds-cm1

将课堂「p5.js 乐谱 + SuperCollider + TouchOSC」三件套移植为本地网络演奏 PNDS 工程的 skill 的领域语言（Kenneth Fields 教授计算机音乐课程第一阶段）。本文件是设计期术语表；skill 运行期内容见 SKILL.md 与 reference/。姊妹 skill pnds-port（遥现多场地架构）有自己的术语表，两表不混用。

## Language

### 移植对象

**三件套（Triple）**:
一个待移植课堂作品的完整输入：p5.js 源码（OpenProcessing）+ SuperCollider 文件（一个或一组 .scd）+ **单个** TouchOSC 文件（.tosc，全体演奏者共用一套 UI）；说明文件为可选随附。多个 .tosc 属用户须说明的特例。
_Avoid_: 素材、原料

**指挥乐谱（Conductor）**:
三件套中 p5.js 界面所承担的角色——展示段落、指针、节点/扇区亮灭的视觉时间线，并承载演奏生命周期控制。移植后驻留在 monitor 页。
_Avoid_: 乐谱页面、大屏（大屏是投放方式，不是角色）

**演奏者界面（Performer UI）**:
手机/平板上的 web 控制页，是 TouchOSC 界面的对应物；只控制本端点的声音，视觉语言沿用原作 p5 的设计。
_Avoid_: TouchOSC 页（移植后不存在 TouchOSC）

**死内容（Dead Content）**:
原作中发出但无人接收、或定义但从未发出的信号与控件（如无对应 OSCdef 的控件、MIDI CC 镜像）。记录进移植契约，不生成。
_Avoid_: 废弃功能、冗余控件

**移植契约（Port Map）**:
生成工程内的 `docs/port-map.md`：原作元素 → PNDS 元素的完整对照表，含死内容标注、歧义裁决与输出基准豁免（N/A）行。是保真度的审计依据。
_Avoid_: 转换表、映射文档

### 本地端点

**端点（Endpoint）**:
一个演奏单元：一台运行 PNDS App（加载本工程）的 Mac + 同一局域网内的演奏者手机 + 一个本地 scsynth。无 hub、无角色、无遥现——一切发生在这一个端点上。
_Avoid_: 站点、场地机器（多场地是 pnds-port 的概念）

**座位 / 演奏者编号（Seat / Player ID）**:
演奏者的身份（第几号演奏者），手机扫码打开 performer 页后选择，决定控件默认值与声部归属；经 claim token 在重连后保持。
_Avoid_: 玩家、player id（口头上可用，文档统一用「座位」）

**声部模型（Voice Model）**:
声音实例的归属方式，按作品从原作分析裁决：**每座位一声部**（每个客户端拥有自己的 synth 实例，PNDS 的自然形态）或**共享声部**（全体共用一个声音实例，控件写入需仲裁）。裁决记入移植契约。
_Avoid_: 复音、voice count

### 演奏生命周期

**演奏生命周期（Performance Lifecycle）**:
一场演奏从开始到结束的状态机：START 启动乐谱时间线 → 进行 → 到达有界时长的终点自动收尾（释放 synth、终态画面）。原作已有的开始/传输/时长设计原样移植并验证可用；原作「加载即跑」则显式化为 START（已知差异）；原作无内在结尾则必须经用户裁决时长，不得无限演奏。
_Avoid_: 播放控制（只是它的操作面）

**有界时长（Bounded Duration）**:
每场演奏有明确定义的终点——来自原作的结构，或（原作无结尾时）用户的裁决；记入移植契约。无限时长的产出是违规。
_Avoid_: 时长限制

### 制作

**模块复用清单（Module Reuse Map）**:
skill 手册中「移植需求 → PNDS Template 现成模块」的对照表；制作时优先调用现成模块（players / seats-store / protocol / audio-engine / osc-transport / qr 等），不重复造轮子。
_Avoid_: 依赖表

**输出基准（Output Baseline）**:
每个产出工程的 monitor 页与 performer 页必须满足的特征下限（`reference/output-contract.md` 的 M1–M7 / P1–P9），Phase 5 硬门：不满足不得打包；确不适用的项必须在移植契约记 N/A 行并附证据，静默缺失即违规。它约束**结果**；SKILL.md 的 non-negotiables 约束**过程**。
_Avoid_: 验收清单（那是移植契约 §10 的人工验收）、输出格式

**已知差异（Known Deltas）**:
移植中不可避免的原作/移植版分歧（如 manifest 无法表达的 scsynth memSize、「加载即跑」→显式 START、App 端采样率）。逐项记入移植契约，附缓解或验证方式；从不静默发生。
_Avoid_: 兼容性问题、损失

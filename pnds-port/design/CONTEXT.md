> Historical design record / 历史设计记录: this describes the former course/telematic organization, not current general conversion policy. The current SKILL.md and installed App contract govern new work.

# pnds-port

将既有的「p5.js 乐谱 + SuperCollider + TouchOSC」三件套数字乐谱移植为 PNDS 工程的 skill 的领域语言。本文件是设计期术语表；skill 运行期内容见 SKILL.md 与 reference/。

## Language

### 移植对象

**三件套（Triple）**:
一个待移植数字乐谱的完整输入：p5.js 源码（OpenProcessing）+ SuperCollider 文件（一个或一组 .scd）+ TouchOSC 文件（一个或一组 .tosc），三者缺一不可；说明文件为可选随附。
_Avoid_: 素材、原料

**指挥乐谱（Conductor）**:
三件套中 p5.js 界面所承担的角色——向所有演奏者展示段落、指针、节点/扇区亮灭的视觉时间线。移植后驻留在 monitor 页。
_Avoid_: 乐谱页面、大屏（大屏是投放方式，不是角色）

**演奏者界面（Performer UI）**:
手机/平板上的 web 控制页，是 TouchOSC 界面的对应物；只控制本端点的声音。
_Avoid_: TouchOSC 页（移植后不存在 TouchOSC）

**死内容（Dead Content）**:
原作中发出但无人接收、或定义但从未发出的信号与控件（如无对应 OSCdef 的控件、MIDI CC 镜像）。记录进移植契约，不生成。
_Avoid_: 废弃功能、冗余控件

**移植契约（Port Map）**:
生成工程内的 `docs/port-map.md`：原作元素 → PNDS 元素的完整对照表，含死内容标注与歧义裁决。是保真度的审计依据。
_Avoid_: 转换表、映射文档

### 端点与角色

**端点（Endpoint）**:
一个场地单元：一台运行 PNDS App（加载本工程）的 Mac + 该场地全部演奏者设备 + 一个本地 scsynth。多个端点经 hub 组成遥现演出。
_Avoid_: 站点（site）、场地机器

**角色（Role）**:
端点的身份，对应原作的场地分组（如 CCOM-A / PKU / CCOM-B / Wuhan），也可能包含**指挥角色**——拥有专属开始 UI、主导演出推进的特殊角色。monitor 开场选择，决定本端点使用哪组 SynthDef、哪套演奏者界面与何种指挥权限。是原作「开场身份输入」的对应物。
_Avoid_: 分组（group）、模式（mode）

**指挥权威模型（Authority Model）**:
指挥状态机的推进方式，按作品从原作分析裁决，两种模式：**主导角色**（作品设有指挥角色，由该端点主导，其余端点跟随）与**同步开始**（所有端点均可开始，各端点同步进入）。裁决结果记入移植契约。
_Avoid_: master/slave

**座位（Seat）**:
角色内演奏者的身份（第几号演奏者），手机入座时选择，决定控件默认值。
_Avoid_: 玩家、player id

### 遥现同步

**hub**:
pnds-hub——冻结协议的哑中继：`auth {token, room, node}`，`relay`（任意 JSON，盖 `{from, hubReceivedAt}` 章后转发给同房间其他端）、`echo`（RTT 探测，只回发送者）。无状态、无重放。
_Avoid_: 服务器（server 特指端点内 score server）

**最小同步集（Minimal Sync Set）**:
跨端点经 hub 中继的全部内容——只含影响指挥画面的离散事件；演奏控件值、音频、本地注册表明细一律不同步。

**本地自治（Local Autonomy）**:
hub 不可达时端点仍以单端点模式运行的降级能力；兼作纯本地排练模式。

### 制作

**模块复用清单（Module Reuse Map）**:
skill 手册中「移植需求 → PNDS Template / 参考工程现成模块」的对照表；制作时优先调用现成模块（players / seats-store / protocol / audio-engine / osc-transport / hub-leg 模式等），不重复造轮子。

**时钟漂移容忍（Clock Drift Tolerance）**:
跨端点时间基准的策略：离散事件以收到时刻锚定、连续量（指针）本地推导，不做时钟同步协议。依据：原作本就是每个浏览器各跑各的钟。

**已知差异（Known Deltas）**:
移植中不可避免的原作/移植版分歧（如 manifest 无法表达的 scsynth memSize、App 端采样率、拓扑改变）。逐项记入移植契约，附缓解或验证方式；从不静默发生。
_Avoid_: 兼容性问题、损失

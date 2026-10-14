> Historical design record / 历史设计记录: this describes the former course/telematic organization, not current general conversion policy. The current SKILL.md and installed App contract govern new work.

# 移植目标为多端点遥现架构，而非单 App 局域网

原作的拓扑是遥现的：多场地各自运行 SuperCollider、演奏者各自持 TouchOSC 设备。移植目标不是把它折叠成单 App + LAN（PNDS-App 的默认场景），而是保持多端点：每个端点运行 PNDS App 加载同一工程，monitor 页承载指挥乐谱并投大屏，演奏者手机连本端点，本地 scsynth 只合成并输出本地声音。端点之间经 pnds-hub 中继**控制信息**（见最小同步集），站点间音频（JackTrip 等）明确不在本 skill 范围。

## Considered Options

- 单 App + LAN（全部演奏者连一个 App）：PNDS 的原生场景，但把遥现作品压扁成同室作品，违背原作形态。
- 每组一个独立 .pnds：被否——用户已定「保持开头的身份输入」，身份选择发生在运行时（monitor 开场），单 bundle 分发更简单。

## Consequences

- 工程必须包含全部角色的 SynthDef 与界面，按角色在运行时启用。
- 生成工程自带 hub 客户端（monitor 表单配置 + 环境变量兜底，参照 Telematic-Network-Diagnostics 模式；App 的 hub 环境注入是 v1.4.0 规划，不能依赖）。

# pnds-agent-skills

供外部编程 agent 新建、修改、调查和评估 PNDS 工程。普通工作默认交可编辑源工程与真实决定、验证、交接记录；明确分发才打包。Skills 自愿按需安装，App 与离线模块不以安装它们为条件。

| Skill | 用途 |
| --- | --- |
| [pnds-create](pnds-create/SKILL.md) | 统一新建、修改与任意来源评估入口 |
| [pnds-investigate](pnds-investigate/SKILL.md) | 独立工程／来源事实调查 |
| [pnds-assess](pnds-assess/SKILL.md) | 作者讨论、可行性与实施确认 |
| [pnds-runtime](pnds-runtime/SKILL.md) | 对应装机版本的契约审查、适配与初版结构 |
| [pnds-modules](pnds-modules/SKILL.md) | 实际接线、组合验证、保留定制的升级／合并／移除 |
| [pnds-validate](pnds-validate/SKILL.md) | 分阶段验证、明确分发后的打包与交接 |
| [pnds-port](pnds-port/SKILL.md) | 任意来源先评估、作者确认后移植 |
| [pnds-cm1](pnds-cm1/SKILL.md) | 明确选择的课程第一阶段：完善三件套、本地网络、START、有界结束、扫码、编号，源工程与包 |

八个目录均可单独分发：本地能力资料、参考与工具齐备，不依赖已安装兄弟 Skill 或维护者的 Template 目录。只将所需目录复制到当前 agent 配置的 Skills 位置；安装由用户选择，本仓库不会自动改变其他 agent 环境。没有原生 Skill 调用工具时，直接读 SKILL.md 及本地能力指针并记录调用限制。

平台资料优先读取装机 PNDS App 的 `Contents/Resources/help/<tree>/…`，fallback 必须显式匹配版本。缺少或不匹配时说明限制。工作流版本 0.2.0／Host 协议 1 不证明尚未发布的 v1.6.1 能力已在旧 App 存在；模块源码版本、Host 协议、运行依赖与作品适配分别核对。

共享资源唯一维护源是 `resources/`；`npm run build` 生成八个目录内的独立副本和 SHA256 清单，`npm run check:all` 验证可重现分发、目录内链接和工具行为。需要 Node 24，包测试用 zip/unzip，烟测需受控 localhost 监听。工具不自动安装依赖或编译；None 烟测与静态打包分开、显式执行。[验证记录](VALIDATION.md) 保留已做与未验边界，[独立任务请求](test/harness-prompts.md) 用于后续实际外部 harness 验证。资源检查不能代替真实 App 打开、浏览器、手机、声音和演出验收。

相关：[PNDS App](https://github.com/xO-xN/PNDS-App)、[PNDS Template](https://github.com/xO-xN/PNDS-Template)、可选 [pnds-hub](https://github.com/xO-xN/pnds-hub)。远程 main 不作为装机能力保证。

# Cartographer

本文件是本仓库的 agent 入口说明。

开始工作前先读这里，再按顺序阅读引用文档。所有实现决策都要保持边界清晰、口径明确，并与当前产品目标一致：把一个现有 Git 仓库分支引导为一个可安装的 harness template 仓库，以便后续在 `harness install` 普通仓库分支时复用其中的 harness 内容。

## 事实来源

按下面顺序阅读：

1. `docs/repo_to_harness_template_prd.md`
2. `docs/repo_to_harness_template_technical_spec.md`
3. `docs/repo_to_harness_template_development_plan.md`
4. `docs/testing-strategy.md`
5. `CONTRIBUTING.md`
6. `AGENTS.md`

实现前至少先读这些章节：

- `docs/repo_to_harness_template_prd.md`
  - `3. 已冻结结论`
  - `4. 主要用户工作流`
  - `6. 输出模型`
- `docs/repo_to_harness_template_technical_spec.md`
  - `3. 技术栈与基础约束`
  - `4. 目录与分层`
  - `6. 关键流程`
- `docs/testing-strategy.md`
  - `2. 测试金字塔`
  - `3. 最低覆盖矩阵`
  - `4. 测试约束`

如果代码变更与这些文档冲突，先更新文档，或者停下来确认，不要按猜测实现。

## 文档布局

- 高频文档直接放在 `docs/` 下。
- 本地 issue 追踪放在 `docs/issues/` 下。
- 当前结构：
  - `docs/repo_to_harness_template_prd.md`
  - `docs/repo_to_harness_template_technical_spec.md`
  - `docs/repo_to_harness_template_development_plan.md`
  - `docs/testing-strategy.md`
  - `docs/issues/README.md`
  - `docs/issues/open/*.md`
  - `docs/issues/closed/*.md`
- 新的 PRD、技术方案、开发计划优先直接写在 `docs/` 下。

## 本地 Issue 追踪

- 仓库使用 `docs/issues/` 下的本地 Markdown issue 追踪。
- 一个 Markdown 文件对应一个 issue。
- 打开状态的 issue 放在 `docs/issues/open/`。
- 关闭状态的 issue 移到 `docs/issues/closed/`。
- 文件名优先使用 `NNNN-slug.md` 这种稳定格式。

## 产品边界

Cartographer 是一个本地运行的 `TypeScript + Node.js` 工具，用来把一个现有 Git 仓库分支转换成一个可安装的 harness template 仓库。之所以使用 `TS/Node`，是为了直接复用 `pi-ai` 库。

V1 仅支持：

- 每次运行只处理一个 source repository
- 每次运行只生成一个 output template repository
- source snapshot 来自默认分支或一个显式 ref
- discovery 从仓库根目录的 `AGENTS.md` 和 `CLAUDE.md` 开始
- 文件扩展只跟踪显式相对 Markdown 链接
- 输出默认只有一个 member orbit：`workspace`
- 转化后的正式入口只有一个根 `AGENTS.md`
- 根 `AGENTS.md` 使用 harness-level whole-file 语义，并做 runtime marker normalization
- 当源里同时存在 `AGENTS.md` 和 `CLAUDE.md` 时：
  - `AGENTS.md` 继续作为主入口来源
  - `CLAUDE.md` 按普通文件处理
  - `CLAUDE.md` 输出为保留改名路径 `docs/_adapters/claude-code-entry.md`
- curation 必须先形成 plan，并且可审阅
- materialization 写出的必须是 harness template tree，而不是 runtime repo
- 第一阶段采用 library-first 交付，不要求先做正式 CLI

不要引入：

- 以托管服务或 HTTP API 为主路径
- 后台 daemon 或长生命周期 worker
- 直接修改 source repository 工作树
- V1 的自动多 orbit 拆分
- 依赖代码语义重构引擎才能完成基础输出
- 用自由文本路径推断替代显式 Markdown link parsing
- 绕过 plan 校验、直接落盘的 provider 专属写入逻辑

## 架构

采用以 library-first 和 pipeline 层为中心的结构：

- `src/index.ts`
  - library-first 公开入口
- `scripts/`
  - 本地开发脚本和手工运行入口
- `src/app`
  - snapshot、discovery、curation、materialization 的顶层编排
- `src/domain/source`
  - source repo 解析和 snapshot metadata
- `src/domain/discovery`
  - seed 检测、Markdown link traversal、candidate file graph
- `src/domain/curation`
  - keep/drop/rolling 决策和可审阅 plan 构建
- `src/domain/variables`
  - 变量提议、校验和 replacement planning
- `src/domain/materialize`
  - template tree 生成和 manifest 写入
- `src/domain/providers`
  - AI provider adapter 和结构化响应归一化
- `src/lib/git`
  - Git 访问
- `src/lib/fs`
  - 文件系统辅助
- `src/lib/markdown`
  - Markdown 解析、链接提取和链接改写
- `src/lib/paths`
  - repo-relative path 校验和归一化
- `src/schema`
  - Zod schema 和 plan/manifest codec

规则：

- 第一阶段不要让 CLI 壳先于领域模型稳定。
- 如果后续补 CLI，command 文件保持薄。
- provider prompt 逻辑不要放进 materializer 或 file writer。
- provider adapter 不允许直接修改输出仓库。

## Git 与路径规则

- clone/fetch、repo-root 检测、`ls-files`、revision 读取统一调用系统 `git`。
- 优先使用 `spawn` / `execFile` 风格参数列表，不拼接 shell 字符串。
- 普通 Git 操作不要用 `sh -c`。
- 除非明确需要当前目录，否则一律以 source repo root 作为 repo-relative path 的基准。
- 在分类、链接和写 plan 前，先做 repo-relative path normalize。
- 拒绝 path traversal 和 repo 外路径。
- 读取路径列表时优先使用 NUL-delimited Git I/O。

## 状态规则

把下面这些看作互相独立的状态层：

- source snapshot：只读输入
- curation plan：权威审阅产物
- materialized template tree：最终生成输出
- 本地 temp artifact：一次性执行状态

不要混淆：

- source snapshot 不是可以原地修改的缓存
- curation plan 不是最终模板树
- temp 文件不是权威状态
- provider response 只是建议，只有通过校验并合入 plan 后才生效

## 阶段入口

第一阶段优先稳定这些 library 入口：

- `discoverSource`
  - 检查一个 source repo，输出 candidate file set 和 discovery graph
- `buildPlan`
  - 基于 discovered files 生成一个可审阅的 curation plan
- `materializeTemplate`
  - 从一个已批准的 plan 写出 harness template repository
- `bootstrapRepository`
  - 串起 staged workflow，并保留明确的 review control

如果后续补 CLI：

- 使用普通 Node CLI 薄壳
- `pi-ai` 只作为 provider library，不作为命令框架
- 不使用 React 作为第一版交互层

## 输出与日志

- 面向用户的输出走 stdout/stderr，并保持稳定。
- 机器可读命令应支持 `--json`。
- 除非明确要求，不要打印完整文件正文。
- 优先输出路径、数量、决策和 warning 摘要，而不是原始内容。

## 与 Orbit / Harness 的兼容约束

- 如果输入 revision 已经是合法 harness template branch 或 orbit template branch，不要走 Cartographer 转化链。
- Cartographer 未来若接到 `harness install <ordinary-branch>` 路径里，只应用于 plain branch 输入。
- 输出树必须严格符合当前 harness template install source 的最小合同。
- 根 `AGENTS.md` 语义必须与当前 harness template save / install 语义兼容。
- 计划、结果和 provider 输出都应保持语言无关的结构化协议，方便未来被 Go 侧消费或重实现。

## 测试

- 测试规则见 `docs/testing-strategy.md`。
- 为 path normalize、link extraction、rolling classification、variable planning、manifest generation、provider response validation 增加单测。
- 触达 Git 状态的测试必须使用隔离的 temp repository。
- 不修改进程级全局状态时，默认使用并行测试。

## 校验

提交前执行：

```bash
npm run format
npm run lint
npm run typecheck
npm test
```

在 Node/TypeScript 工程骨架落地后，这些检查都是必需项。

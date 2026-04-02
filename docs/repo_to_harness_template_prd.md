# Cartographer 仓库转 Harness Template PRD

版本：v0.1
状态：基线

关联文档：

- `docs/repo_to_harness_template_technical_spec.md`
- `docs/repo_to_harness_template_development_plan.md`
- `docs/testing-strategy.md`

## 1. 文档目的

本文档定义 Cartographer 的首阶段产品模型。

Cartographer 的目标不是做一个通用内容重写平台，也不是在现有源仓库里直接叠加 harness runtime；它要完成的是一条明确的 bootstrap workflow：

1. 拉取现有 Git 仓库；
2. 从 AI 入口文件开始发现候选文档；
3. 生成可审阅的筛选与变量化计划；
4. 落成一个新的、可安装的 harness template 仓库内容。

## 2. 一句话定义

**Cartographer = 一个本地 `TypeScript + Node.js` 工具，直接复用 `pi-ai` 库，把现有 Git 仓库分支中的 AI 入口文档及其显式链接内容，转换成一个可安装的 harness template 仓库。**

## 3. 已冻结结论

### 3.1 产品形态

Cartographer 是本地工具，不是服务端产品。

首阶段采用 library-first 交付，不要求先做正式 CLI。

### 3.2 源仓库只读

源仓库只作为输入快照读取，不在原仓库内直接写计划或模板结果。

### 3.3 V1 输出是一个 Harness Template 仓库

首阶段产出的是一个新的 harness template 仓库内容，而不是 runtime repo，也不是纯中间 Markdown 包。

### 3.4 V1 默认只有一个 Member Orbit

V1 默认只产出一个 member orbit：

- `orbit_id = workspace`

不在 V1 自动做多 orbit 拆分。

### 3.5 Seed Files 保持收敛

发现流程默认只从源仓库根目录的下列入口开始：

- `AGENTS.md`
- `CLAUDE.md`

### 3.6 链接扩展必须显式

“找文件范围”在 V1 只指：

- 解析 Markdown AST
- 追踪显式相对链接
- 只跟踪 repo 内路径

不把自由文本里提到的文件名当作正式链接来源。

### 3.7 Curation 必须可审阅

AI 可以参与分类、变量提议和改写建议，但正式输出必须先进入一个可审阅的 curation plan，再进入 materialize。

### 3.8 根 `AGENTS.md` 采用 Harness 语义

若源仓库根目录存在 `AGENTS.md`，输出模板中的根 `AGENTS.md` 按 harness-level whole-file 语义处理，并在必要时先剥离 runtime block markers，只保留 payload。

### 3.9 `CLAUDE.md` 在双入口场景下只作为适配文件保留

当源仓库根目录同时存在 `AGENTS.md` 和 `CLAUDE.md` 时：

- `AGENTS.md` 作为输出模板唯一的根入口
- `CLAUDE.md` 不再作为第二个根入口
- `CLAUDE.md` 作为普通文件保留，并改名输出到：
  - `docs/_adapters/claude-code-entry.md`
- 所有指向原 `CLAUDE.md` 的链接都要重写到新路径

### 3.10 输出必须符合当前 Harness Template 合同

V1 materialize 出来的仓库树至少要满足当前 harness template branch 的核心合同：

- `.harness/template.yaml`
- `.orbit/orbits/<orbit-id>.yaml`
- 模板文件树本身

并且不生成 `.orbit/config.yaml`。

## 4. 主要用户工作流

### 4.1 Snapshot

用户指定：

- 本地路径或远程 Git 仓库
- 默认分支或一个显式 ref
- 输出目录

系统获取一个只读快照。

### 4.2 Discovery

系统：

1. 检查根目录 `AGENTS.md` / `CLAUDE.md`
2. 解析这些文件中的相对 Markdown 链接
3. 递归得到候选文件闭包
4. 生成稳定排序的候选文件列表

### 4.3 Curation

系统对候选文件生成 plan，至少包括：

- 保留哪些文件
- 排除哪些文件
- 哪些文件视为 rolling content
- 哪些 concrete literal 需要变量化
- 哪些链接需要重写

### 4.4 Materialize

系统把 plan 落成新的模板仓库内容：

- 生成改写后的 Markdown 文件
- 生成 rolling pointer 文件
- 在需要时生成 `docs/_adapters/claude-code-entry.md`
- 生成 `.harness/template.yaml`
- 生成 `.orbit/orbits/workspace.yaml`

## 5. 输入模型

每次运行至少需要：

- source repo locator
- target ref or default branch
- output directory

可选输入：

- 显式排除规则
- 显式 rolling 规则
- provider/model 配置
- harness id override
- orbit id override

## 6. 输出模型

Cartographer 的标准输出分成两个层次：

### 6.1 审阅产物

一个可审阅的 curation plan，至少包含：

- source repo metadata
- discovered file set
- 每个文件的决策
- 变量声明候选
- 链接重写决策

### 6.2 落成后的模板树

一个可安装的 harness template repo tree，形态类似：

```text
.harness/
  template.yaml
.orbit/
  orbits/
    workspace.yaml
AGENTS.md
docs/
  _adapters/
    claude-code-entry.md
  ...
docs/_rolling/
  ...
```

约束：

- 不生成 `.orbit/config.yaml`
- 不生成 `.harness/runtime.yaml`
- 不生成 `.harness/vars.yaml`
- 不写 `.git/*`

## 7. Curation 模型

### 7.1 文件决策类型

V1 至少支持：

- `keep`
- `drop`
- `rolling_pointer`

### 7.2 Rolling Content 策略

rolling content 指高度时效、持续滚动、复制进模板价值低的文件，例如：

- changelog / release notes
- issue tracker snapshots
- status logs
- backlog / TODO / working notes

V1 不直接复制 rolling 文件正文；默认改为一个稳定 pointer 文件，并把入链改写到该 pointer。

### 7.3 Variableization 策略

V1 变量化基于 plan 中的显式替换决策，不允许 provider 直接自由重写输出树。

变量规则：

- 变量名使用 `snake_case`
- 变量是 repo-global 的
- 空 literal 不允许
- 同一 literal 默认不应映射到多个变量名
- 冲突时 fail-closed，要求用户修正 plan

## 8. AI / Provider 角色

AI provider 在 V1 可以负责：

- 文件相关性建议
- rolling 分类建议
- 变量名和描述建议
- 改写建议

但它不是这些内容的权威来源：

- Git tree 真相
- Markdown 链接解析结果
- 最终 materialized 文件写入
- manifest 结构正确性

这些都必须由本地确定性逻辑验证。

## 9. 与 `harness install` 的关系

Cartographer 的直接目的，是服务后续“`harness install` 普通仓库分支”这条能力。

也就是说：

- 输入可以是一个普通仓库分支
- 输出必须是一个与当前 harness template install 合同兼容的模板树
- 当前阶段先把“普通分支 -> 模板树”做成独立工具能力
- 后续再决定是否把它并进 Orbit / harness 主仓库

## 10. 产品边界

V1 范围：

- local tool
- one source repo per run
- one output template repo per run
- root `AGENTS.md` / `CLAUDE.md` seed model
- explicit Markdown link traversal
- single member orbit output
- reviewable plan before materialization
- single root `AGENTS.md` in output
- renamed Claude adapter file when both root entry files exist

不要引入：

- hosted SaaS workflow
- direct source repo mutation
- automatic multi-orbit decomposition
- non-Markdown broad repository mining as the default mode
- unsupported harness/runtime files in the output template tree

## 11. 非目标

本阶段不做：

1. 从任意代码仓库自动推导最佳 orbit decomposition
2. 通用代码模板化平台
3. 运行态 `.harness/runtime.yaml` 生成
4. 直接执行 `harness install`
5. 多 provider 编排或 agent swarm 作为主路径
6. 图像、PDF、二进制内容的一般化模板化支持

## 12. 验收标准

以下结果成立时，视为 V0.1 产品闭环成立：

1. 能从默认分支或显式 ref 获取源仓库快照。
2. 能从根 `AGENTS.md` / `CLAUDE.md` 得到稳定候选文件闭包。
3. 能生成可审阅的 curation plan。
4. 能把 plan 落成 installable harness template repo tree。
5. 输出树中只有一个根 `AGENTS.md` 入口。
6. 当源里同时有 `AGENTS.md` 和 `CLAUDE.md` 时，`CLAUDE.md` 会稳定落成 `docs/_adapters/claude-code-entry.md`。
7. 输出树满足当前 harness template manifest 和 member definition 的最小合同。

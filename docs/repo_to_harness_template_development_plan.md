# Cartographer 仓库转 Harness Template 开发计划

版本：v0.1
状态：执行基线

关联文档：

- `docs/repo_to_harness_template_prd.md`
- `docs/repo_to_harness_template_technical_spec.md`
- `docs/testing-strategy.md`

## 1. 文档目标

本文档给出 Cartographer 首阶段的开发顺序、阶段边界和收口标准。

目标是明确：

1. 先做什么、后做什么；
2. 哪些能力必须先冻结；
3. 哪些代码边界要先搭骨架；
4. 每阶段的验证要求。

## 2. 事实来源

开发顺序以下列文档为准：

1. `docs/repo_to_harness_template_prd.md`
2. `docs/repo_to_harness_template_technical_spec.md`
3. `docs/testing-strategy.md`
4. `CONTRIBUTING.md`
5. `AGENTS.md`

## 3. 总体开发策略

### 3.1 核心原则

- 先把确定性 pipeline 搭好，再接 provider。
- 先做 reviewable plan，再做最终 materialize。
- provider 只给建议，不直接落盘。
- installable harness template 合同要尽早冻结并用测试保护。
- 先交付 single-member output，再考虑多 orbit。
- 第一阶段采用 library-first，不要求先搭正式 CLI。
- `TS/Node` 的直接目的，是复用 `pi-ai` 库，而不是为了做前端界面。

### 3.2 开发排序原则

推荐按下面顺序推进：

1. foundations
2. source snapshot + discovery
3. curation plan
4. materialize
5. provider integration
6. orbit compatibility and optional CLI

这样排序的原因：

- discovery 不稳定，后面的 curation 和 materialize 都没有可靠输入；
- 没有 plan，provider 接入会很容易变成自由重写；
- 没有 materialize 合同，输出树会漂移成“看起来像模板”的中间结果。
- 没有兼容边界前，太早做 CLI 只会把产品接口冻结在错误层面。

## 4. 阶段划分

## Phase 0：基础设施

目标：

- 初始化 Node/TypeScript 工程
- library 入口骨架
- lint / format / typecheck / test 脚本
- 基础 schema 与错误类型
- 最薄的开发脚本入口

完成标准：

- 能运行空 library 入口
- `npm run lint`
- `npm run typecheck`
- `npm test`

## Phase 1：Source Snapshot 与 Discovery

目标：

- source repo resolution
- temp checkout / snapshot metadata
- root `AGENTS.md` / `CLAUDE.md` seed detection
- Markdown relative link traversal

完成标准：

- 能从 fixture repo 生成稳定 discovery graph
- 循环链接不会死循环
- repo 外链接被稳定忽略

## Phase 2：Curation Plan

目标：

- file decision model
- rolling heuristics
- link rewrite planning
- variable declaration planning
- approved/draft plan schema
- `CLAUDE.md` adapter 改名规则

完成标准：

- 能输出稳定的 `curation plan`
- path / variable / rewrite 冲突会 fail-closed
- provider 未接入时也能靠确定性规则生成 plan

## Phase 3：Materialize

目标：

- plan -> harness template tree
- root `AGENTS.md` normalization
- dual-root 输入下的 `CLAUDE.md` adapter 输出
- rolling pointer generation
- `.harness/template.yaml` writing
- `.orbit/orbits/workspace.yaml` writing

完成标准：

- 产物不包含 forbidden output paths
- manifest 与 variable table 自洽
- 生成结果可被本地校验视为一个有效 harness template tree

## Phase 4：Provider Integration

目标：

- `pi-ai` adapter interface
- structured prompt / response schema
- rolling and variable suggestions
- review gate hardening

完成标准：

- provider 输出经过 schema 校验后才能进入 plan
- provider 失效时 deterministic path 仍可工作
- 输出 contract 不因 provider 差异而漂移

## Phase 5：Orbit 兼容与可选 CLI

目标：

- Orbit / `harness install` 集成约束
- plain branch 与 template branch 的分流约束
- 可选的 Node CLI 薄壳
- JSON/text output contracts
- richer integration fixtures
- docs and examples alignment

完成标准：

- library outputs 有稳定测试
- 如果补 CLI，CLI outputs 有稳定测试
- docs and examples match current command behavior
- main workflow has one end-to-end integration path

## 5. 建议 PR 拆分

建议分支名：

- `feature/foundations`
- `feature/discovery-graph`
- `feature/curation-plan`
- `feature/materialize-template`
- `feature/pi-ai-adapter`
- `feature/orbit-compat-and-cli`

每个阶段一个主 PR，避免跨阶段混合。

## 6. 验证要求

每个阶段结束前至少运行：

```bash
npm run format
npm run lint
npm run typecheck
npm test
```

如果分支已经补了 CLI 工作流，再额外运行：

```bash
npm run test:integration
```

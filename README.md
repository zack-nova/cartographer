# Cartographer

Cartographer 是一个本地 `TypeScript + Node.js` 工具，用来把一个现有 Git 仓库分支转换成一个可安装的 harness template 仓库。

这个仓库的直接目标，是为未来 `harness install` 普通仓库分支的能力做准备。之所以采用 `TS/Node`，是为了直接复用 `pi-ai` 库，并把 AI 辅助限制在可审阅、可校验的 plan 流程里，而不是让模型直接落盘最终结果。

## 这个仓库当前在做什么

当前阶段是 `v0.1` 基线，重点是先定义清楚产品边界和实现合同，再进入代码实现。

首阶段默认 workflow：

1. 读取 source repo 的默认分支或显式 ref。
2. 从根 `AGENTS.md` / `CLAUDE.md` 开始做文档发现。
3. 生成可审阅的 curation plan。
4. 落成一个 installable harness template tree。

当前已冻结的关键约束：

- 输出侧只有一个根 `AGENTS.md`。
- 如果源里同时存在 `AGENTS.md` 和 `CLAUDE.md`：
  - `AGENTS.md` 继续作为主入口
  - `CLAUDE.md` 作为普通文件保留
  - 输出到 `docs/_adapters/claude-code-entry.md`
- 第一阶段采用 library-first 交付，不要求先做正式 CLI。
- 输出必须符合当前 harness template 合同：
  - `.harness/template.yaml`
  - `.orbit/orbits/workspace.yaml`
  - 不生成 `.orbit/config.yaml`
  - 不生成 runtime `.harness/*`

## 开发入口

如果你要继续开发，先读：

1. [AGENTS.md](/Users/miles/Code/Vocation/cartographer/AGENTS.md)
2. [docs/repo_to_harness_template_prd.md](/Users/miles/Code/Vocation/cartographer/docs/repo_to_harness_template_prd.md)
3. [docs/repo_to_harness_template_technical_spec.md](/Users/miles/Code/Vocation/cartographer/docs/repo_to_harness_template_technical_spec.md)
4. [docs/repo_to_harness_template_development_plan.md](/Users/miles/Code/Vocation/cartographer/docs/repo_to_harness_template_development_plan.md)
5. [docs/testing-strategy.md](/Users/miles/Code/Vocation/cartographer/docs/testing-strategy.md)

## 计划中的代码形态

首阶段建议先做这些 library 入口：

- `discoverSource`
- `buildPlan`
- `materializeTemplate`
- `bootstrapRepository`

如果后续补 CLI，建议只包一层很薄的 Node CLI，不用 React，不把 `pi-ai` 当命令框架。

## 仓库状态

当前仓库主要包含文档骨架和开发约束，Node/TypeScript 工程骨架尚未初始化。

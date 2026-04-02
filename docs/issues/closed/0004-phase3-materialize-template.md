# ISSUE-0004 Phase 3 Materialize Template

- Status: closed
- Priority: high
- Owner:
- Created: 2026-04-02
- Updated: 2026-04-02

## Summary

实现 `plan -> harness template tree` 的 materialize 主链路，写出根 `AGENTS.md`、`CLAUDE.md` adapter、rolling pointer、`.harness/template.yaml` 和 `.orbit/orbits/workspace.yaml`，形成可安装模板树。

## Scope

- root `AGENTS.md` normalization
- dual-root 输入下的 `CLAUDE.md` adapter 输出
- rolling pointer 文件生成
- `.harness/template.yaml` 写入
- `.orbit/orbits/workspace.yaml` 写入
- 输出树 forbidden path 校验
- 变量表与最终输出扫描对齐

## Done When

- 可以从一个 approved plan 生成完整 harness template tree
- 输出中只有一个根 `AGENTS.md`
- `CLAUDE.md` 不会作为第二个根入口落盘
- forbidden output path 不会出现
- 生成结果满足当前 harness template 最小合同

## Resolution

- 已实现 `materializeTemplate` 公开入口，并要求输入 plan 为 `approved`
- 已实现 root `AGENTS.md` runtime marker strip，非法 marker 结构 fail-closed
- 已实现双入口场景下的 `CLAUDE.md` adapter 输出与 Markdown link rewrite
- 已实现 rolling pointer 文件生成
- 已实现 `.harness/template.yaml` 和 `.orbit/orbits/workspace.yaml` 的稳定写入
- 已实现 Claude-only source root 提升为输出侧唯一根 `AGENTS.md`
- 已实现 forbidden output path 拒绝和稳定 `writtenPaths` 返回
- 已通过单元测试和集成测试覆盖关键 Phase 3 场景

## Notes

- 对应 `docs/repo_to_harness_template_development_plan.md` 的 `Phase 3：Materialize`
- 建议实现分支：`feature/materialize-template`
- 默认依赖 `0003-phase2-curation-plan.md`

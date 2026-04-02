# ISSUE-0003 Phase 2 Curation Plan

- Status: closed
- Priority: high
- Owner:
- Created: 2026-04-02
- Updated: 2026-04-02

## Summary

实现可审阅的 curation plan，把 discovered file set 转成稳定的保留、排除、rolling、变量化和链接重写决策，并冻结 `CLAUDE.md` adapter 的改名规则。

## Scope

- `CurationPlan` schema
- file decision model：
  - `keep`
  - `drop`
  - `rolling_pointer`
- rolling heuristics
- link rewrite planning
- variable declaration planning
- plan 状态：
  - `draft`
  - `approved`
- `CLAUDE.md` adapter 输出路径规则
- 冲突 fail-closed：
  - path
  - variable
  - rewrite

## Done When

- 可以生成稳定排序的 curation plan
- provider 未接入时也能靠确定性逻辑生成 plan
- `CLAUDE.md` 在双入口场景下能稳定映射到 `docs/_adapters/claude-code-entry.md`
- 路径和变量冲突会 fail-closed

## Resolution

- 已实现 `buildPlan` 公开入口，并输出稳定的 `CurationPlan`
- 已实现 `keep` / `drop` / `rolling_pointer` 决策模型
- 已实现默认 rolling heuristic、显式排除规则和显式 rolling 规则
- 已实现 `CLAUDE.md` adapter 保留路径 `docs/_adapters/claude-code-entry.md`
- 已实现 link rewrite plan 生成，覆盖入链改写与 Claude adapter 出链改写
- 已实现变量声明校验，包括非法命名、空 literal、重复 literal 冲突
- 已实现输出路径冲突 fail-closed
- 已通过单元测试和集成测试覆盖关键 Phase 2 场景

## Notes

- 对应 `docs/repo_to_harness_template_development_plan.md` 的 `Phase 2：Curation Plan`
- 建议实现分支：`feature/curation-plan`
- 默认依赖 `0002-phase1-source-snapshot-and-discovery.md`

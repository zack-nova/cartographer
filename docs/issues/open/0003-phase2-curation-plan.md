# ISSUE-0003 Phase 2 Curation Plan

- Status: open
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

## Notes

- 对应 `docs/repo_to_harness_template_development_plan.md` 的 `Phase 2：Curation Plan`
- 建议实现分支：`feature/curation-plan`
- 默认依赖 `0002-phase1-source-snapshot-and-discovery.md`

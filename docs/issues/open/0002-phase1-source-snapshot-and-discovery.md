# ISSUE-0002 Phase 1 Source Snapshot And Discovery

- Status: open
- Priority: high
- Owner:
- Created: 2026-04-02
- Updated: 2026-04-02

## Summary

实现 source repo snapshot 与 discovery graph 主链路，让 Cartographer 可以从普通仓库分支稳定读取根 `AGENTS.md` / `CLAUDE.md`，递归解析显式 Markdown 相对链接，并输出稳定候选文件集合。

## Scope

- source repo locator 解析
- 默认分支与显式 ref 解析
- temp checkout / snapshot metadata
- 根 `AGENTS.md` / `CLAUDE.md` seed 检测
- Markdown AST 解析
- 显式相对链接提取
- discovery graph 构建
- 循环链接防护
- repo 外路径拒绝

## Done When

- 可以从 fixture repo 生成稳定 discovery graph
- 仅跟踪显式相对 Markdown 链接
- 循环引用不会死循环
- repo 外路径和外链被稳定忽略或拒绝

## Notes

- 对应 `docs/repo_to_harness_template_development_plan.md` 的 `Phase 1：Source Snapshot 与 Discovery`
- 建议实现分支：`feature/discovery-graph`
- 默认依赖 `0001-phase0-foundations.md`

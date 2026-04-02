# ISSUE-0006 Phase 5 Orbit Compat And Optional CLI

- Status: open
- Priority: medium
- Owner:
- Created: 2026-04-02
- Updated: 2026-04-02

## Summary

收口 Cartographer 与 Orbit / `harness install` 的兼容边界，明确 plain branch 与 template branch 的分流规则，并在需要时补一个很薄的 Node CLI 壳。

## Scope

- Orbit / `harness install` 集成约束
- plain branch 与 template branch 分流
- helper-process / 独立工具模式边界
- 可选的 Node CLI 薄壳
- JSON/text output contracts
- richer integration fixtures
- docs and examples alignment

## Done When

- Cartographer 只在 plain branch 输入上触发
- 现有 harness / orbit template branch 不会误走转化链
- library 输出 contract 有稳定测试
- 若补 CLI，CLI 输出 contract 也有稳定测试
- 文档与实际行为保持一致

## Notes

- 对应 `docs/repo_to_harness_template_development_plan.md` 的 `Phase 5：Orbit 兼容与可选 CLI`
- 建议实现分支：`feature/orbit-compat-and-cli`
- 默认依赖 `0005-phase4-pi-ai-adapter.md`

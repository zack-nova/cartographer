# ISSUE-0001 Phase 0 Foundations

- Status: open
- Priority: high
- Owner:
- Created: 2026-04-02
- Updated: 2026-04-02

## Summary

初始化 Cartographer 的首个可运行开发骨架，建立 `TypeScript + Node.js` 工程、library-first 入口、基础脚本、测试框架和最小目录结构，为后续 discovery / curation / materialize 提供稳定宿主。

## Scope

- 初始化 `package.json`
- 初始化 `tsconfig.json`
- 补齐基础脚本：
  - `format`
  - `lint`
  - `typecheck`
  - `test`
- 建立目录骨架：
  - `src/index.ts`
  - `src/app/`
  - `src/domain/`
  - `src/lib/`
  - `src/schema/`
  - `tests/integration/`
  - `scripts/`
- 选择并接入最小测试框架与运行方式
- 增加最薄的开发脚本入口

## Done When

- 可以运行一个空的 library 入口
- 可以运行基础 lint / typecheck / test 脚本
- 目录结构与 `docs/repo_to_harness_template_technical_spec.md` 对齐
- 基础开发脚本可用于后续手工驱动阶段性能力

## Notes

- 对应 `docs/repo_to_harness_template_development_plan.md` 的 `Phase 0：基础设施`
- 建议实现分支：`feature/foundations`
- 后续阶段默认依赖本 issue 完成

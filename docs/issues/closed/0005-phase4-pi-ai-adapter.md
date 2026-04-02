# ISSUE-0005 Phase 4 Pi-AI Adapter

- Status: closed
- Priority: medium
- Owner:
- Created: 2026-04-02
- Updated: 2026-04-02

## Summary

接入 `pi-ai` adapter，把 AI 能力限制在结构化建议层，让 rolling 建议、变量命名建议和改写建议进入 plan，但不允许 provider 直接写最终输出。

## Scope

- `pi-ai` adapter interface
- prompt assembly
- response schema
- response normalization
- review gate hardening
- provider failover / unavailable behavior

## Done When

- `pi-ai` 输出经过 schema 校验后才能进入 plan
- provider 失效时确定性路径仍可工作
- provider 差异不会改变 materialize 合同
- provider 不会绕过本地校验直接写文件

## Resolution

- 已实现 provider adapter 接口和 `createPiAiPlanSuggestionProvider`
- 已实现 prompt assembly，把 deterministic plan 与 Markdown 文件上下文送入 provider
- 已实现 provider response schema 和语义校验
- 已实现 provider 建议对 `buildPlan` 的受控合并：
  - file decision adjustments
  - rewrite reasons
  - variable suggestions
- 已实现 provider unavailable / invalid response 回退到 deterministic plan
- provider 仍然无法直接触达 materialize 或文件写入路径
- 已通过单元测试和集成测试覆盖关键 Phase 4 场景

## Notes

- 对应 `docs/repo_to_harness_template_development_plan.md` 的 `Phase 4：Provider Integration`
- 建议实现分支：`feature/pi-ai-adapter`
- 默认依赖 `0004-phase3-materialize-template.md`

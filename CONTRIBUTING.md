# Contributing

本仓库采用一套轻量但明确的协作约束：分支开发、提交前本地校验、通过 Pull Request 合并回 `main`。

## Git Workflow

对于较大的功能、架构调整或行为变更，先完成方案对齐，再开始实现。

1. 从 `main` 拉分支开发。
2. 分支命名建议：
   - `feature/<topic>`
   - `fix/<topic>`
   - `docs/<topic>`
   - `chore/<topic>`
3. 提交信息保持清晰、描述式、祈使句。
4. 通过 Pull Request 合并回 `main`，不要直接往 `main` 推功能改动。

示例：

```bash
git checkout main
git pull --ff-only
git checkout -b feature/discovery-graph
```

## Before Every Commit

提交前执行：

```bash
npm run format
npm run lint
npm run typecheck
npm test
```

如果仓库此时还没有 Node/TypeScript 工具链，那么引入可运行代码的分支也应同时补齐对应脚本。

## Before Merge

在合并核心行为改动前，再额外跑一轮端到端 smoke path：

```bash
npm run test:integration
```

目的是确认 discovery、curation 和 materialization 仍然能作为一条完整 CLI workflow 协同工作。

## Code Style

当前默认约束：

- TypeScript 必须在 strict mode 下通过编译。
- 对外暴露的 schema 和 plan payload 必须显式校验。
- 错误处理必须明确，不能静默吞掉失败。
- 命名保持具体、可读，避免模糊 helper 和无边界的 util 堆积。
- 新增逻辑默认需要配套测试。
- provider adapter 必须待在清晰的接口后面，并返回结构化数据。

## Pull Request Expectations

PR 描述至少应包含：

- 变更目的
- 主要修改点
- 本地验证方式
- 是否影响命令行为、plan schema 或输出树合同

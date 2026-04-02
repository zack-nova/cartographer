# Cartographer 测试策略

本文档定义 Cartographer V1 的测试策略。

测试面围绕 staged bootstrap workflow 展开：

- source snapshot
- 从根 AI 入口文件出发的 discovery
- curation plan generation
- harness template materialization

如果本文件与 PRD 或技术方案冲突，以那两份文档为准，并先更新它们或停下来对齐。

## 1. 测试目标

Cartographer 的测试需要保证五件事：

1. source repository 被当作只读输入处理。
2. discovery 能从显式 Markdown 链接中得到稳定的 candidate set。
3. curation 决策可审阅、该确定性的地方保持确定性，并在冲突时 fail-closed。
4. materialized output 符合 harness template 合同。
5. library 入口必须稳定；如果后续补 CLI，CLI 的 text 和 JSON 结果也必须稳定。

## 2. 测试金字塔

Cartographer 首阶段需要两层主测试，外加一层后置测试。

### 2.1 第一层：单元测试

用于纯逻辑、schema 校验、路径处理、文本变换和本地 adapter。

优先覆盖：

- `src/lib/paths`
  - repo-relative normalization
  - path traversal rejection
- `src/lib/markdown`
  - relative link extraction
  - fragment stripping
  - rewrite helpers
- `src/domain/discovery`
  - seed detection
  - recursive closure
  - cycle handling
- `src/domain/curation`
  - keep/drop/rolling decisions
  - rewrite planning
- `src/domain/variables`
  - variable name validation
  - literal conflict detection
- `src/domain/materialize`
  - pointer file generation
  - root `AGENTS.md` normalization
  - manifest generation
- `src/domain/providers`
  - response schema validation
  - invalid structured output rejection

要求：

- 不修改进程级全局状态时，默认并行
- 一个用例只测一个职责
- 不要把 Git 搭建、CLI 执行和业务规则判断混在一个 unit test 里

### 2.2 第二层：集成测试

首阶段优先从真实 library / 脚本边界出发，使用隔离的 temp Git repository。

必须覆盖：

- `discoverSource` / 开发脚本 discover 路径
  - detects root `AGENTS.md`
  - detects root `CLAUDE.md`
  - follows relative Markdown links
  - ignores external links
  - handles cycles
- `buildPlan` / 开发脚本 curate 路径
  - emits stable plan shape
  - marks rolling files
  - validates variable conflicts
  - keeps JSON output stable
- `materializeTemplate` / 开发脚本 materialize 路径
  - writes `.harness/template.yaml`
  - writes `.orbit/orbits/workspace.yaml`
  - writes one root `AGENTS.md`
  - rewrites root `CLAUDE.md` to `docs/_adapters/claude-code-entry.md` when both exist
  - writes transformed Markdown files
  - rewrites rolling links to pointer files
  - does not write forbidden paths
- `bootstrapRepository`
  - can run end-to-end on a temp source repo fixture

执行规则：

- 每个测试使用独立 temp repo
- 显式初始化 Git user config
- 隔离用户级 Git config
- 优先走真实 library / 脚本边界，而不是内部 helper shortcut

### 2.3 第三层：后置测试

这些不是 V1 起步阶段的必需项：

- live remote provider contract tests
- large repository performance tests
- network retry / backoff chaos tests
- benchmark suites
- 正式 CLI smoke tests

只有在真实使用场景证明复杂度值得时再补。

## 3. 最低覆盖矩阵

代码落地后，下面这些场景必须有覆盖。

### 3.1 Git 与 Snapshot 安全性

- non-Git source path fails
- subdirectory source still resolves repo root
- explicit ref resolves to the expected commit
- source snapshot is not mutated during the run

### 3.2 Discovery

- root `AGENTS.md` missing
- root `CLAUDE.md` missing
- one seed file only
- both seed files present
- both root files present with distinct content
- relative Markdown link to root file
- relative Markdown link to nested file
- fragment-only link ignored
- external URL ignored
- repo-external relative path rejected
- cyclic links terminate safely

### 3.3 Curation

- stable file ordering
- `keep` decision
- `drop` decision
- `rolling_pointer` decision
- rolling pointer destination path generation
- same literal mapped to two variable names fails
- invalid variable name fails
- empty literal fails

### 3.4 Root `AGENTS.md`

- plain file passes through
- runtime markers are stripped to payload
- invalid marker structure fails closed

### 3.5 Claude Adapter

- when both root files exist, `CLAUDE.md` is written to `docs/_adapters/claude-code-entry.md`
- inbound links to `CLAUDE.md` are rewritten to the adapter path
- outbound relative links inside the renamed Claude adapter remain valid after relocation
- reserved Claude adapter output path conflict fails closed

### 3.6 Materialize

- `.harness/template.yaml` is present and valid
- `.orbit/orbits/workspace.yaml` is present and valid
- `includes_root_agents=true` when root `AGENTS.md` exists
- `includes_root_agents=false` when root `AGENTS.md` is absent
- rolling pointer files are written
- rewritten links point at pointer files
- no root `CLAUDE.md` is written in the output tree
- `.orbit/config.yaml` is not written
- `.harness/runtime.yaml` is not written
- `.git/*` is not written

## 4. 测试约束

- 所有 repo fixture 都使用 temp directory。
- 不依赖开发者本机的全局 Git config。
- 默认测试套件里不要发真实网络请求。
- 除非测试目标明确是 provider contract，否则 unit 和 integration test 里都 mock provider adapter。
- fixture repository 保持小而明确。

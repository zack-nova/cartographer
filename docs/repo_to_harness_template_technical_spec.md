# Cartographer 仓库转 Harness Template 技术方案

版本：v0.1
状态：实现基线

关联文档：

- `docs/repo_to_harness_template_prd.md`
- `docs/repo_to_harness_template_development_plan.md`
- `docs/testing-strategy.md`

## 1. 文档定位

本文档定义 Cartographer 的首阶段技术实现方案。

它回答的问题是：

1. 用什么技术栈实现；
2. 代码边界如何分层；
3. snapshot / discovery / curation / materialize 四段流程如何收口；
4. 哪些行为在 V1 直接冻结。

## 2. 已冻结结论

1. Cartographer 使用 `TypeScript + Node.js` 实现，直接复用 `pi-ai` 库。
2. 第一阶段采用 library-first 交付，不要求先做正式 CLI。
3. Git 操作继续调用系统 `git`，不引入 Git 语义重实现。
4. provider 的结果只能进入 plan，不能直接写最终输出。
5. discovery 只跟踪显式相对 Markdown 链接。
6. V1 只产出单 member harness template，默认 `orbit_id=workspace`。
7. 输出模板树必须符合当前 harness template install source 的最小合同：
   - `.harness/template.yaml`
   - `.orbit/orbits/<orbit-id>.yaml`
   - repo files
   - 禁止 `.orbit/config.yaml`
8. 输出只有一个根 `AGENTS.md`。
9. 当源里同时存在 `AGENTS.md` 和 `CLAUDE.md` 时，`CLAUDE.md` 要作为普通文件改名输出到 `docs/_adapters/claude-code-entry.md`。
10. 根 `AGENTS.md` 走 harness-level whole-file lane，并在 materialize 前做 runtime marker strip。

## 3. 技术栈与基础约束

### 3.1 Runtime

- Node.js 22+
- TypeScript 5.x
- ESM-first project layout

### 3.2 核心依赖

- provider library: `pi-ai`
- schema validation: `zod`
- Markdown parsing: `unified` + `remark-parse`
- YAML writing: `yaml`
- tests: `vitest`

说明：

- `pi-ai` 是 provider 接入库，不是命令框架。
- 第一阶段不使用 React。
- 如果后续补 CLI，优先使用普通 Node CLI 薄壳，例如 `commander`。

### 3.3 Git Access

- 使用系统 `git`
- 用 `spawn` / `execFile` 封装调用
- 不用 `sh -c`
- 优先在 repo root 下执行
- 读取路径列表时优先使用 NUL-delimited 输出

## 4. 目录与分层

建议目录：

```text
src/
  index.ts
  app/
  domain/
    source/
    discovery/
    curation/
    variables/
    materialize/
    providers/
  lib/
    fs/
    git/
    markdown/
    paths/
    text/
  schema/
tests/
  integration/
scripts/
```

分层规则：

- `index.ts` 暴露稳定的 library 入口
- `app/` 负责流程编排
- `domain/` 负责产品逻辑
- `lib/` 负责无产品语义的技术适配
- `schema/` 负责 plan / manifest 的结构校验
- `scripts/` 只用于开发期手工驱动，不承载正式产品合同

## 5. 核心数据模型

### 5.1 Source Snapshot

```ts
type SourceSnapshot = {
  repoLocator: string;
  requestedRef: string | null;
  resolvedRef: string;
  commit: string;
  rootDir: string;
};
```

### 5.2 Discovery Graph

```ts
type DiscoveryGraph = {
  seedPaths: string[];
  discoveredPaths: string[];
  edges: Array<{
    from: string;
    to: string;
    kind: "markdown_link";
  }>;
};
```

### 5.3 Curation Plan

```ts
type CurationPlan = {
  version: 1;
  source: SourceSnapshot;
  discoveredPaths: string[];
  harnessId: string;
  orbitId: string;
  status: "draft" | "approved";
  files: Array<{
    path: string;
    decision: "keep" | "drop" | "rolling_pointer";
    reason?: string;
    outputPath?: string;
  }>;
  rewrites: Array<{
    from: string;
    to: string;
    sourceOutputPath: string;
    targetOutputPath: string;
    replacementHref: string;
  }>;
  variables: Array<{
    name: string;
    description?: string;
    replacements: Array<{
      path: string;
      literal: string;
    }>;
  }>;
};
```

### 5.4 Materialized Template

materialize 输出不再依赖 provider 原始响应，而是完全依赖经 schema 校验后的 plan。

```ts
type MaterializeTemplateResult = {
  outputDir: string;
  writtenPaths: string[];
};
```

## 6. 关键流程

## 6.1 Snapshot

流程：

1. 解析本地路径或远程 Git repo locator
2. 解析默认分支或显式 ref
3. 建立只读的 commit snapshot
4. 记录最终 commit 和 root dir

约束：

- 不直接改源仓库
- 不把 snapshot 目录当输出目录复用
- V1 可以通过只读 Git object 读取来实现 snapshot；不强制要求 temp checkout

## 6.2 Discovery

流程：

1. 检查根 `AGENTS.md`
2. 检查根 `CLAUDE.md`
3. 若存在，则加入 seed set
4. 对 seed 和后续发现的 Markdown 文件解析 AST
5. 读取所有显式相对链接
6. 丢弃：
   - 外链
   - 锚点链接
   - repo 外路径
7. 稳定排序输出 discovery graph

V1 规则：

- 只解析 Markdown 文件
- 只把 `.md` 目标继续递归为下一层发现源
- 非 Markdown 文件可作为存在性目标记录，但不继续递归
- root `CLAUDE.md` 可以作为 discovery seed，但不意味着它会作为输出根入口保留

## 6.3 Curation

curation 分两层：

### 确定性层

确定性逻辑负责：

- repo-relative path normalize
- 默认排除规则
- 默认 rolling heuristics
- link back-reference 收集
- root `AGENTS.md` marker normalization
- `CLAUDE.md` adapter 输出路径保留规则

### Provider 辅助层

provider 可提供：

- rolling 建议
- drop 建议
- variable 名称和描述建议
- rewrite 文案建议

但 provider 输出必须经过：

- schema 校验
- path 存在性校验
- 冲突校验
- 保留输出路径冲突校验

V1 的 `buildPlan` 公开入口默认支持：

- `harnessId` override
- `orbitId` override
- `excludePaths`
- `rollingPaths`
- `variables`

并在返回前通过本地 schema 校验 plan 结构。

## 6.4 Rolling Pointer Strategy

V1 rolling 文件不直接复制正文。

materialize 时：

1. 原 rolling 文件不进入主模板内容
2. 为每个 rolling 文件生成一个 pointer 文件：

```text
docs/_rolling/<slug>.md
```

3. 所有指向原 rolling 文件的 Markdown 链接改写到对应 pointer 文件

pointer 文件至少包含：

- 原始源路径
- 为什么该文件被视为 rolling
- 该模板仓库不包含其正文的说明

## 6.5 Variableization

V1 不做 provider 自由重写整文件。

materialize 只应用 plan 中显式记录的替换：

- `literal -> $variable_name`

规则：

- 变量名校验为 `snake_case`
- 空 literal 直接报错
- 若同一 literal 在同一 plan 中映射到多个变量名，默认 fail-closed
- 所有最终输出文件再次扫描 `$var_name`，并与 manifest 变量表对齐

## 6.6 `CLAUDE.md` Adapter 处理

当源仓库根目录同时存在 `AGENTS.md` 和 `CLAUDE.md` 时：

1. `AGENTS.md` 继续作为根入口来源；
2. `CLAUDE.md` 视为普通 Markdown 文件；
3. 它的输出目标路径固定为：
   - `docs/_adapters/claude-code-entry.md`
4. 所有指向源 `CLAUDE.md` 的入链都要改写到新路径；
5. `CLAUDE.md` 自身的出链也要按新位置重写相对路径；
6. 若有其他文件也想写到该保留路径，materialize fail-closed。

## 6.7 Root `AGENTS.md` Handling

若根目录存在 `AGENTS.md`：

1. 先读取整文件
2. 若检测到 runtime block marker，则做 marker strip，只保留有序 payload
3. 再执行变量替换
4. 输出到模板仓库根目录 `AGENTS.md`
5. 在 `.harness/template.yaml` 中写 `includes_root_agents=true`

若只有根 `CLAUDE.md` 而没有根 `AGENTS.md`，则允许用其内容生成输出侧唯一根 `AGENTS.md`。
此时 `.harness/template.yaml` 中的 `includes_root_agents=false`，因为 source root `AGENTS.md` 并不存在。

## 6.8 Materialize

materialize 负责生成完整 harness template tree。

入口约束：

- 默认只接受 `status=approved` 的 plan
- 可以接收 `createdAt` override 以支持稳定测试和可重复输出
- 返回 `writtenPaths`，用于上层脚本或后续 CLI 输出稳定摘要

### `.harness/template.yaml`

至少写出：

```yaml
schema_version: 1
kind: harness_template
template:
  harness_id: <harness-id>
  default_template: false
  created_from_branch: <resolved-ref>
  created_from_commit: <commit>
  created_at: <timestamp>
  includes_root_agents: <bool>
members:
  - orbit_id: workspace
variables:
  ...
```

### `.orbit/orbits/workspace.yaml`

V1 默认生成单 member definition。

建议规则：

- `id: workspace`
- `description: Workspace template orbit`
- `include` 使用 materialized kept file paths 的显式列表
- 不包含 `.harness/template.yaml`
- 不包含 `.orbit/orbits/workspace.yaml` 自身

### 典型输出树

```text
.harness/
  template.yaml
.orbit/
  orbits/
    workspace.yaml
AGENTS.md
docs/
  _adapters/
    claude-code-entry.md
```

### 禁止输出

禁止写出：

- `.orbit/config.yaml`
- `.harness/runtime.yaml`
- `.harness/vars.yaml`
- `.git/*`

## 7. 入口与 CLI 方案

第一阶段优先暴露 library 入口：

- `discoverSource`
- `buildPlan`
- `materializeTemplate`
- `bootstrapRepository`

开发期可以加一个很薄的脚本入口，例如：

- `scripts/dev.ts`

正式 CLI 后置。

若后续补 CLI，约束如下：

- 用普通 Node CLI 薄壳，不用 React
- `pi-ai` 只负责 provider 调用，不负责命令分发
- 所有命令都支持 `--json`
- `materialize` 默认只接受 `status=approved` 的 plan
- `bootstrap` 可以串联前述阶段，但仍应保留 review gate

## 8. Provider 边界

provider adapter 只负责：

- prompt assembly
- response parsing
- schema normalization

不负责：

- Git checkout
- file system writes
- final manifest writing
- repo path validation

## 9. 与 Orbit / `harness install` 的兼容约束

未来如果把这条能力并进 Orbit / harness 主仓库，至少要满足：

1. 若输入 revision 已经是合法 harness template branch，优先走现有 harness template install 路径；
2. 若输入 revision 已经是合法 orbit template branch，优先走现有 orbit template install 路径；
3. Cartographer 转化链只应用于 plain branch 输入；
4. 输出必须满足当前 harness template install source loader 的文件合同；
5. 根 `AGENTS.md` 的 whole-file 语义和 marker strip 行为必须与现有 harness 逻辑兼容；
6. plan、result、provider payload 都要保持语言无关的结构化协议，方便未来 Go 侧调用或重实现；
7. 不要让 Node runtime 成为 Orbit 核心内核的隐式强依赖，首次集成更适合 helper-process 或独立工具模式。

## 10. 测试要求

新增必须覆盖：

1. seed detection
2. relative Markdown link traversal
3. cycle-safe recursive discovery
4. repo-root path normalization
5. rolling pointer generation
6. root `AGENTS.md` marker strip
7. dual-root 输入下 `CLAUDE.md` -> `docs/_adapters/claude-code-entry.md`
8. renamed Claude adapter 的入链与出链重写
9. variable conflict validation
10. `.harness/template.yaml` generation
11. `.orbit/orbits/workspace.yaml` generation
12. forbidden output paths do not appear

## 11. 非目标

本阶段不做：

1. 多 orbit 自动拆分
2. 通用非 Markdown 内容图谱
3. provider 直写文件
4. 源仓库就地修改
5. 服务端任务队列或异步 worker 架构

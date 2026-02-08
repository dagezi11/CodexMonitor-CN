# App-Server 事件参考（Codex `41b4962b0a7f5d73bb23d329ad9bb742545f6a2c`）

本文档用于帮助 agent 快速回答以下问题：
- CodexMonitor 当前支持哪些 app-server 事件。
- CodexMonitor 当前会发送哪些 app-server 请求。
- 在 CodexMonitor 中应去哪里补齐支持。
- 在 `../Codex` 中应去哪里对照事件清单并定位发射点。

更新本文档时请执行：
1. 使用 `git -C ../Codex rev-parse HEAD` 更新标题中的 Codex hash。
2. 对比 Codex 事件清单与 CodexMonitor 路由清单。
3. 对比 Codex 请求方法清单与 CodexMonitor 出站请求方法。
4. 更新下方「已支持」和「缺失」列表。

## 在 CodexMonitor 中的关键位置

app-server 事件主事实来源（方法清单 + 类型化解析辅助）：
- `src/utils/appServerEvents.ts`

主事件路由器：
- `src/features/app/hooks/useAppServerEvents.ts`

事件处理组合层：
- `src/features/threads/hooks/useThreadEventHandlers.ts`

线程 / turn / item 处理器：
- `src/features/threads/hooks/useThreadTurnEvents.ts`
- `src/features/threads/hooks/useThreadItemEvents.ts`
- `src/features/threads/hooks/useThreadApprovalEvents.ts`
- `src/features/threads/hooks/useThreadUserInputEvents.ts`

状态更新：
- `src/features/threads/hooks/useThreadsReducer.ts`

Item 归一化 / 展示整形：
- `src/utils/threadItems.ts`

Item 的 UI 渲染：
- `src/features/messages/components/Messages.tsx`

出站请求主链路：
- `src/services/tauri.ts`
- `src-tauri/src/shared/codex_core.rs`
- `src-tauri/src/codex/mod.rs`
- `src-tauri/src/bin/codex_monitor_daemon.rs`

## 已支持事件（当前）

以下 app-server 方法当前已在
`src/utils/appServerEvents.ts`（`SUPPORTED_APP_SERVER_METHODS`）中声明，
并在 `useAppServerEvents.ts` 中路由：

- `codex/connected`
- `*requestApproval` 方法（通过
  `isApprovalRequestMethod(method)` 按后缀匹配）
- `item/tool/requestUserInput`
- `item/agentMessage/delta`
- `turn/started`
- `thread/started`
- `thread/name/updated`
- `codex/backgroundThread`
- `error`
- `turn/completed`
- `turn/plan/updated`
- `turn/diff/updated`
- `thread/tokenUsage/updated`
- `account/rateLimits/updated`
- `account/updated`
- `account/login/completed`
- `item/started`
- `item/completed`
- `item/reasoning/summaryTextDelta`
- `item/reasoning/summaryPartAdded`
- `item/reasoning/textDelta`
- `item/plan/delta`
- `item/commandExecution/outputDelta`
- `item/commandExecution/terminalInteraction`
- `item/fileChange/outputDelta`
- `codex/event/skills_update_available`（通过
  `useSkills.ts` 中的 `isSkillsUpdateAvailableEvent(...)` 处理）

## 会话压缩信号（Codex v2）

Codex 当前提供两类压缩信号：

- 首选：`item/started` + `item/completed`，并且 `item.type = "contextCompaction"`（`ThreadItem::ContextCompaction`）。
- 已弃用：`thread/compacted`（`ContextCompactedNotification`）。

CodexMonitor 当前状态：

- 已路由 `item/started` 与 `item/completed`，因此首选信号能够到达前端事件层。
- 已通过常规 item 生命周期存储 / 渲染 `contextCompaction` 项。
- 已不再路由已弃用的 `thread/compacted`。

## 缺失事件（Codex v2 Notifications）

与 Codex app-server protocol v2 通知对比后，以下事件当前尚未路由：

- `rawResponseItem/completed`
- `item/mcpToolCall/progress`
- `mcpServer/oauthLogin/completed`
- `deprecationNotice`
- `configWarning`
- `windows/worldWritableWarning`

## 已支持请求（CodexMonitor -> App-Server, v2）

CodexMonitor 当前会向 Codex app-server 发送以下 v2 请求方法：

- `thread/start`
- `thread/resume`
- `thread/fork`
- `thread/list`
- `thread/archive`
- `thread/compact/start`
- `thread/name/set`
- `turn/start`
- `turn/interrupt`
- `review/start`
- `model/list`
- `collaborationMode/list`
- `mcpServerStatus/list`
- `account/login/start`
- `account/login/cancel`
- `account/rateLimits/read`
- `account/read`
- `skills/list`
- `app/list`

## 缺失请求（Codex v2 Request Methods）

对照 Codex v2 请求方法后，CodexMonitor 当前尚未发送：

- `thread/unarchive`
- `thread/rollback`
- `thread/loaded/list`
- `thread/read`
- `skills/remote/read`
- `skills/remote/write`
- `skills/config/write`
- `mock/experimentalMethod`
- `mcpServer/oauth/login`
- `config/mcpServer/reload`
- `account/logout`
- `feedback/upload`
- `command/exec`
- `config/read`
- `config/value/write`
- `config/batchWrite`
- `configRequirements/read`
- `item/commandExecution/requestApproval`
- `item/fileChange/requestApproval`
- `item/tool/requestUserInput`
- `item/tool/call`
- `account/chatgptAuthTokens/refresh`

## 在 `../Codex` 中的关键位置

先从这里开始（v2 通知方法权威来源）：
- `../Codex/codex-rs/app-server-protocol/src/protocol/common.rs`

后续常用定位：
- 通知载荷类型：
  - `../Codex/codex-rs/app-server-protocol/src/protocol/v2.rs`
- 从 core 事件到 server 通知的发射 / 组装：
  - `../Codex/codex-rs/app-server/src/bespoke_event_handling.rs`
- 面向人的协议说明：
  - `../Codex/codex-rs/app-server/README.md`

## 快速对照流程（事件）

按以下步骤更新上面的事件清单：

1. 获取当前 Codex hash：
   - `git -C ../Codex rev-parse HEAD`
2. 列出 Codex v2 通知方法：
   - `rg -n \"=> \\\".*\\\" \\(v2::.*Notification\\)\" ../Codex/codex-rs/app-server-protocol/src/protocol/common.rs`
3. 列出 CodexMonitor 已路由方法：
   - `rg -n \"SUPPORTED_APP_SERVER_METHODS\" src/utils/appServerEvents.ts`
4. 更新「已支持事件」与「缺失事件」。

## 快速对照流程（请求）

按以下步骤更新请求支持清单：

1. 获取当前 Codex hash：
   - `git -C ../Codex rev-parse HEAD`
2. 列出 Codex 请求方法：
   - `rg -n \"=> \\\".*\\\" \\{\" ../Codex/codex-rs/app-server-protocol/src/protocol/common.rs`
3. 列出 CodexMonitor 出站请求：
   - `rg -n \"send_request\\(\\\"\" src-tauri/src -g\"*.rs\"`
4. 更新「已支持请求」与「缺失请求」。

## Schema 漂移排查流程（推荐）

当方法名清单没变化，但行为出现偏差时使用。

1. 确认当前 Codex hash：
   - `git -C ../Codex rev-parse HEAD`
2. 查看权威通知结构体：
   - `rg -n \"struct .*Notification\" ../Codex/codex-rs/app-server-protocol/src/protocol/v2.rs`
3. 针对某个方法跳转到对应 struct 定义：
   - 示例：`rg -n \"struct TurnPlanUpdatedNotification|struct ThreadTokenUsageUpdatedNotification|struct AccountRateLimitsUpdatedNotification|struct ItemStartedNotification|struct ItemCompletedNotification\" ../Codex/codex-rs/app-server-protocol/src/protocol/v2.rs`
4. 对照载荷结构与路由层预期：
   - 解析事实来源：`src/utils/appServerEvents.ts`
   - 路由：`src/features/app/hooks/useAppServerEvents.ts`
   - turn/plan/token/rate-limit 归一化：`src/features/threads/utils/threadNormalize.ts`
   - 用于展示的 item 整形：`src/utils/threadItems.ts`
5. 校验 ThreadItem schema（很多 UI 问题源头在这里）：
   - `rg -n \"enum ThreadItem|CommandExecution|FileChange|McpToolCall|EnteredReviewMode|ExitedReviewMode|ContextCompaction\" ../Codex/codex-rs/app-server-protocol/src/protocol/v2.rs`
6. 检查 camelCase 与 snake_case 不一致：
   - 协议层使用 `#[serde(rename_all = \"camelCase\")]`，但字段声明常见 snake_case。
   - CodexMonitor 通常会同时兼容两种写法（如 `threadNormalize.ts` 与 `useAppServerEvents.ts`），并将方法 / 类型解析集中在 `appServerEvents.ts`。
7. 如果发现 schema 变更，优先在边界层修复：
   - 优先更新 `src/utils/appServerEvents.ts`、`useAppServerEvents.ts`、`threadNormalize.ts`，避免将条件分支扩散到组件层。

## 备注

- 并非所有缺失事件都应该进入对话视图；部分更适合作为 toast、设置警告或 debug-only 项。
- 对话视图改动建议遵循：
  - 在 `src/utils/appServerEvents.ts` 增加方法 / 类型支持
  - 在 `useAppServerEvents.ts` 路由
  - 在 `useThreadTurnEvents.ts` 或 `useThreadItemEvents.ts` 处理
  - 在 `useThreadsReducer.ts` 更新状态
  - 在 `Messages.tsx` 渲染
- `turn/diff/updated` 虽已在 `useAppServerEvents.ts` 路由，但目前尚未在 `useThreadEventHandlers.ts` 中接入下游处理器。

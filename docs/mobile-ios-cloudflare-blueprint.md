# CodexMonitor iOS + Cloudflare Bridge 蓝图

本文档是 CodexMonitor 在 iOS 平台发布方案的规范实现计划：通过 Cloudflare bridge 连接到 macOS runner。

## 范围

- 构建并发布真实可用的 iOS 应用（Tauri mobile target）。
- 保持 macOS 作为执行主机（Codex 二进制、仓库、git、终端、文件均在其上运行）。
- 使用 Cloudflare 作为 iOS 与 macOS 之间的安全中继与实时桥接层。
- 将 macOS 端配置收敛到 CodexMonitor Settings：配置 bridge、存储凭据、启动/停止服务、查看状态/日志。
- 维持单一后端逻辑路径（shared core + daemon），不要在 iOS UI 里复制后端行为。

## 当前状态（重要）

- 当前 Tauri 应用以桌面优先，`src-tauri/src/lib.rs` 中已存在 `#[cfg_attr(mobile, tauri::mobile_entry_point)]`。
- `src-tauri/src/remote_backend.rs` 目前使用原始 TCP `host:port` 与可选 token 鉴权。
- 当前远端通知转发仅覆盖：
  - `app-server-event`
  - `terminal-output`
  - `terminal-exit`
- daemon RPC 接口面尚未覆盖本地 Tauri 命令全集（存在明显 parity 缺口）。

## 目标架构

## 组件

1. iOS App（Tauri）
- UI + 本地状态 + IPC 封装。
- 仅使用 remote mode（不在本地执行 codex）。
- 连接 Cloudflare WebSocket bridge。

2. macOS App + Daemon Runner
- 执行全部后端操作（shared cores、codex 进程、files/git/terminal）。
- 与 Cloudflare bridge 维持出站连接。
- 从 bridge 接收命令信封并返回结果/事件。

3. Cloudflare Bridge
- Worker 入口：鉴权与会话路由。
- 每个会话对应一个 Durable Object，用于扇出与协调。
- Durable Object 的 SQLite 存储用于 cursor/队列/快照持久化。
- 可选 REST 接口用于配对引导。

## 数据流

1. macOS runner 鉴权接入 Cloudflare，并建立持久 WS。
2. iOS 应用完成配对并连接同一会话 WS。
3. iOS 发送 `invoke` 信封到 bridge。
4. bridge 转发给 runner。
5. runner 执行 daemon RPC。
6. runner 回传 `result` + `event` 信封流。
7. iOS 按序应用事件并回传 ack 序号。
8. 重连时 iOS 从最后 ack 的序号请求重放。

## 传输协议（Bridge Envelope）

所有帧均为 JSON：

```json
{
  "v": 1,
  "sessionId": "string",
  "seq": 123,
  "kind": "auth|invoke|result|event|ack|ping|pong|error",
  "requestId": "uuid-optional",
  "method": "optional",
  "params": {},
  "result": {},
  "error": { "code": "string", "message": "string" },
  "ts": 1730000000000
}
```

规则：
- `invoke/result/error` 必须携带 `requestId`。
- `seq` 在会话内单调递增，作为重放依据。
- `ack` 表示当前连续已应用的最大 `seq`。
- bridge 需在 DO 存储中保留未 ack 帧。

## Cloudflare 实施计划

## 技术选型

- Workers + Durable Objects（WebSocket hibernation API）。
- Durable Object 的 SQLite 持久化存储。
- Cloudflare Access 服务令牌鉴权。

## Worker/DO 拓扑

- Worker 路由：
  - `GET /ws/:sessionId`（WS upgrade）
  - `POST /pair/start`（桌面端 bootstrap）
  - `POST /pair/claim`（移动端通过 code claim）
  - `GET /session/:id/status`
- Durable Object key = `sessionId`。
- 每个 session 最多允许一个 runner 连接。
- 可允许多个 viewer/client 连接（为未来 web 客户端预留）。

## Durable Object 存储结构

- `session_meta`（owner、createdAt、ttl、runnerOnline）。
- `messages`（seq、kind、requestId、payload、createdAt）。
- `acks`（clientId -> seq）。
- `pair_codes`（shortCode、expiresAt、claimedBy）。

## 鉴权模型

- runner 与 client 双方都必须提供凭据。
- 建议在 Worker 入口使用 Access service token header 鉴权。
- 在 envelope 内附带签名后的 session claim（配对阶段由 Worker 颁发短期 JWT 或 HMAC token）。
- 支持 bridge secret 轮换且无需重建应用（更新设置 + 重连生效）。

## Wrangler 初始化

`wrangler.toml` 示例骨架：

```toml
name = "codexmonitor-bridge"
main = "src/index.ts"
compatibility_date = "2026-02-07"

[durable_objects]
bindings = [
  { name = "SESSIONS", class_name = "SessionBridge" }
]

[[migrations]]
tag = "v1"
new_sqlite_classes = ["SessionBridge"]
```

初始运维清单：

1. `npm create cloudflare@latest codexmonitor-bridge`。
2. 添加 Durable Object 类与 WS handlers。
3. 添加 pairing endpoints。
4. 添加鉴权中间件（Access token 校验策略）。
5. `npx wrangler deploy`。
6. 将 Worker URL 写入应用设置。

## CodexMonitor 侧必须进行的后端重构

## 1）将 `remote_backend` 重构为可插拔传输层

目标：保留现有 `call_remote(...)` 调用点，仅替换传输实现细节。

建议结构：

- `src-tauri/src/remote_backend/mod.rs`
- `src-tauri/src/remote_backend/protocol.rs`
- `src-tauri/src/remote_backend/transport.rs`（trait）
- `src-tauri/src/remote_backend/tcp_transport.rs`（legacy/dev）
- `src-tauri/src/remote_backend/cloudflare_ws_transport.rs`（new）

`RemoteTransport` trait：

- `connect(config) -> Client`
- `send(request) -> pending result`
- `subscribe_events() -> stream`
- `close()`
- `status()`

## 2）将 cloud bridge 配置加入 settings model

扩展 `src-tauri/src/types.rs` 中的 `AppSettings`，并同步 `src/types.ts` 的 UI 类型。

新增字段：

- `remoteBridgeProvider`: `"tcp" | "cloudflare"`
- `cloudflareWorkerUrl`
- `cloudflareSessionId`
- `cloudflareRunnerName`
- `cloudflareAutoStartRunner`（bool）
- `cloudflareUseAccess`（bool）
- `cloudflareAccessClientId`（可明文）
- `cloudflareAccessClientSecretRef`（仅存 secret 引用）

尽量避免将 secret 明文存入 `settings.json`。

## 3）Secret 存储

实现安全 secret 存储适配层：

- macOS：Keychain（Rust `keyring` 或专用 secure-storage 层）。
- iOS：基于 Keychain 的移动端凭据存储。

应用 settings JSON 仅保存 secret reference/alias。

## 4）Runner 服务管理器（macOS）

新增后端服务管理模块：

- `src-tauri/src/bridge_runner/mod.rs`

职责：
- 启动 runner 进程/任务。
- 停止 runner。
- 上报健康状态（`connecting|online|offline|error`）。
- 持久化最近日志环形缓冲区。
- 若启用则在应用启动时自动拉起。

可选实现路径：
- 内嵌任务运行于 app 进程（迭代快）。
- 可选安装 LaunchAgent，实现跨应用重启的后台持久化。

## 5）Daemon bridge mode

为 daemon 二进制（`src-tauri/src/bin/codex_monitor_daemon.rs`）增加可选 bridge 连接模式：

- `--bridge-url`
- `--bridge-session`
- `--bridge-auth-*`

行为：
- 向 Worker 发起出站 WS 连接。
- 在 bridge envelopes 与现有 RPC handler + event bus 之间做双向转换。

## 6）命令接口 parity 补齐（阻塞项）

remote mode 必须覆盖 UI 在本地模式使用的完整命令接口面。

至少补齐以下 daemon 方法和/或远程路由：

- Git 命令：
  - `list_git_roots`, `get_git_status`, `get_git_diffs`, `get_git_log`, `get_git_commit_diff`, `get_git_remote`
  - `list_git_branches`, `checkout_git_branch`, `create_git_branch`
  - `stage_git_file`, `stage_git_all`, `unstage_git_file`
  - `revert_git_file`, `revert_git_all`
  - `commit_git`, `push_git`, `pull_git`, `fetch_git`, `sync_git`
  - GitHub API 命令（issues/PRs/comments/diff）
- Terminal 命令：
  - `terminal_open`, `terminal_write`, `terminal_resize`, `terminal_close`
- Prompts 命令：
  - `prompts_list`, `prompts_create`, `prompts_update`, `prompts_delete`, `prompts_move`, `prompts_workspace_dir`, `prompts_global_dir`
- Dictation 命令：
  - `dictation_model_status`, `dictation_download_model`, `dictation_cancel_download`, `dictation_remove_model`, `dictation_start`, `dictation_request_permission`, `dictation_stop`, `dictation_cancel`
- Workspace/App 扩展命令：
  - `add_clone`, `apply_worktree_changes`, `open_workspace_in`, `get_open_app_icon`
- Utility 命令：
  - `codex_doctor`, `get_commit_message_prompt`, `generate_commit_message`, `generate_run_metadata`, `local_usage_snapshot`, `send_notification_fallback`, `is_macos_debug_build`, `menu_set_accelerators`

增加 CI 防护：
- 添加脚本解析 `generate_handler![]` 与 daemon RPC dispatch，若不一致则直接失败。

## 前端计划

## Settings UX（简化配置流程所必需）

更新 `src/features/settings/components/SettingsView.tsx`：当 `backendMode=remote` 且 provider=cloudflare 时，显示 Cloudflare 配置区。

必需控件：

- Provider 选择器（`TCP daemon` / `Cloudflare bridge`）
- Worker URL 输入
- Session ID 输入
- Runner name 输入
- Access 鉴权开关 + client id 输入 + secret 设置/重置
- `Connect test` 按钮
- `Start Runner` / `Stop Runner` 按钮
- `Install LaunchAgent` / `Remove LaunchAgent`（可选）
- 状态徽标 + 最近 heartbeat + 错误信息
- `Copy Pair Code` / `Show QR`（若启用 pairing flow）
- `View Logs` 抽屉

UX 行为：
- 禁止无效组合。
- 给出可执行错误提示（鉴权失败、session 不存在、runner 离线）。
- 非敏感字段即时持久化。
- 敏感字段仅通过安全后端命令保存。

## iOS 客户端 UX

- 连接页：
  - Worker URL
  - Pair code / QR scanner（若启用）
  - 最近会话
- 运行状态：
  - `Connected to <runnerName>`
  - 延迟指示
  - 重连中状态
- 冲突处理：
  - Runner 离线横幅
  - 重连后 replay 进行中状态

## 移动端安全 UI 就绪项

当前已有响应式布局（`phone`、`tablet`、`desktop`），但需确保：

- 触控目标大小 >= 44pt
- 关键操作不能仅依赖 hover
- iOS 输入框在软键盘场景安全（safe area + bottom inset）
- 触控布局下禁用面板拖拽缩放手势

## iOS 构建与安装 Runbook

## 前置条件（macOS）

1. Xcode（完整应用，不仅是 CLT）。
2. Rust iOS targets：

```bash
rustup target add aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim
```

3. CocoaPods：

```bash
brew install cocoapods
```

4. 在仓库根目录安装 JS 依赖：

```bash
npm install
```

## 初始化 iOS 项目文件

在仓库根目录执行：

```bash
npm run tauri ios init
```

期望输出：
- 生成 `src-tauri/gen/apple/*`。
- 提供可用的 iOS target Xcode project/workspace。

## 在 iOS 模拟器运行（dev）

```bash
npm run tauri ios dev
```

说明：
- 使用 `build.devUrl` 与 `beforeDevCommand`。
- 开发态支持 Rust + 前端热更新循环。

## 在真机运行（dev）

1. 打开生成的 Xcode workspace。
2. 为 iOS target 设置 Apple Team + signing profile。
3. 确保真机网络可访问前端 dev server。
4. 运行：

```bash
npm run tauri ios dev -- <device-name-or-udid>
```

若出现网络问题，请确保 dev server 监听主机网卡地址，并在需要时设置 `TAURI_DEV_HOST`。

## 构建 iOS 生产包

```bash
npm run tauri ios build
```

输出：
- 通过 Tauri iOS 构建流程产出 Release 构建产物 / IPA。

## 安装构建产物

开发安装方式：

1. 使用 Xcode 直接运行到已连接设备。
2. 通过 Xcode Organizer 分发给内部测试人员。
3. TestFlight（推荐用于团队验证）。

受控环境下若需直接 IPA 侧载，可按需使用 Apple Configurator 或 MDM。

## iOS 兼容所需 Tauri/Cargo 调整

## Cargo 依赖 gating

在 `src-tauri/Cargo.toml` 中，需将非移动端依赖通过 desktop cfg 进行条件编译（例如 iOS 运行路径不支持的 terminal/generic git native 依赖）。

## Tauri 配置拆分

创建并维护 iOS 专用配置 `src-tauri/tauri.ios.conf.json`，用于：

- iOS bundle identifiers
- iOS icons/assets
- iOS 权限用途说明
- iOS 专属插件开关

确保 iOS 配置中不包含桌面专属设置（titlebar/private APIs/updater artifacts）。

## 后端模块 gating

对仅桌面可用能力使用 `cfg` 提供移动端安全 stub，同时保持前端依赖的命令签名不变。

## 测试与验证矩阵

## Unit/Type/Lint

在仓库根目录执行：

```bash
npm run lint
npm run typecheck
npm run test
```

若涉及 Rust 改动：

```bash
cd src-tauri
cargo check
cargo test
```

## Bridge 集成测试

- 模拟 iOS 断连/重连。
- 验证从 `ack` 游标重放。
- 验证重复 `requestId` 的幂等处理。
- 验证未授权 client 会被拒绝。
- 验证 runner 从 offline -> online 的故障切换。

## 手工场景清单

1. 将 iOS 与 macOS runner 配对。
2. 列出工作区。
3. 连接工作区。
4. 启动线程、发送消息、中断 turn。
5. 执行 Git diff 面板操作。
6. 执行终端 open/write/resize/close。
7. 执行 prompts CRUD。
8. iOS 进入后台后恢复，确认状态可重新同步。
9. 重启 macOS runner，确认 iOS 自动重连。

## 实施里程碑

1. Milestone A：iOS 编译基线 + 移动端安全 stubs。
2. Milestone B：Cloudflare Worker + DO bridge 部署完成，并通过 mock client 测试。
3. Milestone C：`remote_backend` 传输层重构 + runner bridge mode。
4. Milestone D：daemon parity 补齐 + CI parity guard。
5. Milestone E：settings UX/服务管理器 + pairing UX。
6. Milestone F：全链路 E2E 验证 + TestFlight beta。

## 完成定义（DoD）

- iOS 应用可通过 Cloudflare bridge 完整控制 macOS runner。
- 已支持工作流在 remote 模式下与桌面 local 模式达到功能 parity。
- macOS 用户可在 Settings 中完成 bridge 配置，无需终端手工操作。
- runner 可由应用启动/停止/自动启动。
- 重连/重放机制稳定且可观测。
- 构建/安装流程文档完整且可复现。

## 新 Agent 执行清单

1. 完整阅读本文档。
2. 先实现 Milestone A，并确保本地 iOS dev 构建可用。
3. 独立实现 Cloudflare bridge（mock runner/client）。
4. 将 `remote_backend` 重构为传输抽象。
5. 完成 daemon parity 并加入 parity CI guard。
6. 补全 settings UX 与 runner service 控制。
7. 在模拟器与真机上执行完整手工清单。
8. 先在 feature flag 后发布，beta 验证通过后移除 flag。

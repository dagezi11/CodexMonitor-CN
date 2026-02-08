# CodexMonitor iOS 远端蓝图（Orbit + Tailscale 引导）

本文档定义 CodexMonitor 在 iOS 上线时的规范方案：

- **生产链路**：Orbit（自托管）作为认证与中继控制面。
- **首轮落地引导**：Tailscale + TCP daemon 作为可快速验证的自建路径。
- **执行宿主**：macOS 仍是实际执行主机（Codex、仓库、git、终端、文件都在主机侧）。

> 说明：本文档已切换为 Orbit 命名与架构，不再使用 Cloudflare/PR31 旧方案。

## 目标

- 发布可真实运行的 iOS 应用（Tauri mobile target）。
- 保持 app 与 daemon 共享后端核心逻辑，不在 iOS UI 复制后端行为。
- 提供低门槛自建接入路径（Tailscale + TCP）用于早期联调。
- 提供 Orbit 自托管配置路径，支撑长期生产形态。
- 维持 app/daemon 功能一致性（在当前移动端范围内）。

## 非目标（本阶段）

- 不引入 CloudKit/PR31 风格的移动后端。
- 不新增第二套自定义传输协议（`seq/ack` 私有 envelope）。
- 不在本阶段承诺 terminal 与 dictation 的移动端 parity。
- 不提供官方托管 Orbit 服务（仅自托管）。

## 当前状态（与代码同步）

- Tauri 移动入口已存在：`src-tauri/src/lib.rs` 使用 `#[cfg_attr(mobile, tauri::mobile_entry_point)]`。
- `remote_backend` 已拆分为 provider 化传输：
  - `src-tauri/src/remote_backend/mod.rs`
  - `src-tauri/src/remote_backend/protocol.rs`
  - `src-tauri/src/remote_backend/transport.rs`
  - `src-tauri/src/remote_backend/tcp_transport.rs`
  - `src-tauri/src/remote_backend/orbit_ws_transport.rs`
- 传输层现状：
  - TCP 路径保持兼容。
  - Orbit WS 已实现 connect/read/write 与 request/response 路由（含行分帧）。
  - App 侧暂未实现完整客户端重连循环。
  - Daemon Orbit runner 已有重连/退避基础能力。
- 设置项现状：
  - `remoteBackendProvider`: `"tcp" | "orbit"`
  - `remoteBackendHost`、`remoteBackendToken`
  - `orbitWsUrl`、`orbitAuthUrl`
  - `orbitRunnerName`、`orbitAutoStartRunner`
  - `orbitUseAccess`、`orbitAccessClientId`、`orbitAccessClientSecretRef`
- Orbit 控制操作已打通（app + daemon + shared core）：
  - `orbit_connect_test`
  - `orbit_sign_in_start`
  - `orbit_sign_in_poll`（授权成功后写回 token）
  - `orbit_sign_out`（登出并清 token）
  - `orbit_runner_start`
  - `orbit_runner_stop`
  - `orbit_runner_status`
- 远端事件转发当前覆盖：
  - `app-server-event`
  - `terminal-output`
  - `terminal-exit`
- Tailscale 引导能力已落地（TCP 模式）：
  - `tailscale_status`
  - `tailscale_daemon_command_preview`
  - 设置页支持“检测 Tailscale / 使用建议主机 / daemon 启动命令模板”。
- 移动端范围内的 daemon RPC parity 已补齐（terminal/dictation 仍按范围外处理）。

## 架构总览

1. **iOS 客户端（Tauri mobile）**
   - React 前端 + Tauri WebView。
   - 默认 remote backend。
2. **macOS 主机（CodexMonitor daemon）**
   - 承载仓库、Codex、git 与文件访问。
   - 提供 JSON-RPC 能力。
3. **Tailscale Tailnet（引导链路）**
   - iOS 与 macOS 加入同一 tailnet。
   - iOS 通过 tailnet 直接连 TCP daemon。
4. **Orbit 云服务（生产链路）**
   - 认证服务（passkey / session）。
   - Orbit relay（WS 控制 + 事件中继）。
   - 仅自托管部署。

## 传输与协议原则

- Orbit 使用既有 JSON-RPC + Orbit 控制消息（如 subscribe/unsubscribe/keepalive）。
- TCP bootstrap 继续使用现有 token 鉴权的 JSON-RPC。
- 不新增私有 `seq/ack` 协议分叉。
- 重连与恢复优先基于 Orbit 线程历史接口 + `thread/resume`。

## 设置与 UX（Server Section）

### 桌面端设置项

- Provider 选择：`TCP daemon` / `Orbit`（当前可标注为 WIP）。
- TCP + Tailscale 辅助：
  - Detect Tailscale
  - Use suggested host
  - daemon command template
- Orbit 配置：
  - Orbit WS URL
  - Orbit Auth URL
  - Runner name
  - Access 开关 + client id/secret（可选）
- 操作按钮：
  - Connect test
  - Sign In / Sign Out
  - Start Runner / Stop Runner
  - Refresh Status

### 当前实现状态

- 已完成：provider 切换、Tailscale 辅助、Orbit URL/认证输入、runner 控制、状态刷新。
- 待完成：LaunchAgent 安装/移除、完整日志抽屉、二维码配对 UX。

### 交互规则

- 非法组合必须禁用并给出可执行提示。
- 非敏感配置即时持久化。
- 敏感信息（token/secret）仅通过后端安全命令写入。
- 错误提示必须可行动（如 endpoint 错误、token 过期、runner 离线）。

## iOS 客户端 UX

### 首次引导

- 登录（基于已配置 endpoint）。
- `Scan QR` / `Enter pair code`。
- 展示最近会话。

### 运行态

- 当前连接状态。
- 当前会话/工作区。
- 远端主机可达性提示。

### 移动端布局要求

- 点击目标不小于 44pt。
- 核心流程不依赖 hover。
- iOS 输入区必须处理安全区与底部 inset。
- 手机布局下禁用桌面式拖拽缩放交互。

## Tailscale Bootstrap（已实现）

### 桌面端步骤

1. 桌面与 iPhone 均安装并登录同一 Tailnet。
2. 在 CodexMonitor 设置中选择 `Backend Mode = Remote`、`Provider = TCP`。
3. 点击 `Detect Tailscale`，再点击 `Use suggested host`。
4. 设置 `Remote backend token`。
5. 复制并运行 daemon 命令模板。

### iOS 端步骤

1. 打开 iOS 应用。
2. 选择 TCP provider，填入 tailnet host + token。
3. 连接并验证线程列表/消息流。

## Orbit 自托管流程

### 桌面端

1. 部署 Orbit relay + auth 服务。
2. 设置 `Backend Mode = Remote`、`Provider = Orbit`。
3. 填写 `Orbit WS URL` 与 `Orbit Auth URL`。
4. 视需求配置 Access 凭据。
5. Sign in 并启动 runner。
6. 通过二维码/配对码为移动端配对。

### iOS 端

1. 启动应用并完成登录。
2. 扫码或输入配对码。
3. 将凭据安全保存在 Keychain，并自动重连。

## 安全与密钥管理

- macOS：使用 Keychain/`keyring` 承载敏感信息。
- iOS：使用 Keychain 存储认证与会话凭据。
- secret 生命周期需覆盖：写入、重置、轮换、吊销。
- 日志默认脱敏，不打印 token/secret。

## iOS 构建与安装 Runbook

### 先决条件（macOS）

1. 安装 Xcode（非仅 CLT）。
2. 安装 Rust iOS targets：

```bash
rustup target add aarch64-apple-ios aarch64-apple-ios-sim
# Intel Mac 可选
rustup target add x86_64-apple-ios
```

3. 配置开发团队签名（`src-tauri/tauri.conf.json` 或脚本参数 `--team`）。

### 模拟器

```bash
./scripts/build_run_ios.sh
```

### 真机

```bash
./scripts/build_run_ios_device.sh --list-devices
./scripts/build_run_ios_device.sh --device "<name-or-id>" --team <TEAM_ID>
```

## 里程碑

1. Milestone A：iOS 编译基线 + mobile-safe stubs。
2. Milestone B：Orbit 集成基线（自托管配置路径）。
3. Milestone C：`remote_backend` provider 化 + Orbit WS + runner Orbit mode。
4. Milestone D：移动端范围内 daemon parity 闭环（不含 terminal/dictation）。
5. Milestone E：Settings 服务管理 + 配对 UX 完善。
6. Milestone F：全链路 E2E 与 TestFlight beta。

## 完成定义（DoD）

- iOS 可通过 Orbit 链路稳定控制 macOS runner。
- 在支持的工作流范围内，remote 模式达到可用 parity。
- 桌面端可在 Settings 中完成 Orbit 自托管配置与基础运维。
- runner 支持启动/停止/自动启动。
- 重连/恢复路径可观测、可回归测试。
- 构建/安装流程文档可复现。

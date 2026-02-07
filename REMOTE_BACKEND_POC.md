# 远程后端 POC（daemon）

本 fork 包含一个 **概念验证（POC）** daemon：它在独立进程中运行 CodexMonitor 的后端逻辑（主要面向 WSL2/Linux），并通过 TCP 暴露一个简单的 **按行分隔 JSON-RPC** 协议。

目前它**尚未**接入桌面端应用（没有 UI 开关 / 远程代理链路），但可用于验证架构方向和迭代协议设计。

## 运行

在仓库根目录执行：

```bash
cd src-tauri

# 使用强口令（或提前导出 CODEX_MONITOR_DAEMON_TOKEN）
TOKEN="change-me"

cargo run --bin codex_monitor_daemon -- \
  --listen 127.0.0.1:4732 \
  --data-dir "$HOME/.local/share/codex-monitor-daemon" \
  --token "$TOKEN"
```

说明：
- 在 WSL2 中，若需从 Windows 访问，通常需要绑定 `0.0.0.0`（取决于你的端口转发配置）。
- `--insecure-no-auth` 仅用于本地开发调试。

## 协议

- 每行一个 JSON 对象。
- 请求：`{"id": <number>, "method": "<string>", "params": <object|null>}`
- 响应：`{"id": <number>, "result": <any>}` 或 `{"id": <number>, "error": {"message": "<string>"}}`
- 事件（服务端 → 客户端通知）：`{"method":"app-server-event","params":{...}}`

### 鉴权握手（除 `--insecure-no-auth` 外均必需）

首个请求必须为：

```json
{"id": 1, "method": "auth", "params": {"token": "..." }}
```

## 使用 netcat 快速测试

```bash
printf '{\"id\":1,\"method\":\"auth\",\"params\":{\"token\":\"change-me\"}}\\n' | nc -w 1 127.0.0.1 4732
printf '{\"id\":2,\"method\":\"ping\"}\\n' | nc -w 1 127.0.0.1 4732
printf '{\"id\":3,\"method\":\"list_workspaces\",\"params\":{}}\\n' | nc -w 1 127.0.0.1 4732
```

## 已实现方法（初始版本）

- `ping`
- `list_workspaces`
- `add_workspace` (`{ path, codex_bin? }`)
- `add_worktree` (`{ parentId, branch }`)
- `connect_workspace` (`{ id }`)
- `remove_workspace` (`{ id }`)
- `remove_worktree` (`{ id }`)
- `update_workspace_settings` (`{ id, settings }`)
- `update_workspace_codex_bin` (`{ id, codex_bin? }`)
- `list_workspace_files` (`{ workspaceId }`)
- `get_app_settings`
- `update_app_settings` (`{ settings }`)
- `start_thread` (`{ workspaceId }`)
- `resume_thread` (`{ workspaceId, threadId }`)
- `list_threads` (`{ workspaceId, cursor?, limit? }`)
- `archive_thread` (`{ workspaceId, threadId }`)
- `send_user_message` (`{ workspaceId, threadId, text, model?, effort?, accessMode?, images? }`)
- `turn_interrupt` (`{ workspaceId, threadId, turnId }`)
- `start_review` (`{ workspaceId, threadId, target, delivery? }`)
- `model_list` (`{ workspaceId }`)
- `account_rate_limits` (`{ workspaceId }`)
- `skills_list` (`{ workspaceId }`)
- `respond_to_server_request` (`{ workspaceId, requestId, result }`)

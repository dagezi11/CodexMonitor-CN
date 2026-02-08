# CodexMonitor

![CodexMonitor](screenshot.png)

CodexMonitor 是一个 Tauri 应用，用于在本地多个工作区中编排多个 Codex agent。它提供项目侧边栏、主页快捷入口，以及基于 Codex app-server 协议的会话视图。

## 功能

### 工作区与线程

- 添加并持久化工作区，支持分组/排序，并可从主页仪表盘快速跳转到最近的 agent 活动。
- 每个工作区启动一个 `codex app-server`，支持恢复线程，并追踪未读/运行状态。
- 支持通过 worktree 与克隆 agent 实现隔离工作；worktree 位于应用数据目录（兼容旧版 `.codex-worktrees`）。
- 线程管理：置顶/重命名/归档/复制、线程草稿、停止/中断进行中的 turn。
- 可选远程后端（daemon）模式，可在另一台机器上运行 Codex。
- 提供自建远程接入辅助（Orbit 操作 + TCP 模式 Tailscale 检测/主机引导）。

### 输入区与 Agent 控制

- 支持排队发送与图片附件（选择器、拖放、粘贴）。
- 支持 skills（`$`）、prompts（`/prompts:`）、review（`/review`）与文件路径（`@`）自动补全。
- 支持模型选择、协作模式（启用时）、推理强度、访问模式与上下文使用环。
- 支持按住说话快捷键与实时波形的语音听写（Whisper）。
- 支持渲染 reasoning/tool/diff 项并处理审批请求。

### Git 与 GitHub

- Diff 统计、暂存/未暂存文件差异、回退/暂存控制与提交日志。
- 分支列表支持切换/创建，并显示上游 ahead/behind 计数。
- 通过 `gh` 集成 GitHub Issues 与 Pull Requests（列表、diff、评论），并可在浏览器中打开提交/PR。
- PR 输入能力：“Ask PR” 可将 PR 上下文发送到新 agent 线程。

### 文件与 Prompts

- 文件树支持搜索、文件类型图标与在 Finder/Explorer 中定位。
- Prompt 库支持全局/工作区 prompts：创建/编辑/删除/移动，并可在当前线程或新线程运行。

### UI 与体验

- 侧边栏/右侧面板/计划面板/终端面板/debug 面板可调整尺寸并持久化。
- 响应式布局（桌面/平板/手机）与标签式导航。
- 侧边栏展示账户速率限制的用量与额度计量，主页提供用量快照。
- 多标签终端停靠区可运行后台命令（实验性）。
- 应用内更新（toast 驱动下载/安装）、debug 面板复制/清空、声音通知，以及平台特定窗口效果（macOS overlay 标题栏 + 毛玻璃）与降低透明度开关。

## 环境要求

- Node.js + npm
- Rust 工具链（stable）
- CMake（原生依赖需要；听写/Whisper 依赖它）
- LLVM/Clang（Windows 构建听写依赖时 bindgen 需要）
- 已安装 Codex CLI，且 `PATH` 可直接调用 `codex`（或在应用/工作区设置里配置自定义 Codex 二进制）
- Git CLI（用于 worktree 操作）
- GitHub CLI（`gh`，Issues/PR 集成可选）

如遇原生构建错误：

```bash
npm run doctor
```

## 快速开始

安装依赖：

```bash
npm install
```

开发模式运行：

```bash
npm run tauri:dev
```

## iOS 支持（WIP）

iOS 支持正在进行中。

- 当前状态：移动端布局可运行，远端后端链路已接入，iOS 默认使用 remote backend 模式。
- 当前限制：移动端暂不支持 terminal 与 dictation。
- 桌面行为不变：macOS/Linux/Windows 仍是 local-first，除非显式切换为 remote。

### iOS + Tailscale 配置（TCP）

当你需要让 iOS App 通过 Tailscale tailnet 连接桌面端 daemon 时，使用此方案。

1. 在桌面和 iPhone 上安装并登录 Tailscale（同一个 tailnet）。
2. 在桌面 CodexMonitor 打开 `Settings > Server`。
3. 保持 `Remote provider` 为 `TCP (wip)`。
4. 设置 `Remote backend token`。
5. 在 `Mobile access daemon` 中点击 `Start daemon` 启动桌面 daemon。
6. 在 `Tailscale helper` 里点击 `Detect Tailscale`，记录建议主机地址（例如 `your-mac.your-tailnet.ts.net:4732`）。
7. 在 iOS CodexMonitor 打开 `Settings > Server`。
8. 将 `Connection type` 设为 `TCP`。
9. 填入桌面 Tailscale 主机地址和同一份 token。
10. 点击 `Connect & test` 并确认连接测试成功。

说明：

- iOS 连接期间，桌面 daemon 必须保持运行。
- 若测试失败，请确认两端设备都在线且主机/token 与桌面配置一致。
- 若想改用 Orbit 而不是 Tailscale TCP，请在 iOS 端将 `Connection type` 改为 `Orbit`，并使用桌面端的 Orbit WebSocket URL/token。

### iOS 前置条件

- 已安装 Xcode + Command Line Tools。
- 已安装 Rust iOS targets：

```bash
rustup target add aarch64-apple-ios aarch64-apple-ios-sim
# 可选（Intel Mac 模拟器）：
rustup target add x86_64-apple-ios
```

- 已配置 Apple 签名（开发团队）：
  - 在 `src-tauri/tauri.conf.json` 设置 `bundle.iOS.developmentTeam`，或
  - 在设备脚本中传入 `--team <TEAM_ID>`。

### 运行到 iOS 模拟器

```bash
./scripts/build_run_ios.sh
```

可选参数：

- `--simulator "<name>"`：指定模拟器。
- `--target aarch64-sim|x86_64-sim`：覆盖架构。
- `--skip-build`：复用已有 app bundle。
- `--no-clean`：保留 `src-tauri/gen/apple/build`。

### 运行到 USB 真机

列出可发现设备：

```bash
./scripts/build_run_ios_device.sh --list-devices
```

构建、安装并启动到指定设备：

```bash
./scripts/build_run_ios_device.sh --device "<device name or identifier>" --team <TEAM_ID>
```

可选参数：

- `--target aarch64`：覆盖架构。
- `--skip-build`：复用已有 app bundle。
- `--bundle-id <id>`：启动非默认 bundle id。

首次真机安装通常需要：

1. iPhone 已解锁并信任此 Mac。
2. iPhone 已启用 Developer Mode。
3. 已至少在 Xcode 中完成一次配对/签名确认。

若签名尚未就绪，可先打开 Xcode：

```bash
./scripts/build_run_ios_device.sh --open-xcode
```

## 发布构建

构建生产环境 Tauri 包：

```bash
npm run tauri:build
```

产物位于 `src-tauri/target/release/bundle/`（按平台划分子目录）。

### Windows（可选）

Windows 构建为可选路径，使用独立 Tauri 配置以避免 macOS 专属窗口效果造成影响。

```bash
npm run tauri:build:win
```

产物位于：

- `src-tauri/target/release/bundle/nsis/`（安装器 exe）
- `src-tauri/target/release/bundle/msi/`（msi）

注意：Windows 源码构建除 CMake 外，还需要 LLVM/Clang（`bindgen` / `libclang`）。

### Windows E 盘构建（项目级）

若你需要 E 盘作用域的构建环境（不修改全局系统变量），本仓库提供：

```bash
npm run doctor:win:e
npm run tauri:build:win:e
```

脚本将 `E:\CodexMonitorEnv` 作为构建环境根目录，并仅注入进程级变量（如 `LIBCLANG_PATH`、`TEMP/TMP`、`CARGO_TARGET_DIR`、`RUSTUP_TOOLCHAIN`）。

## 类型检查

运行 TypeScript 检查（不产出构建文件）：

```bash
npm run typecheck
```

## 校验

建议在任务结束时执行：

```bash
npm run lint
npm run test
npm run typecheck
cd src-tauri && cargo check
```

## Fork 更新签名配置

若你运行的是 fork，且希望应用内更新指向你自己的发布源，则必须使用你自己的 Tauri 签名密钥对。

### 1）生成密钥对（一次）

```powershell
npm run tauri -- signer generate -w E:\CodexMonitorEnv\tauri\codexmonitor.key
```

### 2）更新 updater 配置

- 将 `.pub` 内容复制到 `src-tauri/tauri.conf.json` 的 `plugins.updater.pubkey`。
- 将 `plugins.updater.endpoints` 指向你的仓库 latest feed：
  - `https://github.com/<your-org-or-user>/<your-repo>/releases/latest/download/latest.json`

### 3）配置 GitHub Actions Secrets

- `TAURI_SIGNING_PRIVATE_KEY_B64`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

PowerShell 示例（生成 base64）：

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('E:\CodexMonitorEnv\tauri\codexmonitor.key'))
```

### 兼容性说明

切换到新公钥后，与旧密钥签名版本的更新链将不兼容。用户可能需要手动重装一次完成迁移。

## 项目结构

```
src/
  features/         按特性切分的 UI + hooks
  services/         Tauri IPC 封装层
  styles/           按区域拆分的 CSS
  types.ts          共享类型
src-tauri/
  src/lib.rs        Tauri 应用后端命令注册
  src/bin/codex_monitor_daemon.rs  远端 daemon JSON-RPC 进程
  src/shared/       app + daemon 共享后端核心
  src/workspaces/   workspace/worktree 适配层
  src/codex/        codex app-server 适配层
  src/files/        文件适配层
  tauri.conf.json   窗口配置
```

## 说明

- 工作区持久化到应用数据目录下的 `workspaces.json`。
- 应用设置持久化到应用数据目录下的 `settings.json`（主题、backend 模式/提供方、远端 endpoint/token、Codex 路径、默认访问模式、UI 缩放、UI 语言偏好）。
- UI 支持功能开关，并在读写时同步到 `$CODEX_HOME/config.toml`（或 `~/.codex/config.toml`）。稳定项：协作模式（`features.collaboration_modes`）、personality（`personality`）、Steer 模式（`features.steer`）、后台终端（`features.unified_exec`）；实验项：Collab 模式（`features.collab`）与 Apps（`features.apps`）。
- 应用在启动与窗口重新聚焦时，会为每个工作区重新连接并刷新线程列表。
- 线程恢复逻辑会按工作区 `cwd` 过滤 `thread/list` 结果。
- 选择线程时始终调用 `thread/resume` 以从磁盘刷新消息。
- CLI 会话仅在其 `cwd` 与工作区路径匹配时显示；除非恢复，否则不会实时流式显示。
- 应用通过 stdio 使用 `codex app-server`；详见 `src-tauri/src/lib.rs` 与 `src-tauri/src/codex/`。
- 远端 daemon 入口为 `src-tauri/src/bin/codex_monitor_daemon.rs`；共享领域逻辑位于 `src-tauri/src/shared/`。
- Codex home 解析顺序：工作区设置（若有）→ 旧版 `.codexmonitor/` → `$CODEX_HOME`/`~/.codex`。
- Worktree agent 位于应用数据目录（`worktrees/<workspace-id>`）；兼容旧版 `.codex-worktrees/` 路径，且应用不再修改仓库 `.gitignore`。
- UI 状态（面板尺寸、降低透明度开关、最近线程活动）保存在 `localStorage`。
- 自定义 prompts 从 `$CODEX_HOME/prompts`（或 `~/.codex/prompts`）加载，支持可选 frontmatter 描述/参数提示。

## Tauri IPC 接口面

前端调用位于 `src/services/tauri.ts`，并映射到 `src-tauri/src/lib.rs` 命令。当前核心接口包括：

- 设置/配置/文件：`get_app_settings`、`update_app_settings`、`get_codex_config_path`、`get_config_model`、`file_read`、`file_write`、`codex_doctor`、`menu_set_accelerators`。
- 工作区/worktree：`list_workspaces`、`is_workspace_path_dir`、`add_workspace`、`add_clone`、`add_worktree`、`worktree_setup_status`、`worktree_setup_mark_ran`、`rename_worktree`、`rename_worktree_upstream`、`apply_worktree_changes`、`update_workspace_settings`、`update_workspace_codex_bin`、`remove_workspace`、`remove_worktree`、`connect_workspace`、`list_workspace_files`、`read_workspace_file`、`open_workspace_in`、`get_open_app_icon`。
- 线程/turn/review：`start_thread`、`fork_thread`、`compact_thread`、`list_threads`、`resume_thread`、`archive_thread`、`set_thread_name`、`send_user_message`、`turn_interrupt`、`respond_to_server_request`、`start_review`、`remember_approval_rule`、`get_commit_message_prompt`、`generate_commit_message`、`generate_run_metadata`。
- 账号/模型/协作：`model_list`、`account_rate_limits`、`account_read`、`skills_list`、`apps_list`、`collaboration_mode_list`、`codex_login`、`codex_login_cancel`、`list_mcp_server_status`。
- Git/GitHub：`get_git_status`、`list_git_roots`、`get_git_diffs`、`get_git_log`、`get_git_commit_diff`、`get_git_remote`、`stage_git_file`、`stage_git_all`、`unstage_git_file`、`revert_git_file`、`revert_git_all`、`commit_git`、`push_git`、`pull_git`、`fetch_git`、`sync_git`、`list_git_branches`、`checkout_git_branch`、`create_git_branch`、`get_github_issues`、`get_github_pull_requests`、`get_github_pull_request_diff`、`get_github_pull_request_comments`。
- Prompts：`prompts_list`、`prompts_create`、`prompts_update`、`prompts_delete`、`prompts_move`、`prompts_workspace_dir`、`prompts_global_dir`。
- 终端/听写/通知/用量：`terminal_open`、`terminal_write`、`terminal_resize`、`terminal_close`、`dictation_model_status`、`dictation_download_model`、`dictation_cancel_download`、`dictation_remove_model`、`dictation_request_permission`、`dictation_start`、`dictation_stop`、`dictation_cancel`、`send_notification_fallback`、`is_macos_debug_build`、`local_usage_snapshot`。
- 远端后端辅助：`orbit_connect_test`、`orbit_sign_in_start`、`orbit_sign_in_poll`、`orbit_sign_out`、`orbit_runner_start`、`orbit_runner_stop`、`orbit_runner_status`、`tailscale_status`、`tailscale_daemon_command_preview`、`tailscale_daemon_start`、`tailscale_daemon_stop`、`tailscale_daemon_status`。

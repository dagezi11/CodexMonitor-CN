# CodexMonitor

![CodexMonitor](screenshot.png)

CodexMonitor 是一个 Tauri 应用，用于在本地多个工作区中编排多个 Codex agent。它提供了用于管理项目的侧边栏、用于快速操作的主页，以及基于 Codex app-server 协议的会话视图。

## 功能

### 工作区与线程

- 添加并持久化工作区，支持分组/排序，并可从主页仪表盘快速跳转到最近的 agent 活动。
- 每个工作区启动一个 `codex app-server`，支持恢复线程，并追踪未读/运行状态。
- 支持通过 worktree 与克隆 agent 实现隔离工作；worktree 位于应用数据目录（兼容旧版 `.codex-worktrees`）。
- 线程管理：置顶/重命名/归档/复制、线程草稿、停止/中断进行中的 turn。
- 可选远程后端（daemon）模式，可在另一台机器上运行 Codex。

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
- 系统已安装 Codex，并且 `PATH` 中可直接调用 `codex`
- Git CLI（用于 worktree 操作）
- GitHub CLI（`gh`，Issues 面板可选）

如果 `codex` 不在 `PATH` 中，请在后端改为按工作区传入自定义路径。
如果遇到原生构建报错，请执行：

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
npm run tauri dev
```

## 发布构建

构建生产环境 Tauri 包：

```bash
npm run tauri build
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

脚本将 `E:\CodexMonitorEnv` 作为构建环境根目录，并仅注入进程级变量：

- `LIBCLANG_PATH=E:\CodexMonitorEnv\LLVM\bin`
- `TEMP` / `TMP` => `E:\CodexMonitorEnv\tmp`
- `CARGO_TARGET_DIR=E:\CodexMonitorEnv\cargo-target\CodexMonitor-CN`
- `RUSTUP_TOOLCHAIN=1.89.0-x86_64-pc-windows-msvc`

LLVM 期望路径：

- `E:\CodexMonitorEnv\LLVM\bin\clang.exe`
- `E:\CodexMonitorEnv\LLVM\bin\libclang.dll`

该脚本使用的 Tauri updater 签名密钥路径：

- `E:\CodexMonitorEnv\tauri\codexmonitor.key`
- 可选密码文件：`E:\CodexMonitorEnv\tauri\codexmonitor.key.password`

脚本还会从以下位置导入 MSVC Build Tools 环境：

- `D:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat`

## 类型检查

运行 TypeScript 检查（不产出构建文件）：

```bash
npm run typecheck
```

## Fork 更新签名配置

若你运行的是 fork，且希望应用内更新指向你自己的发布源，则必须使用你自己的 Tauri 签名密钥对。

### 1）生成密钥对（一次）

```powershell
npm run tauri -- signer generate -w E:\CodexMonitorEnv\tauri\codexmonitor.key
```

该命令也会将公钥写入：

- `E:\CodexMonitorEnv\tauri\codexmonitor.key.pub`

### 2）更新应用 updater 配置

- 将 `.pub` 内容复制到 `src-tauri/tauri.conf.json` 的 `plugins.updater.pubkey`。
- 将 `plugins.updater.endpoints` 指向你仓库的 latest feed：
  - `https://github.com/<your-org-or-user>/<your-repo>/releases/latest/download/latest.json`

### 3）配置 GitHub Actions Secrets

发布工作流依赖以下 secrets：

- `TAURI_SIGNING_PRIVATE_KEY_B64`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

PowerShell 示例（生成 `TAURI_SIGNING_PRIVATE_KEY_B64` 所需 base64 值）：

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('E:\CodexMonitorEnv\tauri\codexmonitor.key'))
```

### 4）本地 Windows E 盘构建用法

`scripts/tauri-build-win-e.ps1` 现支持自动加载签名 secrets：

- 从 `E:\CodexMonitorEnv\tauri\codexmonitor.key` 读取私钥。
- 密码读取优先级：
  1. 进程环境变量 `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
  2. `E:\CodexMonitorEnv\tauri\codexmonitor.key.password`

如果密钥缺失，脚本会直接退出并给出生成命令提示。

### 兼容性说明

切换到新公钥后，与旧密钥签名版本的更新链将不兼容。用户可能需要手动重装一次完成迁移。

注意：`npm run build` 在打包前也会先执行 `tsc`。

## 项目结构

```
src/
  features/         按特性切分的 UI + hooks
  services/         Tauri IPC 封装层
  styles/           按区域拆分的 CSS
  types.ts          共享类型
src-tauri/
  src/lib.rs        Tauri 后端 + codex app-server 客户端
  tauri.conf.json   窗口配置
```

## 说明

- 工作区持久化到应用数据目录下的 `workspaces.json`。
- 应用设置持久化到应用数据目录下的 `settings.json`（Codex 路径、默认访问模式、UI 缩放、UI 语言偏好）。
- UI 支持功能开关，并在读写时同步到 `$CODEX_HOME/config.toml`（或 `~/.codex/config.toml`）。稳定项：协作模式（`features.collaboration_modes`）、personality（`personality`）、Steer 模式（`features.steer`）、后台终端（`features.unified_exec`）。实验项：Collab 模式（`features.collab`）与 Apps（`features.apps`）。
- 应用在启动与窗口重新聚焦时，会为每个工作区重新连接并刷新线程列表。
- 线程恢复逻辑会按工作区 `cwd` 过滤 `thread/list` 结果。
- 选择线程时始终调用 `thread/resume` 以从磁盘刷新消息。
- CLI 会话仅在其 `cwd` 与工作区路径匹配时显示；除非恢复，否则不会实时流式显示。
- 应用通过 stdio 使用 `codex app-server`；详见 `src-tauri/src/lib.rs`。
- Codex 会话默认使用 Codex home（通常是 `~/.codex`）；若工作区存在旧版 `.codexmonitor/`，则该工作区优先使用它。
- Worktree agent 位于应用数据目录（`worktrees/<workspace-id>`）；兼容旧版 `.codex-worktrees/` 路径，且应用不再修改仓库 `.gitignore`。
- UI 状态（面板尺寸、降低透明度开关、最近线程活动）保存在 `localStorage`。
- UI 语言在 Settings → Display & Sound 中支持 `System` / `简体中文` / `English`。当前 i18n 覆盖核心壳层 + Home + Settings 入口/展示文案；未覆盖文本回退为英语。
- 自定义 prompts 从 `$CODEX_HOME/prompts`（或 `~/.codex/prompts`）加载，支持可选 frontmatter 描述/参数提示。

## Tauri IPC 接口面

前端调用位于 `src/services/tauri.ts`，并映射到 `src-tauri/src/lib.rs` 中的命令。核心命令包括：

- 工作区生命周期：`list_workspaces`、`add_workspace`、`add_worktree`、`remove_workspace`、`remove_worktree`、`connect_workspace`、`update_workspace_settings`。
- 线程：`start_thread`、`list_threads`、`resume_thread`、`archive_thread`、`send_user_message`、`turn_interrupt`、`respond_to_server_request`。
- Review 与模型：`start_review`、`model_list`、`account_rate_limits`、`skills_list`。
- Git 与文件：`get_git_status`、`get_git_diffs`、`get_git_log`、`get_git_remote`、`list_git_branches`、`checkout_git_branch`、`create_git_branch`、`list_workspace_files`。

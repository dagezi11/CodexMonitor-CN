import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";
import type { AppLanguagePreference } from "../../types";
import { commonTranslations } from "./commonTranslations";

const resources = {
  en: {
    common: commonTranslations.en,
    shell: {
      tabs: {
        projects: "Projects",
        codex: "Codex",
        git: "Git",
        log: "Log",
      },
      nav: {
        primary: "Primary",
        workspace: "Workspace",
      },
      sidebar: {
        addWorkspace: "Add workspace",
        openHome: "Open home",
        sortThreads: "Sort threads",
        toggleSearch: "Toggle search",
        clearSearch: "Clear search",
        searchProjects: "Search projects",
        sortLastUpdated: "Last updated",
        sortMostRecent: "Most recent",
        pinned: "Pinned",
        newAgent: "New agent",
        newWorktreeAgent: "New worktree agent",
        newCloneAgent: "New clone agent",
        noProjectsMatchSearch: "No projects match your search.",
        addWorkspaceToStart: "Add a workspace to start.",
      },
      usage: {
        session: "Session",
        weekly: "Weekly",
      },
      account: {
        menuTitle: "Account",
        openAccount: "Account",
        cancel: "Cancel",
        apiKey: "API key",
        signInToCodex: "Sign in to Codex",
        switchAccount: "Switch account",
        signIn: "Sign in",
        cancelAccountSwitch: "Cancel account switch",
      },
      actions: {
        openSettings: "Open settings",
        settings: "Settings",
        openDebugLog: "Open debug log",
        debugLog: "Debug log",
      },
      mainHeader: {
        worktreeInfo: "Worktree info",
        worktree: "Worktree",
        name: "Name",
        confirmRename: "Confirm rename",
        copyCommand: "Copy command",
        reveal: "Reveal",
        searchOrCreateBranch: "Search or create branch",
        searchBranches: "Search branches",
        noBranchesFound: "No branches found",
        toggleTerminalPanel: "Toggle terminal panel",
        terminal: "Terminal",
        copyThread: "Copy thread",
      },
      diffView: {
        groupAria: "Diff view",
        dualPanel: "Dual-panel diff",
        singleColumn: "Single-column diff",
      },
    },
    home: {
      title: "Codex Monitor",
      subtitle: "Orchestrate agents across your local projects.",
      latestAgents: "Latest agents",
      running: "Running",
      noActivityTitle: "No agent activity yet",
      noActivitySubtitle: "Start a thread to see the latest responses here.",
      usageTitle: "Usage",
      updatedPrefix: "Updated {{value}}",
      refreshUsage: "Refresh usage",
      metricTokens: "Tokens",
      metricTime: "Time",
      workspaceLabel: "Workspace",
      viewLabel: "View",
      workspaceAll: "All projects",
      usageNoData: "No usage data yet",
      usageNoDataSubtitle: "Run a few turns and refresh to see local usage insights.",
      loadingAgents: "Loading agents",
      openProject: "Open projects",
      addProject: "Add project",
      fallbackAgentReply: "Agent replied.",
      cards: {
        last7Days: "Last 7 days",
        last30Days: "Last 30 days",
        runs: "Runs",
        peakDay: "Peak day",
      },
      labels: {
        agentTime: "agent time",
        runs: "runs",
        avgPerDay: "Avg {{value}} / day",
        total: "Total {{value}}",
      },
      topModels: "Top models",
      topModelsHint: "Tokens",
      noModelsYet: "No models yet",
      tooltipTokens: "{{day}} · {{value}} tokens",
      tooltipTime: "{{day}} · {{value}} agent time",
    },
    settings: {
      title: "Settings",
      closeSettings: "Close settings",
      nav: {
        projects: "Projects",
        environments: "Environments",
        display: "Display & Sound",
        composer: "Composer",
        dictation: "Dictation",
        shortcuts: "Shortcuts",
        openIn: "Open in",
        git: "Git",
        codex: "Codex",
        features: "Features",
      },
      display: {
        title: "Display & Sound",
        subtitle: "Tune visuals and audio alerts to your preferences.",
        sectionDisplay: "Display",
        sectionDisplaySubtitle: "Adjust how the window renders backgrounds and effects.",
        theme: "Theme",
        language: "Language",
        languageHelp: "Choose app display language. System follows OS language.",
        themeSystem: "System",
        themeLight: "Light",
        themeDark: "Dark",
        themeDim: "Dim",
        langSystem: "System",
        langZhCN: "简体中文",
        langEn: "English",
        showRemainingTitle: "Show remaining Codex limits",
        showRemainingSubtitle: "Display what is left instead of what is used.",
        reduceTransparencyTitle: "Reduce transparency",
        reduceTransparencySubtitle: "Use solid surfaces instead of glass.",
        interfaceScale: "Interface scale",
        uiFontFamily: "UI font family",
        uiFontFamilyHelp: "Applies to all UI text. Leave empty to use the default system font stack.",
        codeFontFamily: "Code font family",
        codeFontFamilyHelp: "Applies to git diffs and other mono-spaced readouts.",
        codeFontSize: "Code font size",
        codeFontSizeHelp: "Adjusts code and diff text size.",
        sounds: "Sounds",
        soundsSubtitle: "Control notification audio alerts.",
        notificationSoundsTitle: "Notification sounds",
        notificationSoundsSubtitle:
          "Play a sound when a long-running agent finishes while the window is unfocused.",
        systemNotificationsTitle: "System notifications",
        systemNotificationsSubtitle:
          "Show a system notification when a long-running agent finishes while the window is unfocused.",
        reset: "Reset",
        testSound: "Test sound",
        testNotification: "Test notification",
      },
    },
  },
  "zh-CN": {
    common: commonTranslations["zh-CN"],
    shell: {
      tabs: {
        projects: "项目",
        codex: "Codex",
        git: "Git",
        log: "日志",
      },
      nav: {
        primary: "主导航",
        workspace: "工作区",
      },
      sidebar: {
        addWorkspace: "添加工作区",
        openHome: "打开首页",
        sortThreads: "排序线程",
        toggleSearch: "切换搜索",
        clearSearch: "清空搜索",
        searchProjects: "搜索项目",
        sortLastUpdated: "最近更新",
        sortMostRecent: "最新创建",
        pinned: "已固定",
        newAgent: "新建 Agent",
        newWorktreeAgent: "新建 Worktree Agent",
        newCloneAgent: "新建 Clone Agent",
        noProjectsMatchSearch: "没有匹配搜索条件的项目。",
        addWorkspaceToStart: "添加一个工作区以开始。",
      },
      usage: {
        session: "会话",
        weekly: "周",
      },
      account: {
        menuTitle: "账号",
        openAccount: "账号",
        cancel: "取消",
        apiKey: "API 密钥",
        signInToCodex: "登录 Codex",
        switchAccount: "切换账号",
        signIn: "登录",
        cancelAccountSwitch: "取消切换账号",
      },
      actions: {
        openSettings: "打开设置",
        settings: "设置",
        openDebugLog: "打开调试日志",
        debugLog: "调试日志",
      },
      mainHeader: {
        worktreeInfo: "Worktree 信息",
        worktree: "Worktree",
        name: "名称",
        confirmRename: "确认重命名",
        copyCommand: "复制命令",
        reveal: "在文件管理器中显示",
        searchOrCreateBranch: "搜索或创建分支",
        searchBranches: "搜索分支",
        noBranchesFound: "未找到分支",
        toggleTerminalPanel: "切换终端面板",
        terminal: "终端",
        copyThread: "复制线程",
      },
      diffView: {
        groupAria: "Diff 视图",
        dualPanel: "双栏 Diff",
        singleColumn: "单栏 Diff",
      },
    },
    home: {
      title: "Codex Monitor",
      subtitle: "在本地项目间编排多个 Agent。",
      latestAgents: "最新 Agent",
      running: "运行中",
      noActivityTitle: "还没有 Agent 活动",
      noActivitySubtitle: "开始一个线程后，这里会显示最新回复。",
      usageTitle: "使用情况",
      updatedPrefix: "更新于 {{value}}",
      refreshUsage: "刷新用量",
      metricTokens: "Tokens",
      metricTime: "时长",
      workspaceLabel: "工作区",
      viewLabel: "视图",
      workspaceAll: "全部项目",
      usageNoData: "暂无使用数据",
      usageNoDataSubtitle: "先运行几次对话，再刷新即可查看本地用量洞察。",
      loadingAgents: "正在加载 Agent",
      openProject: "打开项目",
      addProject: "添加项目",
      fallbackAgentReply: "Agent 已回复。",
      cards: {
        last7Days: "近 7 天",
        last30Days: "近 30 天",
        runs: "运行次数",
        peakDay: "峰值日",
      },
      labels: {
        agentTime: "Agent 时长",
        runs: "次",
        avgPerDay: "日均 {{value}}",
        total: "总计 {{value}}",
      },
      topModels: "热门模型",
      topModelsHint: "Tokens",
      noModelsYet: "暂无模型数据",
      tooltipTokens: "{{day}} · {{value}} tokens",
      tooltipTime: "{{day}} · {{value}} Agent 时长",
    },
    settings: {
      title: "设置",
      closeSettings: "关闭设置",
      nav: {
        projects: "项目",
        environments: "环境",
        display: "显示与声音",
        composer: "Composer",
        dictation: "听写",
        shortcuts: "快捷键",
        openIn: "打开方式",
        git: "Git",
        codex: "Codex",
        features: "功能",
      },
      display: {
        title: "显示与声音",
        subtitle: "按你的偏好调整视觉效果与音频提醒。",
        sectionDisplay: "显示",
        sectionDisplaySubtitle: "调整窗口背景与特效的渲染方式。",
        theme: "主题",
        language: "语言",
        languageHelp: "选择应用显示语言。System 会跟随系统语言。",
        themeSystem: "系统",
        themeLight: "浅色",
        themeDark: "深色",
        themeDim: "微暗",
        langSystem: "系统",
        langZhCN: "简体中文",
        langEn: "English",
        showRemainingTitle: "显示 Codex 剩余额度",
        showRemainingSubtitle: "显示剩余而不是已使用的额度。",
        reduceTransparencyTitle: "降低透明效果",
        reduceTransparencySubtitle: "使用实色表面替代玻璃效果。",
        interfaceScale: "界面缩放",
        uiFontFamily: "界面字体族",
        uiFontFamilyHelp: "应用于全部界面文字。留空则使用默认系统字体栈。",
        codeFontFamily: "代码字体族",
        codeFontFamilyHelp: "应用于 Git Diff 与其他等宽文本区域。",
        codeFontSize: "代码字号",
        codeFontSizeHelp: "调整代码和 Diff 文本大小。",
        sounds: "声音",
        soundsSubtitle: "控制通知音频提醒。",
        notificationSoundsTitle: "通知声音",
        notificationSoundsSubtitle: "当窗口不在前台且长任务完成时播放提示音。",
        systemNotificationsTitle: "系统通知",
        systemNotificationsSubtitle:
          "当窗口不在前台且长任务完成时显示系统通知。",
        reset: "重置",
        testSound: "测试声音",
        testNotification: "测试通知",
      },
    },
  },
} as const;

type SupportedLanguage = "en" | "zh-CN";

const DEFAULT_LANGUAGE: SupportedLanguage = "en";

export function resolveLanguage(
  preference: AppLanguagePreference,
  browserLanguages: readonly string[] = [],
): SupportedLanguage {
  if (preference === "en" || preference === "zh-CN") {
    return preference;
  }
  const candidates = browserLanguages.length
    ? browserLanguages
    : typeof navigator !== "undefined" && Array.isArray(navigator.languages)
      ? navigator.languages
      : typeof navigator !== "undefined" && navigator.language
        ? [navigator.language]
        : [];
  for (const item of candidates) {
    const normalized = item.trim().toLowerCase();
    if (!normalized) {
      continue;
    }
    if (normalized.startsWith("zh")) {
      return "zh-CN";
    }
    if (normalized.startsWith("en")) {
      return "en";
    }
  }
  return DEFAULT_LANGUAGE;
}

export async function applyLanguagePreference(
  preference: AppLanguagePreference,
): Promise<SupportedLanguage> {
  const resolved = resolveLanguage(preference);
  await i18n.changeLanguage(resolved);
  if (typeof document !== "undefined") {
    document.documentElement.lang = resolved;
  }
  return resolved;
}

const initialLanguage = resolveLanguage(
  "system",
  typeof navigator !== "undefined" ? navigator.languages : [],
);

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: ["en", "zh-CN"],
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
  },
});

if (typeof document !== "undefined") {
  document.documentElement.lang = initialLanguage;
}

export function useAppTranslation(ns?: "shell" | "home" | "settings" | "common") {
  return useTranslation(ns);
}

export { i18n };

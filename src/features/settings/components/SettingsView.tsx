import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ask, open } from "@tauri-apps/plugin-dialog";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
import LayoutGrid from "lucide-react/dist/esm/icons/layout-grid";
import SlidersHorizontal from "lucide-react/dist/esm/icons/sliders-horizontal";
import Mic from "lucide-react/dist/esm/icons/mic";
import Keyboard from "lucide-react/dist/esm/icons/keyboard";
import Stethoscope from "lucide-react/dist/esm/icons/stethoscope";
import GitBranch from "lucide-react/dist/esm/icons/git-branch";
import TerminalSquare from "lucide-react/dist/esm/icons/terminal-square";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import X from "lucide-react/dist/esm/icons/x";
import FlaskConical from "lucide-react/dist/esm/icons/flask-conical";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Layers from "lucide-react/dist/esm/icons/layers";
import type {
  AppSettings,
  CodexDoctorResult,
  DictationModelStatus,
  OrbitConnectTestResult,
  OrbitDeviceCodeStart,
  OrbitRunnerStatus,
  OrbitSignInPollResult,
  OrbitSignOutResult,
  WorkspaceSettings,
  OpenAppTarget,
  WorkspaceGroup,
  WorkspaceInfo,
} from "../../../types";
import { formatDownloadSize } from "../../../utils/formatting";
import {
  getCodexConfigPath,
  orbitConnectTest,
  orbitRunnerStart,
  orbitRunnerStatus,
  orbitRunnerStop,
  orbitSignInPoll,
  orbitSignInStart,
  orbitSignOut,
} from "../../../services/tauri";
import {
  fileManagerName,
  isMacPlatform,
  isWindowsPlatform,
  openInFileManagerLabel,
} from "../../../utils/platformPaths";
import {
  buildShortcutValue,
  formatShortcut,
  getDefaultInterruptShortcut,
} from "../../../utils/shortcuts";
import { clampUiScale } from "../../../utils/uiScale";
import { pushErrorToast } from "../../../services/toasts";
import {
  DEFAULT_CODE_FONT_FAMILY,
  DEFAULT_UI_FONT_FAMILY,
  CODE_FONT_SIZE_DEFAULT,
  CODE_FONT_SIZE_MAX,
  CODE_FONT_SIZE_MIN,
  clampCodeFontSize,
  normalizeFontFamily,
} from "../../../utils/fonts";
import { DEFAULT_OPEN_APP_ID, OPEN_APP_STORAGE_KEY } from "../../app/constants";
import { GENERIC_APP_ICON, getKnownOpenAppIcon } from "../../app/utils/openAppIcons";
import { useGlobalAgentsMd } from "../hooks/useGlobalAgentsMd";
import { useGlobalCodexConfigToml } from "../hooks/useGlobalCodexConfigToml";
import { ModalShell } from "../../design-system/components/modal/ModalShell";
import { FileEditorCard } from "../../shared/components/FileEditorCard";
import { useAppTranslation } from "../../i18n/i18n";

const DICTATION_MODELS = [
  {
    id: "tiny",
    size: "75 MB",
    labelKey: "dictation.models.tiny.label",
    noteKey: "dictation.models.tiny.note",
  },
  {
    id: "base",
    size: "142 MB",
    labelKey: "dictation.models.base.label",
    noteKey: "dictation.models.base.note",
  },
  {
    id: "small",
    size: "466 MB",
    labelKey: "dictation.models.small.label",
    noteKey: "dictation.models.small.note",
  },
  {
    id: "medium",
    size: "1.5 GB",
    labelKey: "dictation.models.medium.label",
    noteKey: "dictation.models.medium.note",
  },
  {
    id: "large-v3",
    size: "3.0 GB",
    labelKey: "dictation.models.largeV3.label",
    noteKey: "dictation.models.largeV3.note",
  },
] as const;

const DICTATION_LANGUAGE_OPTIONS = [
  { id: "en", labelKey: "dictation.languages.en" },
  { id: "es", labelKey: "dictation.languages.es" },
  { id: "fr", labelKey: "dictation.languages.fr" },
  { id: "de", labelKey: "dictation.languages.de" },
  { id: "it", labelKey: "dictation.languages.it" },
  { id: "pt", labelKey: "dictation.languages.pt" },
  { id: "nl", labelKey: "dictation.languages.nl" },
  { id: "sv", labelKey: "dictation.languages.sv" },
  { id: "no", labelKey: "dictation.languages.no" },
  { id: "da", labelKey: "dictation.languages.da" },
  { id: "fi", labelKey: "dictation.languages.fi" },
  { id: "pl", labelKey: "dictation.languages.pl" },
  { id: "tr", labelKey: "dictation.languages.tr" },
  { id: "ru", labelKey: "dictation.languages.ru" },
  { id: "uk", labelKey: "dictation.languages.uk" },
  { id: "ja", labelKey: "dictation.languages.ja" },
  { id: "ko", labelKey: "dictation.languages.ko" },
  { id: "zh", labelKey: "dictation.languages.zh" },
] as const;

type ComposerPreset = AppSettings["composerEditorPreset"];

type ComposerPresetSettings = Pick<
  AppSettings,
  | "composerFenceExpandOnSpace"
  | "composerFenceExpandOnEnter"
  | "composerFenceLanguageTags"
  | "composerFenceWrapSelection"
  | "composerFenceAutoWrapPasteMultiline"
  | "composerFenceAutoWrapPasteCodeLike"
  | "composerListContinuation"
  | "composerCodeBlockCopyUseModifier"
>;

const COMPOSER_PRESET_LABELS: Record<ComposerPreset, string> = {
  default: "composer.presets.defaultLabel",
  helpful: "composer.presets.helpfulLabel",
  smart: "composer.presets.smartLabel",
};

const COMPOSER_PRESET_CONFIGS: Record<ComposerPreset, ComposerPresetSettings> = {
  default: {
    composerFenceExpandOnSpace: false,
    composerFenceExpandOnEnter: false,
    composerFenceLanguageTags: false,
    composerFenceWrapSelection: false,
    composerFenceAutoWrapPasteMultiline: false,
    composerFenceAutoWrapPasteCodeLike: false,
    composerListContinuation: false,
    composerCodeBlockCopyUseModifier: false,
  },
  helpful: {
    composerFenceExpandOnSpace: true,
    composerFenceExpandOnEnter: false,
    composerFenceLanguageTags: true,
    composerFenceWrapSelection: true,
    composerFenceAutoWrapPasteMultiline: true,
    composerFenceAutoWrapPasteCodeLike: false,
    composerListContinuation: true,
    composerCodeBlockCopyUseModifier: false,
  },
  smart: {
    composerFenceExpandOnSpace: true,
    composerFenceExpandOnEnter: false,
    composerFenceLanguageTags: true,
    composerFenceWrapSelection: true,
    composerFenceAutoWrapPasteMultiline: true,
    composerFenceAutoWrapPasteCodeLike: true,
    composerListContinuation: true,
    composerCodeBlockCopyUseModifier: false,
  },
};

const normalizeOverrideValue = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const normalizeWorktreeSetupScript = (
  value: string | null | undefined,
): string | null => {
  const next = value ?? "";
  return next.trim().length > 0 ? next : null;
};

const buildWorkspaceOverrideDrafts = (
  projects: WorkspaceInfo[],
  prev: Record<string, string>,
  getValue: (workspace: WorkspaceInfo) => string | null | undefined,
): Record<string, string> => {
  const next: Record<string, string> = {};
  projects.forEach((workspace) => {
    const existing = prev[workspace.id];
    next[workspace.id] = existing ?? getValue(workspace) ?? "";
  });
  return next;
};

type OrbitServiceClient = {
  orbitConnectTest: () => Promise<OrbitConnectTestResult>;
  orbitSignInStart: () => Promise<OrbitDeviceCodeStart>;
  orbitSignInPoll: (deviceCode: string) => Promise<OrbitSignInPollResult>;
  orbitSignOut: () => Promise<OrbitSignOutResult>;
  orbitRunnerStart: () => Promise<OrbitRunnerStatus>;
  orbitRunnerStop: () => Promise<OrbitRunnerStatus>;
  orbitRunnerStatus: () => Promise<OrbitRunnerStatus>;
};

const orbitServices: OrbitServiceClient = {
  orbitConnectTest,
  orbitSignInStart,
  orbitSignInPoll,
  orbitSignOut,
  orbitRunnerStart,
  orbitRunnerStop,
  orbitRunnerStatus,
};

const ORBIT_DEFAULT_POLL_INTERVAL_SECONDS = 5;
const ORBIT_MAX_INLINE_POLL_SECONDS = 180;

const delay = (durationMs: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });

type OrbitActionResult =
  | OrbitConnectTestResult
  | OrbitSignInPollResult
  | OrbitSignOutResult
  | OrbitRunnerStatus;

const getOrbitStatusText = (
  value: OrbitActionResult,
  fallback: string,
  t: (key: string, options?: Record<string, unknown>) => string,
): string => {
  if ("ok" in value) {
    if (!value.ok) {
      return value.message || fallback;
    }
    if (value.message.trim()) {
      return value.message;
    }
    if (typeof value.latencyMs === "number") {
      return t("codex.orbitConnectedLatency", { latencyMs: value.latencyMs });
    }
    return fallback;
  }

  if ("status" in value) {
    if (value.message && value.message.trim()) {
      return value.message;
    }
    switch (value.status) {
      case "pending":
        return t("codex.orbitSignInPending");
      case "authorized":
        return t("codex.orbitSignInComplete");
      case "denied":
        return t("codex.orbitSignInDenied");
      case "expired":
        return t("codex.orbitSignInCodeExpired");
      case "error":
        return t("codex.orbitSignInFailed");
      default:
        return fallback;
    }
  }

  if ("success" in value) {
    if (!value.success && value.message && value.message.trim()) {
      return value.message;
    }
    return value.success ? t("codex.orbitSignedOut") : fallback;
  }

  if (value.state === "running") {
    return value.pid
      ? t("codex.orbitRunnerRunningWithPid", { pid: value.pid })
      : t("codex.orbitRunnerRunning");
  }
  if (value.state === "error") {
    return value.lastError?.trim() || t("codex.orbitRunnerErrorState");
  }
  return t("codex.orbitRunnerStopped");
};

export type SettingsViewProps = {
  workspaceGroups: WorkspaceGroup[];
  groupedWorkspaces: Array<{
    id: string | null;
    name: string;
    workspaces: WorkspaceInfo[];
  }>;
  ungroupedLabel: string;
  onClose: () => void;
  onMoveWorkspace: (id: string, direction: "up" | "down") => void;
  onDeleteWorkspace: (id: string) => void;
  onCreateWorkspaceGroup: (name: string) => Promise<WorkspaceGroup | null>;
  onRenameWorkspaceGroup: (id: string, name: string) => Promise<boolean | null>;
  onMoveWorkspaceGroup: (id: string, direction: "up" | "down") => Promise<boolean | null>;
  onDeleteWorkspaceGroup: (id: string) => Promise<boolean | null>;
  onAssignWorkspaceGroup: (
    workspaceId: string,
    groupId: string | null,
  ) => Promise<boolean | null>;
  reduceTransparency: boolean;
  onToggleTransparency: (value: boolean) => void;
  appSettings: AppSettings;
  openAppIconById: Record<string, string>;
  onUpdateAppSettings: (next: AppSettings) => Promise<void>;
  onRunDoctor: (
    codexBin: string | null,
    codexArgs: string | null,
  ) => Promise<CodexDoctorResult>;
  onUpdateWorkspaceCodexBin: (id: string, codexBin: string | null) => Promise<void>;
  onUpdateWorkspaceSettings: (
    id: string,
    settings: Partial<WorkspaceSettings>,
  ) => Promise<void>;
  scaleShortcutTitle: string;
  scaleShortcutText: string;
  onTestNotificationSound: () => void;
  onTestSystemNotification: () => void;
  dictationModelStatus?: DictationModelStatus | null;
  onDownloadDictationModel?: () => void;
  onCancelDictationDownload?: () => void;
  onRemoveDictationModel?: () => void;
  initialSection?: CodexSection;
  orbitServiceClient?: OrbitServiceClient;
};

type SettingsSection =
  | "projects"
  | "environments"
  | "display"
  | "composer"
  | "dictation"
  | "shortcuts"
  | "open-apps"
  | "git";
type CodexSection = SettingsSection | "codex" | "features";
type ShortcutSettingKey =
  | "composerModelShortcut"
  | "composerAccessShortcut"
  | "composerReasoningShortcut"
  | "composerCollaborationShortcut"
  | "interruptShortcut"
  | "newAgentShortcut"
  | "newWorktreeAgentShortcut"
  | "newCloneAgentShortcut"
  | "archiveThreadShortcut"
  | "toggleProjectsSidebarShortcut"
  | "toggleGitSidebarShortcut"
  | "branchSwitcherShortcut"
  | "toggleDebugPanelShortcut"
  | "toggleTerminalShortcut"
  | "cycleAgentNextShortcut"
  | "cycleAgentPrevShortcut"
  | "cycleWorkspaceNextShortcut"
  | "cycleWorkspacePrevShortcut";
type ShortcutDraftKey =
  | "model"
  | "access"
  | "reasoning"
  | "collaboration"
  | "interrupt"
  | "newAgent"
  | "newWorktreeAgent"
  | "newCloneAgent"
  | "archiveThread"
  | "projectsSidebar"
  | "gitSidebar"
  | "branchSwitcher"
  | "debugPanel"
  | "terminal"
  | "cycleAgentNext"
  | "cycleAgentPrev"
  | "cycleWorkspaceNext"
  | "cycleWorkspacePrev";

type OpenAppDraft = OpenAppTarget & { argsText: string };

const shortcutDraftKeyBySetting: Record<ShortcutSettingKey, ShortcutDraftKey> = {
  composerModelShortcut: "model",
  composerAccessShortcut: "access",
  composerReasoningShortcut: "reasoning",
  composerCollaborationShortcut: "collaboration",
  interruptShortcut: "interrupt",
  newAgentShortcut: "newAgent",
  newWorktreeAgentShortcut: "newWorktreeAgent",
  newCloneAgentShortcut: "newCloneAgent",
  archiveThreadShortcut: "archiveThread",
  toggleProjectsSidebarShortcut: "projectsSidebar",
  toggleGitSidebarShortcut: "gitSidebar",
  branchSwitcherShortcut: "branchSwitcher",
  toggleDebugPanelShortcut: "debugPanel",
  toggleTerminalShortcut: "terminal",
  cycleAgentNextShortcut: "cycleAgentNext",
  cycleAgentPrevShortcut: "cycleAgentPrev",
  cycleWorkspaceNextShortcut: "cycleWorkspaceNext",
  cycleWorkspacePrevShortcut: "cycleWorkspacePrev",
};

const buildOpenAppDrafts = (targets: OpenAppTarget[]): OpenAppDraft[] =>
  targets.map((target) => ({
    ...target,
    argsText: target.args.join(" "),
  }));

const isOpenAppLabelValid = (label: string) => label.trim().length > 0;

const isOpenAppDraftComplete = (draft: OpenAppDraft) => {
  if (!isOpenAppLabelValid(draft.label)) {
    return false;
  }
  if (draft.kind === "app") {
    return Boolean(draft.appName?.trim());
  }
  if (draft.kind === "command") {
    return Boolean(draft.command?.trim());
  }
  return true;
};

const isOpenAppTargetComplete = (target: OpenAppTarget) => {
  if (!isOpenAppLabelValid(target.label)) {
    return false;
  }
  if (target.kind === "app") {
    return Boolean(target.appName?.trim());
  }
  if (target.kind === "command") {
    return Boolean(target.command?.trim());
  }
  return true;
};

const createOpenAppId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `open-app-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function SettingsView({
  workspaceGroups,
  groupedWorkspaces,
  ungroupedLabel,
  onClose,
  onMoveWorkspace,
  onDeleteWorkspace,
  onCreateWorkspaceGroup,
  onRenameWorkspaceGroup,
  onMoveWorkspaceGroup,
  onDeleteWorkspaceGroup,
  onAssignWorkspaceGroup,
  reduceTransparency,
  onToggleTransparency,
  appSettings,
  openAppIconById,
  onUpdateAppSettings,
  onRunDoctor,
  onUpdateWorkspaceCodexBin,
  onUpdateWorkspaceSettings,
  scaleShortcutTitle,
  scaleShortcutText,
  onTestNotificationSound,
  onTestSystemNotification,
  dictationModelStatus,
  onDownloadDictationModel,
  onCancelDictationDownload,
  onRemoveDictationModel,
  initialSection,
  orbitServiceClient = orbitServices,
}: SettingsViewProps) {
  const { t } = useAppTranslation("settings");
  const [activeSection, setActiveSection] = useState<CodexSection>("projects");
  const [environmentWorkspaceId, setEnvironmentWorkspaceId] = useState<string | null>(
    null,
  );
  const [environmentDraftScript, setEnvironmentDraftScript] = useState("");
  const [environmentSavedScript, setEnvironmentSavedScript] = useState<string | null>(
    null,
  );
  const [environmentLoadedWorkspaceId, setEnvironmentLoadedWorkspaceId] = useState<
    string | null
  >(null);
  const [environmentError, setEnvironmentError] = useState<string | null>(null);
  const [environmentSaving, setEnvironmentSaving] = useState(false);
  const [codexPathDraft, setCodexPathDraft] = useState(appSettings.codexBin ?? "");
  const [codexArgsDraft, setCodexArgsDraft] = useState(appSettings.codexArgs ?? "");
  const [remoteHostDraft, setRemoteHostDraft] = useState(appSettings.remoteBackendHost);
  const [remoteTokenDraft, setRemoteTokenDraft] = useState(appSettings.remoteBackendToken ?? "");
  const [orbitWsUrlDraft, setOrbitWsUrlDraft] = useState(appSettings.orbitWsUrl ?? "");
  const [orbitAuthUrlDraft, setOrbitAuthUrlDraft] = useState(appSettings.orbitAuthUrl ?? "");
  const [orbitRunnerNameDraft, setOrbitRunnerNameDraft] = useState(
    appSettings.orbitRunnerName ?? "",
  );
  const [orbitAccessClientIdDraft, setOrbitAccessClientIdDraft] = useState(
    appSettings.orbitAccessClientId ?? "",
  );
  const [orbitAccessClientSecretRefDraft, setOrbitAccessClientSecretRefDraft] =
    useState(appSettings.orbitAccessClientSecretRef ?? "");
  const [orbitStatusText, setOrbitStatusText] = useState<string | null>(null);
  const [orbitAuthCode, setOrbitAuthCode] = useState<string | null>(null);
  const [orbitVerificationUrl, setOrbitVerificationUrl] = useState<string | null>(
    null,
  );
  const [orbitBusyAction, setOrbitBusyAction] = useState<string | null>(null);
  const [scaleDraft, setScaleDraft] = useState(
    `${Math.round(clampUiScale(appSettings.uiScale) * 100)}%`,
  );
  const [uiFontDraft, setUiFontDraft] = useState(appSettings.uiFontFamily);
  const [codeFontDraft, setCodeFontDraft] = useState(appSettings.codeFontFamily);
  const [codeFontSizeDraft, setCodeFontSizeDraft] = useState(appSettings.codeFontSize);
  const [codexBinOverrideDrafts, setCodexBinOverrideDrafts] = useState<
    Record<string, string>
  >({});
  const [codexHomeOverrideDrafts, setCodexHomeOverrideDrafts] = useState<
    Record<string, string>
  >({});
  const [codexArgsOverrideDrafts, setCodexArgsOverrideDrafts] = useState<
    Record<string, string>
  >({});
  const [groupDrafts, setGroupDrafts] = useState<Record<string, string>>({});
  const [newGroupName, setNewGroupName] = useState("");
  const [groupError, setGroupError] = useState<string | null>(null);
  const [openAppDrafts, setOpenAppDrafts] = useState<OpenAppDraft[]>(() =>
    buildOpenAppDrafts(appSettings.openAppTargets),
  );
  const [openAppSelectedId, setOpenAppSelectedId] = useState(
    appSettings.selectedOpenAppId,
  );
  const [doctorState, setDoctorState] = useState<{
    status: "idle" | "running" | "done";
    result: CodexDoctorResult | null;
  }>({ status: "idle", result: null });
  const {
    content: globalAgentsContent,
    exists: globalAgentsExists,
    truncated: globalAgentsTruncated,
    isLoading: globalAgentsLoading,
    isSaving: globalAgentsSaving,
    error: globalAgentsError,
    isDirty: globalAgentsDirty,
    setContent: setGlobalAgentsContent,
    refresh: refreshGlobalAgents,
    save: saveGlobalAgents,
  } = useGlobalAgentsMd();
  const {
    content: globalConfigContent,
    exists: globalConfigExists,
    truncated: globalConfigTruncated,
    isLoading: globalConfigLoading,
    isSaving: globalConfigSaving,
    error: globalConfigError,
    isDirty: globalConfigDirty,
    setContent: setGlobalConfigContent,
    refresh: refreshGlobalConfig,
    save: saveGlobalConfig,
  } = useGlobalCodexConfigToml();
  const [openConfigError, setOpenConfigError] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [shortcutDrafts, setShortcutDrafts] = useState({
    model: appSettings.composerModelShortcut ?? "",
    access: appSettings.composerAccessShortcut ?? "",
    reasoning: appSettings.composerReasoningShortcut ?? "",
    collaboration: appSettings.composerCollaborationShortcut ?? "",
    interrupt: appSettings.interruptShortcut ?? "",
    newAgent: appSettings.newAgentShortcut ?? "",
    newWorktreeAgent: appSettings.newWorktreeAgentShortcut ?? "",
    newCloneAgent: appSettings.newCloneAgentShortcut ?? "",
    archiveThread: appSettings.archiveThreadShortcut ?? "",
    projectsSidebar: appSettings.toggleProjectsSidebarShortcut ?? "",
    gitSidebar: appSettings.toggleGitSidebarShortcut ?? "",
    branchSwitcher: appSettings.branchSwitcherShortcut ?? "",
    debugPanel: appSettings.toggleDebugPanelShortcut ?? "",
    terminal: appSettings.toggleTerminalShortcut ?? "",
    cycleAgentNext: appSettings.cycleAgentNextShortcut ?? "",
    cycleAgentPrev: appSettings.cycleAgentPrevShortcut ?? "",
    cycleWorkspaceNext: appSettings.cycleWorkspaceNextShortcut ?? "",
    cycleWorkspacePrev: appSettings.cycleWorkspacePrevShortcut ?? "",
  });
  const latestSettingsRef = useRef(appSettings);
  const dictationReady = dictationModelStatus?.state === "ready";
  const dictationProgress = dictationModelStatus?.progress ?? null;
  const globalAgentsStatus = globalAgentsLoading
    ? t("codex.statusLoading")
    : globalAgentsSaving
      ? t("codex.statusSaving")
      : globalAgentsExists
        ? ""
        : t("codex.statusNotFound");
  const globalAgentsMetaParts: string[] = [];
  if (globalAgentsStatus) {
    globalAgentsMetaParts.push(globalAgentsStatus);
  }
  if (globalAgentsTruncated) {
    globalAgentsMetaParts.push(t("codex.statusTruncated"));
  }
  const globalAgentsMeta = globalAgentsMetaParts.join(" · ");
  const globalAgentsSaveLabel = globalAgentsExists ? t("codex.save") : t("codex.create");
  const globalAgentsSaveDisabled = globalAgentsLoading || globalAgentsSaving || !globalAgentsDirty;
  const globalAgentsRefreshDisabled = globalAgentsLoading || globalAgentsSaving;
  const globalConfigStatus = globalConfigLoading
    ? t("codex.statusLoading")
    : globalConfigSaving
      ? t("codex.statusSaving")
      : globalConfigExists
        ? ""
        : t("codex.statusNotFound");
  const globalConfigMetaParts: string[] = [];
  if (globalConfigStatus) {
    globalConfigMetaParts.push(globalConfigStatus);
  }
  if (globalConfigTruncated) {
    globalConfigMetaParts.push(t("codex.statusTruncated"));
  }
  const globalConfigMeta = globalConfigMetaParts.join(" · ");
  const globalConfigSaveLabel = globalConfigExists ? t("codex.save") : t("codex.create");
  const globalConfigSaveDisabled = globalConfigLoading || globalConfigSaving || !globalConfigDirty;
  const globalConfigRefreshDisabled = globalConfigLoading || globalConfigSaving;
  const optionKeyLabel = isMacPlatform() ? "Option" : "Alt";
  const metaKeyLabel = isMacPlatform()
    ? "Command"
    : isWindowsPlatform()
      ? "Windows"
      : "Meta";
  const selectedDictationModel = useMemo(() => {
    return (
      DICTATION_MODELS.find(
        (model) => model.id === appSettings.dictationModelId,
      ) ?? DICTATION_MODELS[1]
    );
  }, [appSettings.dictationModelId]);

  const projects = useMemo(
    () => groupedWorkspaces.flatMap((group) => group.workspaces),
    [groupedWorkspaces],
  );
  const mainWorkspaces = useMemo(
    () => projects.filter((workspace) => (workspace.kind ?? "main") !== "worktree"),
    [projects],
  );
  const environmentWorkspace = useMemo(() => {
    if (mainWorkspaces.length === 0) {
      return null;
    }
    if (environmentWorkspaceId) {
      const found = mainWorkspaces.find((workspace) => workspace.id === environmentWorkspaceId);
      if (found) {
        return found;
      }
    }
    return mainWorkspaces[0] ?? null;
  }, [environmentWorkspaceId, mainWorkspaces]);
  const environmentSavedScriptFromWorkspace = useMemo(() => {
    return normalizeWorktreeSetupScript(environmentWorkspace?.settings.worktreeSetupScript);
  }, [environmentWorkspace?.settings.worktreeSetupScript]);
  const environmentDraftNormalized = useMemo(() => {
    return normalizeWorktreeSetupScript(environmentDraftScript);
  }, [environmentDraftScript]);
  const environmentDirty = environmentDraftNormalized !== environmentSavedScript;
  const hasCodexHomeOverrides = useMemo(
    () => projects.some((workspace) => workspace.settings.codexHome != null),
    [projects],
  );

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      onClose();
    };

    const handleCloseShortcut = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "w") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    window.addEventListener("keydown", handleCloseShortcut);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("keydown", handleCloseShortcut);
    };
  }, [onClose]);

  useEffect(() => {
    latestSettingsRef.current = appSettings;
  }, [appSettings]);

  useEffect(() => {
    setCodexPathDraft(appSettings.codexBin ?? "");
  }, [appSettings.codexBin]);

  useEffect(() => {
    setCodexArgsDraft(appSettings.codexArgs ?? "");
  }, [appSettings.codexArgs]);

  useEffect(() => {
    setRemoteHostDraft(appSettings.remoteBackendHost);
  }, [appSettings.remoteBackendHost]);

  useEffect(() => {
    setRemoteTokenDraft(appSettings.remoteBackendToken ?? "");
  }, [appSettings.remoteBackendToken]);

  useEffect(() => {
    setOrbitWsUrlDraft(appSettings.orbitWsUrl ?? "");
  }, [appSettings.orbitWsUrl]);

  useEffect(() => {
    setOrbitAuthUrlDraft(appSettings.orbitAuthUrl ?? "");
  }, [appSettings.orbitAuthUrl]);

  useEffect(() => {
    setOrbitRunnerNameDraft(appSettings.orbitRunnerName ?? "");
  }, [appSettings.orbitRunnerName]);

  useEffect(() => {
    setOrbitAccessClientIdDraft(appSettings.orbitAccessClientId ?? "");
  }, [appSettings.orbitAccessClientId]);

  useEffect(() => {
    setOrbitAccessClientSecretRefDraft(appSettings.orbitAccessClientSecretRef ?? "");
  }, [appSettings.orbitAccessClientSecretRef]);

  useEffect(() => {
    setScaleDraft(`${Math.round(clampUiScale(appSettings.uiScale) * 100)}%`);
  }, [appSettings.uiScale]);

  useEffect(() => {
    setUiFontDraft(appSettings.uiFontFamily);
  }, [appSettings.uiFontFamily]);

  useEffect(() => {
    setCodeFontDraft(appSettings.codeFontFamily);
  }, [appSettings.codeFontFamily]);

  useEffect(() => {
    setCodeFontSizeDraft(appSettings.codeFontSize);
  }, [appSettings.codeFontSize]);

  useEffect(() => {
    setOpenAppDrafts(buildOpenAppDrafts(appSettings.openAppTargets));
    setOpenAppSelectedId(appSettings.selectedOpenAppId);
  }, [appSettings.openAppTargets, appSettings.selectedOpenAppId]);

  useEffect(() => {
    setShortcutDrafts({
      model: appSettings.composerModelShortcut ?? "",
      access: appSettings.composerAccessShortcut ?? "",
      reasoning: appSettings.composerReasoningShortcut ?? "",
      collaboration: appSettings.composerCollaborationShortcut ?? "",
      interrupt: appSettings.interruptShortcut ?? "",
      newAgent: appSettings.newAgentShortcut ?? "",
      newWorktreeAgent: appSettings.newWorktreeAgentShortcut ?? "",
      newCloneAgent: appSettings.newCloneAgentShortcut ?? "",
      archiveThread: appSettings.archiveThreadShortcut ?? "",
      projectsSidebar: appSettings.toggleProjectsSidebarShortcut ?? "",
      gitSidebar: appSettings.toggleGitSidebarShortcut ?? "",
      branchSwitcher: appSettings.branchSwitcherShortcut ?? "",
      debugPanel: appSettings.toggleDebugPanelShortcut ?? "",
      terminal: appSettings.toggleTerminalShortcut ?? "",
      cycleAgentNext: appSettings.cycleAgentNextShortcut ?? "",
      cycleAgentPrev: appSettings.cycleAgentPrevShortcut ?? "",
      cycleWorkspaceNext: appSettings.cycleWorkspaceNextShortcut ?? "",
      cycleWorkspacePrev: appSettings.cycleWorkspacePrevShortcut ?? "",
    });
  }, [
    appSettings.composerAccessShortcut,
    appSettings.composerModelShortcut,
    appSettings.composerReasoningShortcut,
    appSettings.composerCollaborationShortcut,
    appSettings.interruptShortcut,
    appSettings.newAgentShortcut,
    appSettings.newWorktreeAgentShortcut,
    appSettings.newCloneAgentShortcut,
    appSettings.archiveThreadShortcut,
    appSettings.toggleProjectsSidebarShortcut,
    appSettings.toggleGitSidebarShortcut,
    appSettings.branchSwitcherShortcut,
    appSettings.toggleDebugPanelShortcut,
    appSettings.toggleTerminalShortcut,
    appSettings.cycleAgentNextShortcut,
    appSettings.cycleAgentPrevShortcut,
    appSettings.cycleWorkspaceNextShortcut,
    appSettings.cycleWorkspacePrevShortcut,
  ]);

  const handleOpenConfig = useCallback(async () => {
    setOpenConfigError(null);
    try {
      const configPath = await getCodexConfigPath();
      await revealItemInDir(configPath);
    } catch (error) {
      setOpenConfigError(
        error instanceof Error ? error.message : "Unable to open config.",
      );
    }
  }, []);

  useEffect(() => {
    setCodexBinOverrideDrafts((prev) =>
      buildWorkspaceOverrideDrafts(
        projects,
        prev,
        (workspace) => workspace.codex_bin ?? null,
      ),
    );
    setCodexHomeOverrideDrafts((prev) =>
      buildWorkspaceOverrideDrafts(
        projects,
        prev,
        (workspace) => workspace.settings.codexHome ?? null,
      ),
    );
    setCodexArgsOverrideDrafts((prev) =>
      buildWorkspaceOverrideDrafts(
        projects,
        prev,
        (workspace) => workspace.settings.codexArgs ?? null,
      ),
    );
  }, [projects]);

  useEffect(() => {
    setGroupDrafts((prev) => {
      const next: Record<string, string> = {};
      workspaceGroups.forEach((group) => {
        next[group.id] = prev[group.id] ?? group.name;
      });
      return next;
    });
  }, [workspaceGroups]);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  useEffect(() => {
    if (!environmentWorkspace) {
      setEnvironmentWorkspaceId(null);
      setEnvironmentLoadedWorkspaceId(null);
      setEnvironmentSavedScript(null);
      setEnvironmentDraftScript("");
      setEnvironmentError(null);
      setEnvironmentSaving(false);
      return;
    }

    if (environmentWorkspaceId !== environmentWorkspace.id) {
      setEnvironmentWorkspaceId(environmentWorkspace.id);
    }
  }, [environmentWorkspace, environmentWorkspaceId]);

  useEffect(() => {
    if (!environmentWorkspace) {
      return;
    }

    if (environmentLoadedWorkspaceId !== environmentWorkspace.id) {
      setEnvironmentLoadedWorkspaceId(environmentWorkspace.id);
      setEnvironmentSavedScript(environmentSavedScriptFromWorkspace);
      setEnvironmentDraftScript(environmentSavedScriptFromWorkspace ?? "");
      setEnvironmentError(null);
      return;
    }

    if (!environmentDirty && environmentSavedScript !== environmentSavedScriptFromWorkspace) {
      setEnvironmentSavedScript(environmentSavedScriptFromWorkspace);
      setEnvironmentDraftScript(environmentSavedScriptFromWorkspace ?? "");
      setEnvironmentError(null);
    }
  }, [
    environmentDirty,
    environmentLoadedWorkspaceId,
    environmentSavedScript,
    environmentSavedScriptFromWorkspace,
    environmentWorkspace,
  ]);

  const nextCodexBin = codexPathDraft.trim() ? codexPathDraft.trim() : null;
  const nextCodexArgs = codexArgsDraft.trim() ? codexArgsDraft.trim() : null;
  const codexDirty =
    nextCodexBin !== (appSettings.codexBin ?? null) ||
    nextCodexArgs !== (appSettings.codexArgs ?? null);

  const trimmedScale = scaleDraft.trim();
  const parsedPercent = trimmedScale
    ? Number(trimmedScale.replace("%", ""))
    : Number.NaN;
  const parsedScale = Number.isFinite(parsedPercent) ? parsedPercent / 100 : null;

  const handleSaveCodexSettings = async () => {
    setIsSavingSettings(true);
    try {
      await onUpdateAppSettings({
        ...appSettings,
        codexBin: nextCodexBin,
        codexArgs: nextCodexArgs,
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleCommitRemoteHost = async () => {
    const nextHost = remoteHostDraft.trim() || "127.0.0.1:4732";
    setRemoteHostDraft(nextHost);
    if (nextHost === appSettings.remoteBackendHost) {
      return;
    }
    await onUpdateAppSettings({
      ...appSettings,
      remoteBackendHost: nextHost,
    });
  };

  const handleCommitRemoteToken = async () => {
    const nextToken = remoteTokenDraft.trim() ? remoteTokenDraft.trim() : null;
    setRemoteTokenDraft(nextToken ?? "");
    if (nextToken === appSettings.remoteBackendToken) {
      return;
    }
    await onUpdateAppSettings({
      ...appSettings,
      remoteBackendToken: nextToken,
    });
  };

  const handleChangeRemoteProvider = async (
    provider: AppSettings["remoteBackendProvider"],
  ) => {
    if (provider === appSettings.remoteBackendProvider) {
      return;
    }
    await onUpdateAppSettings({
      ...appSettings,
      remoteBackendProvider: provider,
    });
  };

  const handleChangeOrbitDeploymentMode = async (
    deploymentMode: AppSettings["orbitDeploymentMode"],
  ) => {
    if (deploymentMode === appSettings.orbitDeploymentMode) {
      return;
    }
    await onUpdateAppSettings({
      ...appSettings,
      orbitDeploymentMode: deploymentMode,
    });
  };

  const handleCommitOrbitWsUrl = async () => {
    const nextValue = normalizeOverrideValue(orbitWsUrlDraft);
    setOrbitWsUrlDraft(nextValue ?? "");
    if (nextValue === appSettings.orbitWsUrl) {
      return;
    }
    await onUpdateAppSettings({
      ...appSettings,
      orbitWsUrl: nextValue,
    });
  };

  const handleCommitOrbitAuthUrl = async () => {
    const nextValue = normalizeOverrideValue(orbitAuthUrlDraft);
    setOrbitAuthUrlDraft(nextValue ?? "");
    if (nextValue === appSettings.orbitAuthUrl) {
      return;
    }
    await onUpdateAppSettings({
      ...appSettings,
      orbitAuthUrl: nextValue,
    });
  };

  const handleCommitOrbitRunnerName = async () => {
    const nextValue = normalizeOverrideValue(orbitRunnerNameDraft);
    setOrbitRunnerNameDraft(nextValue ?? "");
    if (nextValue === appSettings.orbitRunnerName) {
      return;
    }
    await onUpdateAppSettings({
      ...appSettings,
      orbitRunnerName: nextValue,
    });
  };

  const handleCommitOrbitAccessClientId = async () => {
    const nextValue = normalizeOverrideValue(orbitAccessClientIdDraft);
    setOrbitAccessClientIdDraft(nextValue ?? "");
    if (nextValue === appSettings.orbitAccessClientId) {
      return;
    }
    await onUpdateAppSettings({
      ...appSettings,
      orbitAccessClientId: nextValue,
    });
  };

  const handleCommitOrbitAccessClientSecretRef = async () => {
    const nextValue = normalizeOverrideValue(orbitAccessClientSecretRefDraft);
    setOrbitAccessClientSecretRefDraft(nextValue ?? "");
    if (nextValue === appSettings.orbitAccessClientSecretRef) {
      return;
    }
    await onUpdateAppSettings({
      ...appSettings,
      orbitAccessClientSecretRef: nextValue,
    });
  };

  const runOrbitAction = async <T extends OrbitActionResult>(
    actionKey: string,
    actionLabel: string,
    action: () => Promise<T>,
    successFallback: string,
  ): Promise<T | null> => {
    setOrbitBusyAction(actionKey);
    setOrbitStatusText(
      t("codex.orbitActionInProgress", {
        actionLabel,
      }),
    );
    try {
      const result = await action();
      setOrbitStatusText(getOrbitStatusText(result, successFallback, t));
      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("codex.orbitUnknownError");
      setOrbitStatusText(
        t("codex.orbitActionFailed", {
          actionLabel,
          message,
        }),
      );
      return null;
    } finally {
      setOrbitBusyAction(null);
    }
  };

  const syncRemoteBackendToken = async (nextToken: string | null) => {
    const normalizedToken = nextToken?.trim() ? nextToken.trim() : null;
    setRemoteTokenDraft(normalizedToken ?? "");
    const latestSettings = latestSettingsRef.current;
    if (normalizedToken === latestSettings.remoteBackendToken) {
      return;
    }
    const nextSettings = {
      ...latestSettings,
      remoteBackendToken: normalizedToken,
    };
    latestSettingsRef.current = nextSettings;
    await onUpdateAppSettings({
      ...nextSettings,
    });
  };

  const handleOrbitConnectTest = () => {
    void runOrbitAction(
      "connect-test",
      t("codex.connectTest"),
      orbitServiceClient.orbitConnectTest,
      t("codex.orbitConnectionTestSucceeded"),
    );
  };

  const handleOrbitSignIn = () => {
    void (async () => {
      setOrbitBusyAction("sign-in");
      setOrbitStatusText(t("codex.orbitSignInStarting"));
      setOrbitAuthCode(null);
      setOrbitVerificationUrl(null);
      try {
        const startResult = await orbitServiceClient.orbitSignInStart();
        setOrbitAuthCode(startResult.userCode ?? startResult.deviceCode);
        setOrbitVerificationUrl(
          startResult.verificationUriComplete ?? startResult.verificationUri,
        );
        setOrbitStatusText(t("codex.orbitSignInStarted"));

        const maxPollWindowSeconds = Math.max(
          1,
          Math.min(startResult.expiresInSeconds, ORBIT_MAX_INLINE_POLL_SECONDS),
        );
        const deadlineMs = Date.now() + maxPollWindowSeconds * 1000;
        let pollIntervalSeconds = Math.max(
          1,
          startResult.intervalSeconds || ORBIT_DEFAULT_POLL_INTERVAL_SECONDS,
        );

        while (Date.now() < deadlineMs) {
          await delay(pollIntervalSeconds * 1000);
          const pollResult = await orbitServiceClient.orbitSignInPoll(
            startResult.deviceCode,
          );
          setOrbitStatusText(
            getOrbitStatusText(
              pollResult,
              t("codex.orbitSignInStatusRefreshed"),
              t,
            ),
          );

          if (pollResult.status === "pending") {
            if (typeof pollResult.intervalSeconds === "number") {
              pollIntervalSeconds = Math.max(1, pollResult.intervalSeconds);
            }
            continue;
          }

          if (pollResult.status === "authorized") {
            if (pollResult.token) {
              await syncRemoteBackendToken(pollResult.token);
            }
          }
          return;
        }

        setOrbitStatusText(t("codex.orbitSignInStillPending"));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : t("codex.orbitUnknownError");
        setOrbitStatusText(
          t("codex.orbitActionFailed", {
            actionLabel: t("codex.signIn"),
            message,
          }),
        );
      } finally {
        setOrbitBusyAction(null);
      }
    })();
  };

  const handleOrbitSignOut = () => {
    void (async () => {
      const result = await runOrbitAction(
        "sign-out",
        t("codex.signOut"),
        orbitServiceClient.orbitSignOut,
        t("codex.orbitSignedOutFallback"),
      );
      if (result !== null) {
        await syncRemoteBackendToken(null);
        setOrbitAuthCode(null);
        setOrbitVerificationUrl(null);
      }
    })();
  };

  const handleOrbitRunnerStart = () => {
    void runOrbitAction(
      "runner-start",
      t("codex.startRunner"),
      orbitServiceClient.orbitRunnerStart,
      t("codex.orbitRunnerStarted"),
    );
  };

  const handleOrbitRunnerStop = () => {
    void runOrbitAction(
      "runner-stop",
      t("codex.stopRunner"),
      orbitServiceClient.orbitRunnerStop,
      t("codex.orbitRunnerStopped"),
    );
  };

  const handleOrbitRunnerStatus = () => {
    void runOrbitAction(
      "runner-status",
      t("codex.refreshStatus"),
      orbitServiceClient.orbitRunnerStatus,
      t("codex.orbitRunnerStatusRefreshed"),
    );
  };

  const handleCommitScale = async () => {
    if (parsedScale === null) {
      setScaleDraft(`${Math.round(clampUiScale(appSettings.uiScale) * 100)}%`);
      return;
    }
    const nextScale = clampUiScale(parsedScale);
    setScaleDraft(`${Math.round(nextScale * 100)}%`);
    if (nextScale === appSettings.uiScale) {
      return;
    }
    await onUpdateAppSettings({
      ...appSettings,
      uiScale: nextScale,
    });
  };

  const handleResetScale = async () => {
    if (appSettings.uiScale === 1) {
      setScaleDraft("100%");
      return;
    }
    setScaleDraft("100%");
    await onUpdateAppSettings({
      ...appSettings,
      uiScale: 1,
    });
  };

  const handleCommitUiFont = async () => {
    const nextFont = normalizeFontFamily(
      uiFontDraft,
      DEFAULT_UI_FONT_FAMILY,
    );
    setUiFontDraft(nextFont);
    if (nextFont === appSettings.uiFontFamily) {
      return;
    }
    await onUpdateAppSettings({
      ...appSettings,
      uiFontFamily: nextFont,
    });
  };

  const handleCommitCodeFont = async () => {
    const nextFont = normalizeFontFamily(
      codeFontDraft,
      DEFAULT_CODE_FONT_FAMILY,
    );
    setCodeFontDraft(nextFont);
    if (nextFont === appSettings.codeFontFamily) {
      return;
    }
    await onUpdateAppSettings({
      ...appSettings,
      codeFontFamily: nextFont,
    });
  };

  const handleCommitCodeFontSize = async (nextSize: number) => {
    const clampedSize = clampCodeFontSize(nextSize);
    setCodeFontSizeDraft(clampedSize);
    if (clampedSize === appSettings.codeFontSize) {
      return;
    }
    await onUpdateAppSettings({
      ...appSettings,
      codeFontSize: clampedSize,
    });
  };

  const normalizeOpenAppTargets = useCallback(
    (drafts: OpenAppDraft[]): OpenAppTarget[] =>
      drafts.map(({ argsText, ...target }) => ({
        ...target,
        label: target.label.trim(),
        appName: (target.appName?.trim() ?? "") || null,
        command: (target.command?.trim() ?? "") || null,
        args: argsText.trim() ? argsText.trim().split(/\s+/) : [],
      })),
    [],
  );

  const handleCommitOpenApps = useCallback(
    async (drafts: OpenAppDraft[], selectedId = openAppSelectedId) => {
      const nextTargets = normalizeOpenAppTargets(drafts);
      const resolvedSelectedId = nextTargets.find(
        (target) => target.id === selectedId && isOpenAppTargetComplete(target),
      )?.id;
      const firstCompleteId = nextTargets.find(isOpenAppTargetComplete)?.id;
      const nextSelectedId =
        resolvedSelectedId ??
        firstCompleteId ??
        nextTargets[0]?.id ??
        DEFAULT_OPEN_APP_ID;
      setOpenAppDrafts(buildOpenAppDrafts(nextTargets));
      setOpenAppSelectedId(nextSelectedId);
      await onUpdateAppSettings({
        ...appSettings,
        openAppTargets: nextTargets,
        selectedOpenAppId: nextSelectedId,
      });
    },
    [
      appSettings,
      normalizeOpenAppTargets,
      onUpdateAppSettings,
      openAppSelectedId,
    ],
  );

  const handleOpenAppDraftChange = (
    index: number,
    updates: Partial<OpenAppDraft>,
  ) => {
    setOpenAppDrafts((prev) => {
      const next = [...prev];
      const current = next[index];
      if (!current) {
        return prev;
      }
      next[index] = { ...current, ...updates };
      return next;
    });
  };

  const handleOpenAppKindChange = (index: number, kind: OpenAppTarget["kind"]) => {
    setOpenAppDrafts((prev) => {
      const next = [...prev];
      const current = next[index];
      if (!current) {
        return prev;
      }
      next[index] = {
        ...current,
        kind,
        appName: kind === "app" ? current.appName ?? "" : null,
        command: kind === "command" ? current.command ?? "" : null,
        argsText: kind === "finder" ? "" : current.argsText,
      };
      void handleCommitOpenApps(next);
      return next;
    });
  };

  const handleMoveOpenApp = (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= openAppDrafts.length) {
      return;
    }
    const next = [...openAppDrafts];
    const [moved] = next.splice(index, 1);
    next.splice(nextIndex, 0, moved);
    setOpenAppDrafts(next);
    void handleCommitOpenApps(next);
  };

  const handleDeleteOpenApp = (index: number) => {
    if (openAppDrafts.length <= 1) {
      return;
    }
    const removed = openAppDrafts[index];
    const next = openAppDrafts.filter((_, draftIndex) => draftIndex !== index);
    const nextSelected =
      removed?.id === openAppSelectedId ? next[0]?.id ?? DEFAULT_OPEN_APP_ID : openAppSelectedId;
    setOpenAppDrafts(next);
    void handleCommitOpenApps(next, nextSelected);
  };

  const handleAddOpenApp = () => {
    const newTarget: OpenAppDraft = {
      id: createOpenAppId(),
      label: "New App",
      kind: "app",
      appName: "",
      command: null,
      args: [],
      argsText: "",
    };
    const next = [...openAppDrafts, newTarget];
    setOpenAppDrafts(next);
    void handleCommitOpenApps(next, newTarget.id);
  };

  const handleSelectOpenAppDefault = (id: string) => {
    const selectedTarget = openAppDrafts.find((target) => target.id === id);
    if (selectedTarget && !isOpenAppDraftComplete(selectedTarget)) {
      return;
    }
    setOpenAppSelectedId(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(OPEN_APP_STORAGE_KEY, id);
    }
    void handleCommitOpenApps(openAppDrafts, id);
  };

  const handleComposerPresetChange = (preset: ComposerPreset) => {
    const config = COMPOSER_PRESET_CONFIGS[preset];
    void onUpdateAppSettings({
      ...appSettings,
      composerEditorPreset: preset,
      ...config,
    });
  };

  const handleBrowseCodex = async () => {
    const selection = await open({ multiple: false, directory: false });
    if (!selection || Array.isArray(selection)) {
      return;
    }
    setCodexPathDraft(selection);
  };

  const handleRunDoctor = async () => {
    setDoctorState({ status: "running", result: null });
    try {
      const result = await onRunDoctor(nextCodexBin, nextCodexArgs);
      setDoctorState({ status: "done", result });
    } catch (error) {
      setDoctorState({
        status: "done",
        result: {
          ok: false,
          codexBin: nextCodexBin,
          version: null,
          appServerOk: false,
          details: error instanceof Error ? error.message : String(error),
          path: null,
          nodeOk: false,
          nodeVersion: null,
          nodeDetails: null,
        },
      });
    }
  };

  const updateShortcut = async (key: ShortcutSettingKey, value: string | null) => {
    const draftKey = shortcutDraftKeyBySetting[key];
    setShortcutDrafts((prev) => ({
      ...prev,
      [draftKey]: value ?? "",
    }));
    await onUpdateAppSettings({
      ...appSettings,
      [key]: value,
    });
  };

  const handleShortcutKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    key: ShortcutSettingKey,
  ) => {
    if (event.key === "Tab" && key !== "composerCollaborationShortcut") {
      return;
    }
    if (event.key === "Tab" && !event.shiftKey) {
      return;
    }
    event.preventDefault();
    if (event.key === "Backspace" || event.key === "Delete") {
      void updateShortcut(key, null);
      return;
    }
    const value = buildShortcutValue(event.nativeEvent);
    if (!value) {
      return;
    }
    void updateShortcut(key, value);
  };

  const handleSaveEnvironmentSetup = async () => {
    if (!environmentWorkspace || environmentSaving) {
      return;
    }
    const nextScript = environmentDraftNormalized;
    setEnvironmentSaving(true);
    setEnvironmentError(null);
    try {
      await onUpdateWorkspaceSettings(environmentWorkspace.id, {
        worktreeSetupScript: nextScript,
      });
      setEnvironmentSavedScript(nextScript);
      setEnvironmentDraftScript(nextScript ?? "");
    } catch (error) {
      setEnvironmentError(error instanceof Error ? error.message : String(error));
    } finally {
      setEnvironmentSaving(false);
    }
  };

  const trimmedGroupName = newGroupName.trim();
  const canCreateGroup = Boolean(trimmedGroupName);

  const handleCreateGroup = async () => {
    setGroupError(null);
    try {
      const created = await onCreateWorkspaceGroup(newGroupName);
      if (created) {
        setNewGroupName("");
      }
    } catch (error) {
      setGroupError(error instanceof Error ? error.message : String(error));
    }
  };

  const handleRenameGroup = async (group: WorkspaceGroup) => {
    const draft = groupDrafts[group.id] ?? "";
    const trimmed = draft.trim();
    if (!trimmed || trimmed === group.name) {
      setGroupDrafts((prev) => ({
        ...prev,
        [group.id]: group.name,
      }));
      return;
    }
    setGroupError(null);
    try {
      await onRenameWorkspaceGroup(group.id, trimmed);
    } catch (error) {
      setGroupError(error instanceof Error ? error.message : String(error));
      setGroupDrafts((prev) => ({
        ...prev,
        [group.id]: group.name,
      }));
    }
  };

  const updateGroupCopiesFolder = async (
    groupId: string,
    copiesFolder: string | null,
  ) => {
    setGroupError(null);
    try {
      await onUpdateAppSettings({
        ...appSettings,
        workspaceGroups: appSettings.workspaceGroups.map((entry) =>
          entry.id === groupId ? { ...entry, copiesFolder } : entry,
        ),
      });
    } catch (error) {
      setGroupError(error instanceof Error ? error.message : String(error));
    }
  };

  const handleChooseGroupCopiesFolder = async (group: WorkspaceGroup) => {
    const selection = await open({ multiple: false, directory: true });
    if (!selection || Array.isArray(selection)) {
      return;
    }
    await updateGroupCopiesFolder(group.id, selection);
  };

  const handleClearGroupCopiesFolder = async (group: WorkspaceGroup) => {
    if (!group.copiesFolder) {
      return;
    }
    await updateGroupCopiesFolder(group.id, null);
  };

  const handleDeleteGroup = async (group: WorkspaceGroup) => {
    const groupProjects =
      groupedWorkspaces.find((entry) => entry.id === group.id)?.workspaces ?? [];
    const detail =
      groupProjects.length > 0
        ? `\n\nProjects in this group will move to "${ungroupedLabel}".`
        : "";
    const confirmed = await ask(
      `Delete "${group.name}"?${detail}`,
      {
        title: "Delete Group",
        kind: "warning",
        okLabel: "Delete",
        cancelLabel: "Cancel",
      },
    );
    if (!confirmed) {
      return;
    }
    setGroupError(null);
    try {
      await onDeleteWorkspaceGroup(group.id);
    } catch (error) {
      setGroupError(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <ModalShell
      className="settings-overlay"
      cardClassName="settings-window"
      onBackdropClick={onClose}
      ariaLabelledBy="settings-modal-title"
    >
      <div className="settings-titlebar">
        <div className="settings-title" id="settings-modal-title">
          {t("title")}
        </div>
        <button
          type="button"
          className="ghost icon-button settings-close"
          onClick={onClose}
          aria-label={t("closeSettings")}
        >
          <X aria-hidden />
        </button>
      </div>
      <div className="settings-body">
        <aside className="settings-sidebar">
            <button
              type="button"
              className={`settings-nav ${activeSection === "projects" ? "active" : ""}`}
              onClick={() => setActiveSection("projects")}
            >
              <LayoutGrid aria-hidden />
              {t("nav.projects")}
            </button>
            <button
              type="button"
              className={`settings-nav ${activeSection === "environments" ? "active" : ""}`}
              onClick={() => setActiveSection("environments")}
            >
              <Layers aria-hidden />
              {t("nav.environments")}
            </button>
            <button
              type="button"
              className={`settings-nav ${activeSection === "display" ? "active" : ""}`}
              onClick={() => setActiveSection("display")}
            >
              <SlidersHorizontal aria-hidden />
              {t("nav.display")}
            </button>
            <button
              type="button"
              className={`settings-nav ${activeSection === "composer" ? "active" : ""}`}
              onClick={() => setActiveSection("composer")}
            >
              <FileText aria-hidden />
              {t("nav.composer")}
            </button>
            <button
              type="button"
              className={`settings-nav ${activeSection === "dictation" ? "active" : ""}`}
              onClick={() => setActiveSection("dictation")}
            >
              <Mic aria-hidden />
              {t("nav.dictation")}
            </button>
            <button
              type="button"
              className={`settings-nav ${activeSection === "shortcuts" ? "active" : ""}`}
              onClick={() => setActiveSection("shortcuts")}
            >
              <Keyboard aria-hidden />
              {t("nav.shortcuts")}
            </button>
            <button
              type="button"
              className={`settings-nav ${activeSection === "open-apps" ? "active" : ""}`}
              onClick={() => setActiveSection("open-apps")}
            >
              <ExternalLink aria-hidden />
              {t("nav.openIn")}
            </button>
            <button
              type="button"
              className={`settings-nav ${activeSection === "git" ? "active" : ""}`}
              onClick={() => setActiveSection("git")}
            >
              <GitBranch aria-hidden />
              {t("nav.git")}
            </button>
            <button
              type="button"
              className={`settings-nav ${activeSection === "codex" ? "active" : ""}`}
              onClick={() => setActiveSection("codex")}
            >
              <TerminalSquare aria-hidden />
              {t("nav.codex")}
            </button>
            <button
              type="button"
              className={`settings-nav ${activeSection === "features" ? "active" : ""}`}
              onClick={() => setActiveSection("features")}
            >
              <FlaskConical aria-hidden />
              {t("nav.features")}
            </button>
          </aside>
          <div className="settings-content">
            {activeSection === "projects" && (
              <section className="settings-section">
                <div className="settings-section-title">{t("projects.title")}</div>
                <div className="settings-section-subtitle">
                  {t("projects.subtitle")}
                </div>
                <div className="settings-subsection-title">{t("projects.groupsTitle")}</div>
                <div className="settings-subsection-subtitle">
                  {t("projects.groupsSubtitle")}
                </div>
                <div className="settings-groups">
                  <div className="settings-group-create">
                    <input
                      className="settings-input settings-input--compact"
                      value={newGroupName}
                      placeholder={t("projects.newGroupPlaceholder")}
                      onChange={(event) => setNewGroupName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && canCreateGroup) {
                          event.preventDefault();
                          void handleCreateGroup();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="ghost settings-button-compact"
                      onClick={() => {
                        void handleCreateGroup();
                      }}
                      disabled={!canCreateGroup}
                    >
                      {t("projects.addGroup")}
                    </button>
                  </div>
                  {groupError && <div className="settings-group-error">{groupError}</div>}
                  {workspaceGroups.length > 0 ? (
                    <div className="settings-group-list">
                      {workspaceGroups.map((group, index) => (
                        <div key={group.id} className="settings-group-row">
                          <div className="settings-group-fields">
                            <input
                              className="settings-input settings-input--compact"
                              value={groupDrafts[group.id] ?? group.name}
                              onChange={(event) =>
                                setGroupDrafts((prev) => ({
                                  ...prev,
                                  [group.id]: event.target.value,
                                }))
                              }
                              onBlur={() => {
                                void handleRenameGroup(group);
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  void handleRenameGroup(group);
                                }
                              }}
                            />
                            <div className="settings-group-copies">
                              <div className="settings-group-copies-label">
                                {t("projects.copiesFolder")}
                              </div>
                              <div className="settings-group-copies-row">
                                <div
                                  className={`settings-group-copies-path${
                                    group.copiesFolder ? "" : " empty"
                                  }`}
                                  title={group.copiesFolder ?? ""}
                                >
                                  {group.copiesFolder ?? t("projects.notSet")}
                                </div>
                                <button
                                  type="button"
                                  className="ghost settings-button-compact"
                                  onClick={() => {
                                    void handleChooseGroupCopiesFolder(group);
                                  }}
                                >
                                  {t("projects.choose")}
                                </button>
                                <button
                                  type="button"
                                  className="ghost settings-button-compact"
                                  onClick={() => {
                                    void handleClearGroupCopiesFolder(group);
                                  }}
                                  disabled={!group.copiesFolder}
                                >
                                  {t("projects.clear")}
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="settings-group-actions">
                            <button
                              type="button"
                              className="ghost icon-button"
                              onClick={() => {
                                void onMoveWorkspaceGroup(group.id, "up");
                              }}
                              disabled={index === 0}
                              aria-label={t("projects.moveGroupUp")}
                            >
                              <ChevronUp aria-hidden />
                            </button>
                            <button
                              type="button"
                              className="ghost icon-button"
                              onClick={() => {
                                void onMoveWorkspaceGroup(group.id, "down");
                              }}
                              disabled={index === workspaceGroups.length - 1}
                              aria-label={t("projects.moveGroupDown")}
                            >
                              <ChevronDown aria-hidden />
                            </button>
                            <button
                              type="button"
                              className="ghost icon-button"
                              onClick={() => {
                                void handleDeleteGroup(group);
                              }}
                              aria-label={t("projects.deleteGroup")}
                            >
                              <Trash2 aria-hidden />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="settings-empty">{t("projects.noGroups")}</div>
                  )}
                </div>
                <div className="settings-subsection-title">{t("projects.projectsTitle")}</div>
                <div className="settings-subsection-subtitle">
                  {t("projects.projectsSubtitle")}
                </div>
                <div className="settings-projects">
                  {groupedWorkspaces.map((group) => (
                    <div key={group.id ?? "ungrouped"} className="settings-project-group">
                      <div className="settings-project-group-label">{group.name}</div>
                      {group.workspaces.map((workspace, index) => {
                        const groupValue =
                          workspaceGroups.some(
                            (entry) => entry.id === workspace.settings.groupId,
                          )
                            ? workspace.settings.groupId ?? ""
                            : "";
                        return (
                          <div key={workspace.id} className="settings-project-row">
                            <div className="settings-project-info">
                              <div className="settings-project-name">{workspace.name}</div>
                              <div className="settings-project-path">{workspace.path}</div>
                            </div>
                            <div className="settings-project-actions">
                              <select
                                className="settings-select settings-select--compact"
                                value={groupValue}
                                onChange={(event) => {
                                  const nextGroupId = event.target.value || null;
                                  void onAssignWorkspaceGroup(
                                    workspace.id,
                                    nextGroupId,
                                  );
                                }}
                              >
                                <option value="">{ungroupedLabel}</option>
                                {workspaceGroups.map((entry) => (
                                  <option key={entry.id} value={entry.id}>
                                    {entry.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                className="ghost icon-button"
                                onClick={() => onMoveWorkspace(workspace.id, "up")}
                                disabled={index === 0}
                                aria-label={t("projects.moveProjectUp")}
                              >
                                <ChevronUp aria-hidden />
                              </button>
                              <button
                                type="button"
                                className="ghost icon-button"
                                onClick={() => onMoveWorkspace(workspace.id, "down")}
                                disabled={index === group.workspaces.length - 1}
                                aria-label={t("projects.moveProjectDown")}
                              >
                                <ChevronDown aria-hidden />
                              </button>
                              <button
                                type="button"
                                className="ghost icon-button"
                                onClick={() => onDeleteWorkspace(workspace.id)}
                                aria-label={t("projects.deleteProject")}
                              >
                                <Trash2 aria-hidden />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  {projects.length === 0 && (
                    <div className="settings-empty">{t("projects.noProjects")}</div>
                  )}
                </div>
              </section>
            )}
            {activeSection === "environments" && (
              <section className="settings-section">
                <div className="settings-section-title">{t("environments.title")}</div>
                <div className="settings-section-subtitle">
                  {t("environments.subtitle")}
                </div>
                {mainWorkspaces.length === 0 ? (
                  <div className="settings-empty">{t("projects.noProjects")}</div>
                ) : (
                  <>
                    <div className="settings-field">
                      <label
                        className="settings-field-label"
                        htmlFor="settings-environment-project"
                      >
                        {t("environments.project")}
                      </label>
                      <select
                        id="settings-environment-project"
                        className="settings-select"
                        value={environmentWorkspace?.id ?? ""}
                        onChange={(event) => setEnvironmentWorkspaceId(event.target.value)}
                        disabled={environmentSaving}
                      >
                        {mainWorkspaces.map((workspace) => (
                          <option key={workspace.id} value={workspace.id}>
                            {workspace.name}
                          </option>
                        ))}
                      </select>
                      {environmentWorkspace ? (
                        <div className="settings-help">{environmentWorkspace.path}</div>
                      ) : null}
                    </div>

                    <div className="settings-field">
                      <div className="settings-field-label">{t("environments.setupScript")}</div>
                      <div className="settings-help">
                        {t("environments.setupScriptHelp")}
                      </div>
                      {environmentError ? (
                        <div className="settings-agents-error">{environmentError}</div>
                      ) : null}
                      <textarea
                        className="settings-agents-textarea"
                        value={environmentDraftScript}
                        onChange={(event) => setEnvironmentDraftScript(event.target.value)}
                        placeholder={t("environments.setupScriptPlaceholder")}
                        spellCheck={false}
                        disabled={environmentSaving}
                      />
                      <div className="settings-field-actions">
                        <button
                          type="button"
                          className="ghost settings-button-compact"
                          onClick={() => {
                            const clipboard =
                              typeof navigator === "undefined" ? null : navigator.clipboard;
                            if (!clipboard?.writeText) {
                              pushErrorToast({
                                title: t("environments.copyFailedTitle"),
                                message:
                                  t("environments.copyFailedClipboardUnavailable"),
                              });
                              return;
                            }

                            void clipboard.writeText(environmentDraftScript).catch(() => {
                              pushErrorToast({
                                title: t("environments.copyFailedTitle"),
                                message:
                                  t("environments.copyFailedWrite"),
                              });
                            });
                          }}
                          disabled={environmentSaving || environmentDraftScript.length === 0}
                        >
                          {t("environments.copy")}
                        </button>
                        <button
                          type="button"
                          className="ghost settings-button-compact"
                          onClick={() => setEnvironmentDraftScript(environmentSavedScript ?? "")}
                          disabled={environmentSaving || !environmentDirty}
                        >
                          {t("environments.reset")}
                        </button>
                        <button
                          type="button"
                          className="primary settings-button-compact"
                          onClick={() => {
                            void handleSaveEnvironmentSetup();
                          }}
                          disabled={environmentSaving || !environmentDirty}
                        >
                          {environmentSaving ? t("environments.saving") : t("environments.save")}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </section>
            )}
            {activeSection === "display" && (
              <section className="settings-section">
                <div className="settings-section-title">{t("display.title")}</div>
                <div className="settings-section-subtitle">
                  {t("display.subtitle")}
                </div>
                <div className="settings-subsection-title">{t("display.sectionDisplay")}</div>
                <div className="settings-subsection-subtitle">
                  {t("display.sectionDisplaySubtitle")}
                </div>
                <div className="settings-field">
                  <label className="settings-field-label" htmlFor="theme-select">
                    {t("display.theme")}
                  </label>
                  <select
                    id="theme-select"
                    className="settings-select"
                    value={appSettings.theme}
                    onChange={(event) =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        theme: event.target.value as AppSettings["theme"],
                      })
                    }
                  >
                    <option value="system">{t("display.themeSystem")}</option>
                    <option value="light">{t("display.themeLight")}</option>
                    <option value="dark">{t("display.themeDark")}</option>
                    <option value="dim">{t("display.themeDim")}</option>
                  </select>
                </div>
                <div className="settings-field">
                  <label className="settings-field-label" htmlFor="ui-language-select">
                    {t("display.language")}
                  </label>
                  <select
                    id="ui-language-select"
                    className="settings-select"
                    value={appSettings.uiLanguage}
                    onChange={(event) =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        uiLanguage: event.target.value as AppSettings["uiLanguage"],
                      })
                    }
                  >
                    <option value="system">{t("display.langSystem")}</option>
                    <option value="zh-CN">{t("display.langZhCN")}</option>
                    <option value="en">{t("display.langEn")}</option>
                  </select>
                  <div className="settings-help">{t("display.languageHelp")}</div>
                </div>
                <div className="settings-toggle-row">
                  <div>
                    <div className="settings-toggle-title">
                      {t("display.showRemainingTitle")}
                    </div>
                    <div className="settings-toggle-subtitle">
                      {t("display.showRemainingSubtitle")}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle ${
                      appSettings.usageShowRemaining ? "on" : ""
                    }`}
                    onClick={() =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        usageShowRemaining: !appSettings.usageShowRemaining,
                      })
                    }
                    aria-pressed={appSettings.usageShowRemaining}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>
                <div className="settings-toggle-row">
                  <div>
                    <div className="settings-toggle-title">{t("display.reduceTransparencyTitle")}</div>
                    <div className="settings-toggle-subtitle">
                      {t("display.reduceTransparencySubtitle")}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle ${reduceTransparency ? "on" : ""}`}
                    onClick={() => onToggleTransparency(!reduceTransparency)}
                    aria-pressed={reduceTransparency}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>
                <div className="settings-toggle-row settings-scale-row">
                  <div>
                    <div className="settings-toggle-title">{t("display.interfaceScale")}</div>
                    <div
                      className="settings-toggle-subtitle"
                      title={scaleShortcutTitle}
                    >
                      {scaleShortcutText}
                    </div>
                  </div>
                  <div className="settings-scale-controls">
                    <input
                      id="ui-scale"
                      type="text"
                      inputMode="decimal"
                      className="settings-input settings-input--scale"
                      value={scaleDraft}
                      aria-label={t("display.interfaceScale")}
                      onChange={(event) => setScaleDraft(event.target.value)}
                      onBlur={() => {
                        void handleCommitScale();
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void handleCommitScale();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="ghost settings-scale-reset"
                      onClick={() => {
                        void handleResetScale();
                      }}
                    >
                      {t("display.reset")}
                    </button>
                  </div>
                </div>
                <div className="settings-field">
                  <label className="settings-field-label" htmlFor="ui-font-family">
                    {t("display.uiFontFamily")}
                  </label>
                  <div className="settings-field-row">
                    <input
                      id="ui-font-family"
                      type="text"
                      className="settings-input"
                      value={uiFontDraft}
                      onChange={(event) => setUiFontDraft(event.target.value)}
                      onBlur={() => {
                        void handleCommitUiFont();
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void handleCommitUiFont();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="ghost settings-button-compact"
                      onClick={() => {
                        setUiFontDraft(DEFAULT_UI_FONT_FAMILY);
                        void onUpdateAppSettings({
                          ...appSettings,
                          uiFontFamily: DEFAULT_UI_FONT_FAMILY,
                        });
                      }}
                    >
                      {t("display.reset")}
                    </button>
                  </div>
                  <div className="settings-help">
                    {t("display.uiFontFamilyHelp")}
                  </div>
                </div>
                <div className="settings-field">
                  <label className="settings-field-label" htmlFor="code-font-family">
                    {t("display.codeFontFamily")}
                  </label>
                  <div className="settings-field-row">
                    <input
                      id="code-font-family"
                      type="text"
                      className="settings-input"
                      value={codeFontDraft}
                      onChange={(event) => setCodeFontDraft(event.target.value)}
                      onBlur={() => {
                        void handleCommitCodeFont();
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void handleCommitCodeFont();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="ghost settings-button-compact"
                      onClick={() => {
                        setCodeFontDraft(DEFAULT_CODE_FONT_FAMILY);
                        void onUpdateAppSettings({
                          ...appSettings,
                          codeFontFamily: DEFAULT_CODE_FONT_FAMILY,
                        });
                      }}
                    >
                      {t("display.reset")}
                    </button>
                  </div>
                  <div className="settings-help">
                    {t("display.codeFontFamilyHelp")}
                  </div>
                </div>
                <div className="settings-field">
                  <label className="settings-field-label" htmlFor="code-font-size">
                    {t("display.codeFontSize")}
                  </label>
                  <div className="settings-field-row">
                    <input
                      id="code-font-size"
                      type="range"
                      min={CODE_FONT_SIZE_MIN}
                      max={CODE_FONT_SIZE_MAX}
                      step={1}
                      className="settings-input settings-input--range"
                      value={codeFontSizeDraft}
                      onChange={(event) => {
                        const nextValue = Number(event.target.value);
                        setCodeFontSizeDraft(nextValue);
                        void handleCommitCodeFontSize(nextValue);
                      }}
                    />
                    <div className="settings-scale-value">{codeFontSizeDraft}px</div>
                    <button
                      type="button"
                      className="ghost settings-button-compact"
                      onClick={() => {
                        setCodeFontSizeDraft(CODE_FONT_SIZE_DEFAULT);
                        void handleCommitCodeFontSize(CODE_FONT_SIZE_DEFAULT);
                      }}
                    >
                      {t("display.reset")}
                    </button>
                  </div>
                  <div className="settings-help">
                    {t("display.codeFontSizeHelp")}
                  </div>
                </div>
                <div className="settings-subsection-title">{t("display.sounds")}</div>
                <div className="settings-subsection-subtitle">
                  {t("display.soundsSubtitle")}
                </div>
                <div className="settings-toggle-row">
                  <div>
                    <div className="settings-toggle-title">{t("display.notificationSoundsTitle")}</div>
                    <div className="settings-toggle-subtitle">
                      {t("display.notificationSoundsSubtitle")}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle ${appSettings.notificationSoundsEnabled ? "on" : ""}`}
                    onClick={() =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        notificationSoundsEnabled: !appSettings.notificationSoundsEnabled,
                      })
                    }
                    aria-pressed={appSettings.notificationSoundsEnabled}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>
                <div className="settings-toggle-row">
                  <div>
                    <div className="settings-toggle-title">{t("display.systemNotificationsTitle")}</div>
                    <div className="settings-toggle-subtitle">
                      {t("display.systemNotificationsSubtitle")}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle ${appSettings.systemNotificationsEnabled ? "on" : ""}`}
                    onClick={() =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        systemNotificationsEnabled: !appSettings.systemNotificationsEnabled,
                      })
                    }
                    aria-pressed={appSettings.systemNotificationsEnabled}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>
                <div className="settings-sound-actions">
                  <button
                    type="button"
                    className="ghost settings-button-compact"
                    onClick={onTestNotificationSound}
                  >
                    {t("display.testSound")}
                  </button>
                  <button
                    type="button"
                    className="ghost settings-button-compact"
                    onClick={onTestSystemNotification}
                  >
                    {t("display.testNotification")}
                  </button>
                </div>
              </section>
            )}
            {activeSection === "composer" && (
              <section className="settings-section">
                <div className="settings-section-title">{t("composer.title")}</div>
                <div className="settings-section-subtitle">
                  {t("composer.subtitle")}
                </div>
                <div className="settings-subsection-title">{t("composer.presets.title")}</div>
                <div className="settings-subsection-subtitle">
                  {t("composer.presets.subtitle")}
                </div>
                <div className="settings-field">
                  <label className="settings-field-label" htmlFor="composer-preset">
                    {t("composer.preset")}
                  </label>
                  <select
                    id="composer-preset"
                    className="settings-select"
                    value={appSettings.composerEditorPreset}
                    onChange={(event) =>
                      handleComposerPresetChange(
                        event.target.value as ComposerPreset,
                      )
                    }
                  >
                    {Object.entries(COMPOSER_PRESET_LABELS).map(([preset, label]) => (
                      <option key={preset} value={preset}>
                        {t(label)}
                      </option>
                    ))}
                  </select>
                  <div className="settings-help">
                    {t("composer.presets.help")}
                  </div>
                </div>
                <div className="settings-divider" />
                <div className="settings-subsection-title">{t("composer.codeFencesTitle")}</div>
                <div className="settings-toggle-row">
                  <div>
                    <div className="settings-toggle-title">{t("composer.expandOnSpaceTitle")}</div>
                    <div className="settings-toggle-subtitle">
                      {t("composer.expandOnSpaceSubtitle")}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle ${appSettings.composerFenceExpandOnSpace ? "on" : ""}`}
                    onClick={() =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        composerFenceExpandOnSpace: !appSettings.composerFenceExpandOnSpace,
                      })
                    }
                    aria-pressed={appSettings.composerFenceExpandOnSpace}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>
                <div className="settings-toggle-row">
                  <div>
                    <div className="settings-toggle-title">{t("composer.expandOnEnterTitle")}</div>
                    <div className="settings-toggle-subtitle">
                      {t("composer.expandOnEnterSubtitle")}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle ${appSettings.composerFenceExpandOnEnter ? "on" : ""}`}
                    onClick={() =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        composerFenceExpandOnEnter: !appSettings.composerFenceExpandOnEnter,
                      })
                    }
                    aria-pressed={appSettings.composerFenceExpandOnEnter}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>
                <div className="settings-toggle-row">
                  <div>
                    <div className="settings-toggle-title">{t("composer.languageTagsTitle")}</div>
                    <div className="settings-toggle-subtitle">
                      {t("composer.languageTagsSubtitle")}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle ${appSettings.composerFenceLanguageTags ? "on" : ""}`}
                    onClick={() =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        composerFenceLanguageTags: !appSettings.composerFenceLanguageTags,
                      })
                    }
                    aria-pressed={appSettings.composerFenceLanguageTags}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>
                <div className="settings-toggle-row">
                  <div>
                    <div className="settings-toggle-title">{t("composer.wrapSelectionTitle")}</div>
                    <div className="settings-toggle-subtitle">
                      {t("composer.wrapSelectionSubtitle")}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle ${appSettings.composerFenceWrapSelection ? "on" : ""}`}
                    onClick={() =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        composerFenceWrapSelection: !appSettings.composerFenceWrapSelection,
                      })
                    }
                    aria-pressed={appSettings.composerFenceWrapSelection}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>
                <div className="settings-toggle-row">
                  <div>
                    <div className="settings-toggle-title">{t("composer.copyWithoutFencesTitle")}</div>
                    <div className="settings-toggle-subtitle">
                      {t("composer.copyWithoutFencesSubtitle", { optionKeyLabel })}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle ${appSettings.composerCodeBlockCopyUseModifier ? "on" : ""}`}
                    onClick={() =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        composerCodeBlockCopyUseModifier:
                          !appSettings.composerCodeBlockCopyUseModifier,
                      })
                    }
                    aria-pressed={appSettings.composerCodeBlockCopyUseModifier}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>
                <div className="settings-divider" />
                <div className="settings-subsection-title">{t("composer.pastingTitle")}</div>
                <div className="settings-toggle-row">
                  <div>
                    <div className="settings-toggle-title">{t("composer.autoWrapMultilineTitle")}</div>
                    <div className="settings-toggle-subtitle">
                      {t("composer.autoWrapMultilineSubtitle")}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle ${appSettings.composerFenceAutoWrapPasteMultiline ? "on" : ""}`}
                    onClick={() =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        composerFenceAutoWrapPasteMultiline:
                          !appSettings.composerFenceAutoWrapPasteMultiline,
                      })
                    }
                    aria-pressed={appSettings.composerFenceAutoWrapPasteMultiline}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>
                <div className="settings-toggle-row">
                  <div>
                    <div className="settings-toggle-title">{t("composer.autoWrapCodeLikeTitle")}</div>
                    <div className="settings-toggle-subtitle">
                      {t("composer.autoWrapCodeLikeSubtitle")}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle ${appSettings.composerFenceAutoWrapPasteCodeLike ? "on" : ""}`}
                    onClick={() =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        composerFenceAutoWrapPasteCodeLike:
                          !appSettings.composerFenceAutoWrapPasteCodeLike,
                      })
                    }
                    aria-pressed={appSettings.composerFenceAutoWrapPasteCodeLike}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>
                <div className="settings-divider" />
                <div className="settings-subsection-title">{t("composer.listsTitle")}</div>
                <div className="settings-toggle-row">
                  <div>
                    <div className="settings-toggle-title">{t("composer.continueListsTitle")}</div>
                    <div className="settings-toggle-subtitle">
                      {t("composer.continueListsSubtitle")}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle ${appSettings.composerListContinuation ? "on" : ""}`}
                    onClick={() =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        composerListContinuation: !appSettings.composerListContinuation,
                      })
                    }
                    aria-pressed={appSettings.composerListContinuation}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>
              </section>
            )}
            {activeSection === "dictation" && (
              <section className="settings-section">
                <div className="settings-section-title">{t("dictation.title")}</div>
                <div className="settings-section-subtitle">
                  {t("dictation.subtitle")}
                </div>
                <div className="settings-toggle-row">
                  <div>
                    <div className="settings-toggle-title">{t("dictation.enableTitle")}</div>
                    <div className="settings-toggle-subtitle">
                      {t("dictation.enableSubtitle")}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle ${appSettings.dictationEnabled ? "on" : ""}`}
                    onClick={() => {
                      const nextEnabled = !appSettings.dictationEnabled;
                      void onUpdateAppSettings({
                        ...appSettings,
                        dictationEnabled: nextEnabled,
                      });
                      if (
                        !nextEnabled &&
                        dictationModelStatus?.state === "downloading" &&
                        onCancelDictationDownload
                      ) {
                        onCancelDictationDownload();
                      }
                      if (
                        nextEnabled &&
                        dictationModelStatus?.state === "missing" &&
                        onDownloadDictationModel
                      ) {
                        onDownloadDictationModel();
                      }
                    }}
                    aria-pressed={appSettings.dictationEnabled}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>
                <div className="settings-field">
                  <label className="settings-field-label" htmlFor="dictation-model">
                    {t("dictation.model")}
                  </label>
                  <select
                    id="dictation-model"
                    className="settings-select"
                    value={appSettings.dictationModelId}
                    onChange={(event) =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        dictationModelId: event.target.value,
                      })
                    }
                  >
                    {DICTATION_MODELS.map((model) => (
                      <option key={model.id} value={model.id}>
                        {t(model.labelKey)} ({model.size})
                      </option>
                    ))}
                  </select>
                  <div className="settings-help">
                    {t(selectedDictationModel.noteKey)} {t("dictation.downloadSize")}
                    {selectedDictationModel.size}.
                  </div>
                </div>
                <div className="settings-field">
                  <label className="settings-field-label" htmlFor="dictation-language">
                    {t("dictation.preferredLanguage")}
                  </label>
                  <select
                    id="dictation-language"
                    className="settings-select"
                    value={appSettings.dictationPreferredLanguage ?? ""}
                    onChange={(event) =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        dictationPreferredLanguage: event.target.value || null,
                      })
                    }
                  >
                    <option value="">{t("dictation.autoDetectOnly")}</option>
                    {DICTATION_LANGUAGE_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {t(option.labelKey)}
                      </option>
                    ))}
                  </select>
                  <div className="settings-help">
                    {t("dictation.preferredLanguageHelp")}
                  </div>
                </div>
                <div className="settings-field">
                  <label className="settings-field-label" htmlFor="dictation-hold-key">
                    {t("dictation.holdKey")}
                  </label>
                  <select
                    id="dictation-hold-key"
                    className="settings-select"
                    value={appSettings.dictationHoldKey ?? ""}
                    onChange={(event) =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        dictationHoldKey: event.target.value,
                      })
                    }
                  >
                    <option value="">{t("dictation.keyOff")}</option>
                    <option value="alt">{optionKeyLabel}</option>
                    <option value="shift">{t("dictation.keyShift")}</option>
                    <option value="control">{t("dictation.keyControl")}</option>
                    <option value="meta">{metaKeyLabel}</option>
                  </select>
                  <div className="settings-help">
                    {t("dictation.holdKeyHelp")}
                  </div>
                </div>
                {dictationModelStatus && (
                  <div className="settings-field">
                    <div className="settings-field-label">
                      {t("dictation.modelStatus", { label: t(selectedDictationModel.labelKey) })}
                    </div>
                    <div className="settings-help">
                      {dictationModelStatus.state === "ready" && t("dictation.statusReady")}
                      {dictationModelStatus.state === "missing" &&
                        t("dictation.statusMissing")}
                      {dictationModelStatus.state === "downloading" &&
                        t("dictation.statusDownloading")}
                      {dictationModelStatus.state === "error" &&
                        (dictationModelStatus.error ?? t("dictation.statusError"))}
                    </div>
                    {dictationProgress && (
                      <div className="settings-download-progress">
                        <div className="settings-download-bar">
                          <div
                            className="settings-download-fill"
                            style={{
                              width: dictationProgress.totalBytes
                                ? `${Math.min(
                                    100,
                                    (dictationProgress.downloadedBytes /
                                      dictationProgress.totalBytes) *
                                      100,
                                  )}%`
                                : "0%",
                            }}
                          />
                        </div>
                        <div className="settings-download-meta">
                          {formatDownloadSize(dictationProgress.downloadedBytes)}
                        </div>
                      </div>
                    )}
                    <div className="settings-field-actions">
                      {dictationModelStatus.state === "missing" && (
                        <button
                          type="button"
                          className="primary"
                          onClick={onDownloadDictationModel}
                          disabled={!onDownloadDictationModel}
                        >
                          {t("dictation.downloadModel")}
                        </button>
                      )}
                      {dictationModelStatus.state === "downloading" && (
                        <button
                          type="button"
                          className="ghost settings-button-compact"
                          onClick={onCancelDictationDownload}
                          disabled={!onCancelDictationDownload}
                        >
                          {t("dictation.cancelDownload")}
                        </button>
                      )}
                      {dictationReady && (
                        <button
                          type="button"
                          className="ghost settings-button-compact"
                          onClick={onRemoveDictationModel}
                          disabled={!onRemoveDictationModel}
                        >
                          {t("dictation.removeModel")}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}
            {activeSection === "shortcuts" && (
              <section className="settings-section">
                <div className="settings-section-title">{t("shortcuts.title")}</div>
                <div className="settings-section-subtitle">
                  {t("shortcuts.subtitle")}
                </div>
                <div className="settings-subsection-title">{t("shortcuts.fileTitle")}</div>
                <div className="settings-subsection-subtitle">
                  {t("shortcuts.fileSubtitle")}
                </div>
                <div className="settings-field">
                  <div className="settings-field-label">{t("shortcuts.newAgent")}</div>
                  <div className="settings-field-row">
                    <input
                      className="settings-input settings-input--shortcut"
                      value={formatShortcut(shortcutDrafts.newAgent)}
                      onKeyDown={(event) =>
                        handleShortcutKeyDown(event, "newAgentShortcut")
                      }
                      placeholder={t("shortcuts.typeShortcut")}
                      readOnly
                    />
                    <button
                      type="button"
                      className="ghost settings-button-compact"
                      onClick={() => void updateShortcut("newAgentShortcut", null)}
                    >
                      {t("shortcuts.clear")}
                    </button>
                  </div>
                  <div className="settings-help">
                    {t("shortcuts.default")}: {formatShortcut("cmd+n")}
                  </div>
                </div>
                <div className="settings-field">
                  <div className="settings-field-label">{t("shortcuts.newWorktreeAgent")}</div>
                  <div className="settings-field-row">
                    <input
                      className="settings-input settings-input--shortcut"
                      value={formatShortcut(shortcutDrafts.newWorktreeAgent)}
                      onKeyDown={(event) =>
                        handleShortcutKeyDown(event, "newWorktreeAgentShortcut")
                      }
                      placeholder={t("shortcuts.typeShortcut")}
                      readOnly
                    />
                    <button
                      type="button"
                      className="ghost settings-button-compact"
                      onClick={() => void updateShortcut("newWorktreeAgentShortcut", null)}
                    >
                      {t("shortcuts.clear")}
                    </button>
                  </div>
                  <div className="settings-help">
                    {t("shortcuts.default")}: {formatShortcut("cmd+shift+n")}
                  </div>
                </div>
                <div className="settings-field">
                  <div className="settings-field-label">{t("shortcuts.newCloneAgent")}</div>
                  <div className="settings-field-row">
                    <input
                      className="settings-input settings-input--shortcut"
                      value={formatShortcut(shortcutDrafts.newCloneAgent)}
                      onKeyDown={(event) =>
                        handleShortcutKeyDown(event, "newCloneAgentShortcut")
                      }
                      placeholder={t("shortcuts.typeShortcut")}
                      readOnly
                    />
                    <button
                      type="button"
                      className="ghost settings-button-compact"
                      onClick={() => void updateShortcut("newCloneAgentShortcut", null)}
                    >
                      {t("shortcuts.clear")}
                    </button>
                  </div>
                  <div className="settings-help">
                    {t("shortcuts.default")}: {formatShortcut("cmd+alt+n")}
                  </div>
                </div>
                <div className="settings-field">
                  <div className="settings-field-label">{t("shortcuts.archiveActiveThread")}</div>
                  <div className="settings-field-row">
                    <input
                      className="settings-input settings-input--shortcut"
                      value={formatShortcut(shortcutDrafts.archiveThread)}
                      onKeyDown={(event) =>
                        handleShortcutKeyDown(event, "archiveThreadShortcut")
                      }
                      placeholder={t("shortcuts.typeShortcut")}
                      readOnly
                    />
                    <button
                      type="button"
                      className="ghost settings-button-compact"
                      onClick={() => void updateShortcut("archiveThreadShortcut", null)}
                    >
                      {t("shortcuts.clear")}
                    </button>
                  </div>
                  <div className="settings-help">
                    {t("shortcuts.default")}:{" "}
                    {formatShortcut(isMacPlatform() ? "cmd+ctrl+a" : "ctrl+alt+a")}
                  </div>
                </div>
                <div className="settings-divider" />
                <div className="settings-subsection-title">{t("shortcuts.composerTitle")}</div>
                <div className="settings-subsection-subtitle">
                  {t("shortcuts.composerSubtitle")}
                </div>
                <div className="settings-field">
                  <div className="settings-field-label">{t("shortcuts.cycleModel")}</div>
                  <div className="settings-field-row">
                    <input
                      className="settings-input settings-input--shortcut"
                      value={formatShortcut(shortcutDrafts.model)}
                      onKeyDown={(event) =>
                        handleShortcutKeyDown(event, "composerModelShortcut")
                      }
                      placeholder={t("shortcuts.typeShortcut")}
                      readOnly
                    />
                    <button
                      type="button"
                      className="ghost settings-button-compact"
                      onClick={() => void updateShortcut("composerModelShortcut", null)}
                    >
                      {t("shortcuts.clear")}
                    </button>
                  </div>
                  <div className="settings-help">
                    {t("shortcuts.pressNewShortcut")} {t("shortcuts.default")}: {formatShortcut("cmd+shift+m")}
                  </div>
                </div>
                <div className="settings-field">
                  <div className="settings-field-label">{t("shortcuts.cycleAccessMode")}</div>
                  <div className="settings-field-row">
                    <input
                      className="settings-input settings-input--shortcut"
                      value={formatShortcut(shortcutDrafts.access)}
                      onKeyDown={(event) =>
                        handleShortcutKeyDown(event, "composerAccessShortcut")
                      }
                      placeholder={t("shortcuts.typeShortcut")}
                      readOnly
                    />
                    <button
                      type="button"
                      className="ghost settings-button-compact"
                      onClick={() => void updateShortcut("composerAccessShortcut", null)}
                    >
                      {t("shortcuts.clear")}
                    </button>
                  </div>
                  <div className="settings-help">
                    {t("shortcuts.default")}: {formatShortcut("cmd+shift+a")}
                  </div>
                </div>
                <div className="settings-field">
                  <div className="settings-field-label">{t("shortcuts.cycleReasoningMode")}</div>
                  <div className="settings-field-row">
                    <input
                      className="settings-input settings-input--shortcut"
                      value={formatShortcut(shortcutDrafts.reasoning)}
                      onKeyDown={(event) =>
                        handleShortcutKeyDown(event, "composerReasoningShortcut")
                      }
                      placeholder={t("shortcuts.typeShortcut")}
                      readOnly
                    />
                    <button
                      type="button"
                      className="ghost settings-button-compact"
                      onClick={() => void updateShortcut("composerReasoningShortcut", null)}
                    >
                      {t("shortcuts.clear")}
                    </button>
                  </div>
                  <div className="settings-help">
                    {t("shortcuts.default")}: {formatShortcut("cmd+shift+r")}
                  </div>
                </div>
                <div className="settings-field">
                  <div className="settings-field-label">{t("shortcuts.cycleCollaborationMode")}</div>
                  <div className="settings-field-row">
                    <input
                      className="settings-input settings-input--shortcut"
                      value={formatShortcut(shortcutDrafts.collaboration)}
                      onKeyDown={(event) =>
                        handleShortcutKeyDown(event, "composerCollaborationShortcut")
                      }
                      placeholder={t("shortcuts.typeShortcut")}
                      readOnly
                    />
                    <button
                      type="button"
                      className="ghost settings-button-compact"
                      onClick={() => void updateShortcut("composerCollaborationShortcut", null)}
                    >
                      {t("shortcuts.clear")}
                    </button>
                  </div>
                  <div className="settings-help">
                    {t("shortcuts.default")}: {formatShortcut("shift+tab")}
                  </div>
                </div>
                <div className="settings-field">
                  <div className="settings-field-label">{t("shortcuts.stopActiveRun")}</div>
                  <div className="settings-field-row">
                    <input
                      className="settings-input settings-input--shortcut"
                      value={formatShortcut(shortcutDrafts.interrupt)}
                      onKeyDown={(event) =>
                        handleShortcutKeyDown(event, "interruptShortcut")
                      }
                      placeholder={t("shortcuts.typeShortcut")}
                      readOnly
                    />
                    <button
                      type="button"
                      className="ghost settings-button-compact"
                      onClick={() => void updateShortcut("interruptShortcut", null)}
                    >
                      {t("shortcuts.clear")}
                    </button>
                  </div>
                  <div className="settings-help">
                    {t("shortcuts.default")}: {formatShortcut(getDefaultInterruptShortcut())}
                  </div>
                </div>
                <div className="settings-divider" />
                <div className="settings-subsection-title">{t("shortcuts.panelsTitle")}</div>
                <div className="settings-subsection-subtitle">
                  {t("shortcuts.panelsSubtitle")}
                </div>
                <div className="settings-field">
                  <div className="settings-field-label">{t("shortcuts.toggleProjectsSidebar")}</div>
                  <div className="settings-field-row">
                    <input
                      className="settings-input settings-input--shortcut"
                      value={formatShortcut(shortcutDrafts.projectsSidebar)}
                      onKeyDown={(event) =>
                        handleShortcutKeyDown(event, "toggleProjectsSidebarShortcut")
                      }
                      placeholder={t("shortcuts.typeShortcut")}
                      readOnly
                    />
                    <button
                      type="button"
                      className="ghost settings-button-compact"
                      onClick={() => void updateShortcut("toggleProjectsSidebarShortcut", null)}
                    >
                      {t("shortcuts.clear")}
                    </button>
                  </div>
                  <div className="settings-help">
                    {t("shortcuts.default")}: {formatShortcut("cmd+shift+p")}
                  </div>
                </div>
                <div className="settings-field">
                  <div className="settings-field-label">{t("shortcuts.toggleGitSidebar")}</div>
                  <div className="settings-field-row">
                    <input
                      className="settings-input settings-input--shortcut"
                      value={formatShortcut(shortcutDrafts.gitSidebar)}
                      onKeyDown={(event) =>
                        handleShortcutKeyDown(event, "toggleGitSidebarShortcut")
                      }
                      placeholder={t("shortcuts.typeShortcut")}
                      readOnly
                    />
                    <button
                      type="button"
                      className="ghost settings-button-compact"
                      onClick={() => void updateShortcut("toggleGitSidebarShortcut", null)}
                    >
                      {t("shortcuts.clear")}
                    </button>
                  </div>
                  <div className="settings-help">
                    {t("shortcuts.default")}: {formatShortcut("cmd+shift+g")}
                  </div>
                </div>
                <div className="settings-field">
                  <div className="settings-field-label">{t("shortcuts.branchSwitcher")}</div>
                  <div className="settings-field-row">
                    <input
                      className="settings-input settings-input--shortcut"
                      value={formatShortcut(shortcutDrafts.branchSwitcher)}
                      onKeyDown={(event) =>
                        handleShortcutKeyDown(event, "branchSwitcherShortcut")
                      }
                      placeholder={t("shortcuts.typeShortcut")}
                      readOnly
                    />
                    <button
                      type="button"
                      className="ghost settings-button-compact"
                      onClick={() => void updateShortcut("branchSwitcherShortcut", null)}
                    >
                      {t("shortcuts.clear")}
                    </button>
                  </div>
                  <div className="settings-help">
                    {t("shortcuts.default")}: {formatShortcut("cmd+b")}
                  </div>
                </div>
                <div className="settings-field">
                  <div className="settings-field-label">{t("shortcuts.toggleDebugPanel")}</div>
                  <div className="settings-field-row">
                    <input
                      className="settings-input settings-input--shortcut"
                      value={formatShortcut(shortcutDrafts.debugPanel)}
                      onKeyDown={(event) =>
                        handleShortcutKeyDown(event, "toggleDebugPanelShortcut")
                      }
                      placeholder={t("shortcuts.typeShortcut")}
                      readOnly
                    />
                    <button
                      type="button"
                      className="ghost settings-button-compact"
                      onClick={() => void updateShortcut("toggleDebugPanelShortcut", null)}
                    >
                      {t("shortcuts.clear")}
                    </button>
                  </div>
                  <div className="settings-help">
                    {t("shortcuts.default")}: {formatShortcut("cmd+shift+d")}
                  </div>
                </div>
                <div className="settings-field">
                  <div className="settings-field-label">{t("shortcuts.toggleTerminalPanel")}</div>
                  <div className="settings-field-row">
                    <input
                      className="settings-input settings-input--shortcut"
                      value={formatShortcut(shortcutDrafts.terminal)}
                      onKeyDown={(event) =>
                        handleShortcutKeyDown(event, "toggleTerminalShortcut")
                      }
                      placeholder={t("shortcuts.typeShortcut")}
                      readOnly
                    />
                    <button
                      type="button"
                      className="ghost settings-button-compact"
                      onClick={() => void updateShortcut("toggleTerminalShortcut", null)}
                    >
                      {t("shortcuts.clear")}
                    </button>
                  </div>
                  <div className="settings-help">
                    {t("shortcuts.default")}: {formatShortcut("cmd+shift+t")}
                  </div>
                </div>
                <div className="settings-divider" />
                <div className="settings-subsection-title">{t("shortcuts.navigationTitle")}</div>
                <div className="settings-subsection-subtitle">
                  {t("shortcuts.navigationSubtitle")}
                </div>
                <div className="settings-field">
                  <div className="settings-field-label">{t("shortcuts.nextAgent")}</div>
                  <div className="settings-field-row">
                    <input
                      className="settings-input settings-input--shortcut"
                      value={formatShortcut(shortcutDrafts.cycleAgentNext)}
                      onKeyDown={(event) =>
                        handleShortcutKeyDown(event, "cycleAgentNextShortcut")
                      }
                      placeholder={t("shortcuts.typeShortcut")}
                      readOnly
                    />
                    <button
                      type="button"
                      className="ghost settings-button-compact"
                      onClick={() => void updateShortcut("cycleAgentNextShortcut", null)}
                    >
                      {t("shortcuts.clear")}
                    </button>
                  </div>
                  <div className="settings-help">
                    {t("shortcuts.default")}:{" "}
                    {formatShortcut(
                      isMacPlatform() ? "cmd+ctrl+down" : "ctrl+alt+down",
                    )}
                  </div>
                </div>
                <div className="settings-field">
                  <div className="settings-field-label">{t("shortcuts.previousAgent")}</div>
                  <div className="settings-field-row">
                    <input
                      className="settings-input settings-input--shortcut"
                      value={formatShortcut(shortcutDrafts.cycleAgentPrev)}
                      onKeyDown={(event) =>
                        handleShortcutKeyDown(event, "cycleAgentPrevShortcut")
                      }
                      placeholder={t("shortcuts.typeShortcut")}
                      readOnly
                    />
                    <button
                      type="button"
                      className="ghost settings-button-compact"
                      onClick={() => void updateShortcut("cycleAgentPrevShortcut", null)}
                    >
                      {t("shortcuts.clear")}
                    </button>
                  </div>
                  <div className="settings-help">
                    {t("shortcuts.default")}:{" "}
                    {formatShortcut(
                      isMacPlatform() ? "cmd+ctrl+up" : "ctrl+alt+up",
                    )}
                  </div>
                </div>
                <div className="settings-field">
                  <div className="settings-field-label">{t("shortcuts.nextWorkspace")}</div>
                  <div className="settings-field-row">
                    <input
                      className="settings-input settings-input--shortcut"
                      value={formatShortcut(shortcutDrafts.cycleWorkspaceNext)}
                      onKeyDown={(event) =>
                        handleShortcutKeyDown(event, "cycleWorkspaceNextShortcut")
                      }
                      placeholder={t("shortcuts.typeShortcut")}
                      readOnly
                    />
                    <button
                      type="button"
                      className="ghost settings-button-compact"
                      onClick={() => void updateShortcut("cycleWorkspaceNextShortcut", null)}
                    >
                      {t("shortcuts.clear")}
                    </button>
                  </div>
                  <div className="settings-help">
                    {t("shortcuts.default")}:{" "}
                    {formatShortcut(
                      isMacPlatform()
                        ? "cmd+shift+down"
                        : "ctrl+alt+shift+down",
                    )}
                  </div>
                </div>
                <div className="settings-field">
                  <div className="settings-field-label">{t("shortcuts.previousWorkspace")}</div>
                  <div className="settings-field-row">
                    <input
                      className="settings-input settings-input--shortcut"
                      value={formatShortcut(shortcutDrafts.cycleWorkspacePrev)}
                      onKeyDown={(event) =>
                        handleShortcutKeyDown(event, "cycleWorkspacePrevShortcut")
                      }
                      placeholder={t("shortcuts.typeShortcut")}
                      readOnly
                    />
                    <button
                      type="button"
                      className="ghost settings-button-compact"
                      onClick={() => void updateShortcut("cycleWorkspacePrevShortcut", null)}
                    >
                      {t("shortcuts.clear")}
                    </button>
                  </div>
                  <div className="settings-help">
                    {t("shortcuts.default")}:{" "}
                    {formatShortcut(
                      isMacPlatform() ? "cmd+shift+up" : "ctrl+alt+shift+up",
                    )}
                  </div>
                </div>
              </section>
            )}
            {activeSection === "open-apps" && (
              <section className="settings-section">
                <div className="settings-section-title">{t("openIn.title")}</div>
                <div className="settings-section-subtitle">
                  {t("openIn.subtitle")}
                </div>
                <div className="settings-open-apps">
                  {openAppDrafts.map((target, index) => {
                    const iconSrc =
                      getKnownOpenAppIcon(target.id) ??
                      openAppIconById[target.id] ??
                      GENERIC_APP_ICON;
                    const labelValid = isOpenAppLabelValid(target.label);
                    const appNameValid =
                      target.kind !== "app" || Boolean(target.appName?.trim());
                    const commandValid =
                      target.kind !== "command" || Boolean(target.command?.trim());
                    const isComplete = labelValid && appNameValid && commandValid;
                    const incompleteHint = !labelValid
                      ? t("openIn.incompleteLabelRequired")
                      : target.kind === "app"
                        ? t("openIn.incompleteAppNameRequired")
                        : target.kind === "command"
                          ? t("openIn.incompleteCommandRequired")
                          : t("openIn.incompleteFieldsRequired");
                    return (
                      <div
                        key={target.id}
                        className={`settings-open-app-row${
                          isComplete ? "" : " is-incomplete"
                        }`}
                      >
                        <div className="settings-open-app-icon-wrap" aria-hidden>
                          <img
                            className="settings-open-app-icon"
                            src={iconSrc}
                            alt=""
                            width={18}
                            height={18}
                          />
                        </div>
                        <div className="settings-open-app-fields">
                          <label className="settings-open-app-field settings-open-app-field--label">
                            <span className="settings-visually-hidden">{t("openIn.label")}</span>
                            <input
                              className="settings-input settings-input--compact settings-open-app-input settings-open-app-input--label"
                              value={target.label}
                              placeholder={t("openIn.label")}
                              onChange={(event) =>
                                handleOpenAppDraftChange(index, {
                                  label: event.target.value,
                                })
                              }
                              onBlur={() => {
                                void handleCommitOpenApps(openAppDrafts);
                              }}
                              aria-label={t("openIn.openAppLabel", { index: index + 1 })}
                              data-invalid={!labelValid || undefined}
                            />
                          </label>
                          <label className="settings-open-app-field settings-open-app-field--type">
                            <span className="settings-visually-hidden">{t("openIn.type")}</span>
                            <select
                              className="settings-select settings-select--compact settings-open-app-kind"
                              value={target.kind}
                              onChange={(event) =>
                                handleOpenAppKindChange(
                                  index,
                                  event.target.value as OpenAppTarget["kind"],
                                )
                              }
                              aria-label={t("openIn.openAppType", { index: index + 1 })}
                            >
                              <option value="app">{t("openIn.app")}</option>
                              <option value="command">{t("openIn.command")}</option>
                              <option value="finder">{fileManagerName()}</option>
                            </select>
                          </label>
                          {target.kind === "app" && (
                            <label className="settings-open-app-field settings-open-app-field--appname">
                              <span className="settings-visually-hidden">{t("openIn.appName")}</span>
                              <input
                                className="settings-input settings-input--compact settings-open-app-input settings-open-app-input--appname"
                                value={target.appName ?? ""}
                                placeholder={t("openIn.appName")}
                                onChange={(event) =>
                                  handleOpenAppDraftChange(index, {
                                    appName: event.target.value,
                                  })
                                }
                                onBlur={() => {
                                  void handleCommitOpenApps(openAppDrafts);
                                }}
                                aria-label={t("openIn.openAppName", { index: index + 1 })}
                                data-invalid={!appNameValid || undefined}
                              />
                            </label>
                          )}
                          {target.kind === "command" && (
                            <label className="settings-open-app-field settings-open-app-field--command">
                              <span className="settings-visually-hidden">{t("openIn.command")}</span>
                              <input
                                className="settings-input settings-input--compact settings-open-app-input settings-open-app-input--command"
                                value={target.command ?? ""}
                                placeholder={t("openIn.command")}
                                onChange={(event) =>
                                  handleOpenAppDraftChange(index, {
                                    command: event.target.value,
                                  })
                                }
                                onBlur={() => {
                                  void handleCommitOpenApps(openAppDrafts);
                                }}
                                aria-label={t("openIn.openAppCommand", { index: index + 1 })}
                                data-invalid={!commandValid || undefined}
                              />
                            </label>
                          )}
                          {target.kind !== "finder" && (
                            <label className="settings-open-app-field settings-open-app-field--args">
                              <span className="settings-visually-hidden">{t("openIn.args")}</span>
                              <input
                                className="settings-input settings-input--compact settings-open-app-input settings-open-app-input--args"
                                value={target.argsText}
                                placeholder={t("openIn.args")}
                                onChange={(event) =>
                                  handleOpenAppDraftChange(index, {
                                    argsText: event.target.value,
                                  })
                                }
                                onBlur={() => {
                                  void handleCommitOpenApps(openAppDrafts);
                                }}
                                aria-label={t("openIn.openAppArgs", { index: index + 1 })}
                              />
                            </label>
                          )}
                        </div>
                        <div className="settings-open-app-actions">
                          {!isComplete && (
                            <span
                              className="settings-open-app-status"
                              title={incompleteHint}
                              aria-label={incompleteHint}
                            >
                              {t("openIn.incomplete")}
                            </span>
                          )}
                          <label className="settings-open-app-default">
                            <input
                              type="radio"
                              name="open-app-default"
                              checked={target.id === openAppSelectedId}
                              onChange={() => handleSelectOpenAppDefault(target.id)}
                              disabled={!isComplete}
                            />
                            {t("openIn.default")}
                          </label>
                          <div className="settings-open-app-order">
                            <button
                              type="button"
                              className="ghost icon-button"
                              onClick={() => handleMoveOpenApp(index, "up")}
                              disabled={index === 0}
                              aria-label={t("openIn.moveUp")}
                            >
                              <ChevronUp aria-hidden />
                            </button>
                            <button
                              type="button"
                              className="ghost icon-button"
                              onClick={() => handleMoveOpenApp(index, "down")}
                              disabled={index === openAppDrafts.length - 1}
                              aria-label={t("openIn.moveDown")}
                            >
                              <ChevronDown aria-hidden />
                            </button>
                          </div>
                          <button
                            type="button"
                            className="ghost icon-button"
                            onClick={() => handleDeleteOpenApp(index)}
                            disabled={openAppDrafts.length <= 1}
                            aria-label={t("openIn.removeApp")}
                            title={t("openIn.removeApp")}
                          >
                            <Trash2 aria-hidden />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="settings-open-app-footer">
                  <button
                    type="button"
                    className="ghost"
                    onClick={handleAddOpenApp}
                  >
                    {t("openIn.addApp")}
                  </button>
                  <div className="settings-help">
                    {t("openIn.commandsReceivePath")} {" "}
                    {isMacPlatform()
                      ? t("openIn.macOpenBehavior")
                      : t("openIn.nonMacOpenBehavior")}
                  </div>
                </div>
              </section>
            )}
            {activeSection === "git" && (
              <section className="settings-section">
                <div className="settings-section-title">{t("git.title")}</div>
                <div className="settings-section-subtitle">
                  {t("git.subtitle")}
                </div>
                <div className="settings-toggle-row">
                  <div>
                    <div className="settings-toggle-title">{t("git.preloadDiffsTitle")}</div>
                    <div className="settings-toggle-subtitle">
                      {t("git.preloadDiffsSubtitle")}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle ${appSettings.preloadGitDiffs ? "on" : ""}`}
                    onClick={() =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        preloadGitDiffs: !appSettings.preloadGitDiffs,
                      })
                    }
                    aria-pressed={appSettings.preloadGitDiffs}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>
                <div className="settings-toggle-row">
                  <div>
                    <div className="settings-toggle-title">{t("git.ignoreWhitespaceTitle")}</div>
                    <div className="settings-toggle-subtitle">
                      {t("git.ignoreWhitespaceSubtitle")}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle ${appSettings.gitDiffIgnoreWhitespaceChanges ? "on" : ""}`}
                    onClick={() =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        gitDiffIgnoreWhitespaceChanges: !appSettings.gitDiffIgnoreWhitespaceChanges,
                      })
                    }
                    aria-pressed={appSettings.gitDiffIgnoreWhitespaceChanges}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>
              </section>
            )}
            {activeSection === "codex" && (
              <section className="settings-section">
                <div className="settings-section-title">{t("codex.title")}</div>
                <div className="settings-section-subtitle">
                  {t("codex.subtitle")}
                </div>
                <div className="settings-field">
                  <label className="settings-field-label" htmlFor="codex-path">
                    {t("codex.defaultPath")}
                  </label>
                  <div className="settings-field-row">
                    <input
                      id="codex-path"
                      className="settings-input"
                      value={codexPathDraft}
                      placeholder={t("codex.defaultPathPlaceholder")}
                      onChange={(event) => setCodexPathDraft(event.target.value)}
                    />
                    <button type="button" className="ghost" onClick={handleBrowseCodex}>
                      {t("codex.browse")}
                    </button>
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => setCodexPathDraft("")}
                    >
                      {t("codex.usePath")}
                    </button>
                  </div>
                  <div className="settings-help">
                    {t("codex.usePathHelp")}
                  </div>
                  <label className="settings-field-label" htmlFor="codex-args">
                    {t("codex.defaultArgs")}
                  </label>
                  <div className="settings-field-row">
                    <input
                      id="codex-args"
                      className="settings-input"
                      value={codexArgsDraft}
                      placeholder={t("codex.defaultArgsPlaceholder")}
                      onChange={(event) => setCodexArgsDraft(event.target.value)}
                    />
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => setCodexArgsDraft("")}
                    >
                      {t("codex.clear")}
                    </button>
                  </div>
                  <div className="settings-help">
                    {t("codex.defaultArgsHelpPrefix")} <code>app-server</code>. {t("codex.defaultArgsHelpSuffix")}
                  </div>
                <div className="settings-field-actions">
                  {codexDirty && (
                    <button
                      type="button"
                      className="primary"
                      onClick={handleSaveCodexSettings}
                      disabled={isSavingSettings}
                    >
                      {isSavingSettings ? t("codex.saving") : t("codex.save")}
                    </button>
                  )}
                  <button
                    type="button"
                    className="ghost settings-button-compact"
                    onClick={handleRunDoctor}
                    disabled={doctorState.status === "running"}
                  >
                    <Stethoscope aria-hidden />
                    {doctorState.status === "running" ? t("codex.running") : t("codex.runDoctor")}
                  </button>
                </div>

                {doctorState.result && (
                  <div
                    className={`settings-doctor ${doctorState.result.ok ? "ok" : "error"}`}
                  >
                    <div className="settings-doctor-title">
                      {doctorState.result.ok ? t("codex.doctorLooksGood") : t("codex.doctorIssueDetected")}
                    </div>
                    <div className="settings-doctor-body">
                      <div>
                        {t("codex.version")}: {doctorState.result.version ?? t("codex.unknown")}
                      </div>
                      <div>
                        {t("codex.appServer")}: {doctorState.result.appServerOk ? t("codex.ok") : t("codex.failed")}
                      </div>
                      <div>
                        {t("codex.node")}:{" "}
                        {doctorState.result.nodeOk
                          ? `${t("codex.ok")} (${doctorState.result.nodeVersion ?? t("codex.unknown")})`
                          : t("codex.missing")}
                      </div>
                      {doctorState.result.details && (
                        <div>{doctorState.result.details}</div>
                      )}
                      {doctorState.result.nodeDetails && (
                        <div>{doctorState.result.nodeDetails}</div>
                      )}
                      {doctorState.result.path && (
                        <div className="settings-doctor-path">
                          {t("codex.path")}: {doctorState.result.path}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

                <div className="settings-field">
                  <label className="settings-field-label" htmlFor="default-access">
                    {t("codex.defaultAccessMode")}
                  </label>
                  <select
                    id="default-access"
                    className="settings-select"
                    value={appSettings.defaultAccessMode}
                    onChange={(event) =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        defaultAccessMode: event.target.value as AppSettings["defaultAccessMode"],
                      })
                    }
                  >
                    <option value="read-only">{t("codex.accessReadOnly")}</option>
                    <option value="current">{t("codex.accessOnRequest")}</option>
                    <option value="full-access">{t("codex.accessFullAccess")}</option>
                  </select>
                </div>
                <div className="settings-field">
                  <label className="settings-field-label" htmlFor="review-delivery">
                    {t("codex.reviewMode")}
                  </label>
                  <select
                    id="review-delivery"
                    className="settings-select"
                    value={appSettings.reviewDeliveryMode}
                    onChange={(event) =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        reviewDeliveryMode:
                          event.target.value as AppSettings["reviewDeliveryMode"],
                      })
                    }
                  >
                    <option value="inline">{t("codex.reviewInline")}</option>
                    <option value="detached">{t("codex.reviewDetached")}</option>
                  </select>
                  <div className="settings-help">
                    {t("codex.reviewModeHelpPrefix")} <code>/review</code> {t("codex.reviewModeHelpSuffix")}
                  </div>
                </div>

                <div className="settings-field">
                  <label className="settings-field-label" htmlFor="backend-mode">
                    {t("codex.backendMode")}
                  </label>
                  <select
                    id="backend-mode"
                    className="settings-select"
                    value={appSettings.backendMode}
                    onChange={(event) =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        backendMode: event.target.value as AppSettings["backendMode"],
                      })
                    }
                  >
                    <option value="local">{t("codex.backendLocal")}</option>
                    <option value="remote">{t("codex.backendRemote")}</option>
                  </select>
                  <div className="settings-help">
                    {t("codex.backendModeHelp")}
                  </div>
                </div>

                {appSettings.backendMode === "remote" && (
                  <>
                    <div className="settings-field">
                      <label className="settings-field-label" htmlFor="remote-provider">
                        {t("codex.remoteProvider")}
                      </label>
                      <select
                        id="remote-provider"
                        className="settings-select"
                        value={appSettings.remoteBackendProvider}
                        onChange={(event) => {
                          void handleChangeRemoteProvider(
                            event.target.value as AppSettings["remoteBackendProvider"],
                          );
                        }}
                        aria-label={t("codex.remoteProvider")}
                      >
                        <option value="tcp">{t("codex.remoteProviderTcp")}</option>
                        <option value="orbit">{t("codex.remoteProviderOrbit")}</option>
                      </select>
                      <div className="settings-help">
                        {t("codex.remoteProviderHelp")}
                      </div>
                    </div>

                    {appSettings.remoteBackendProvider === "tcp" && (
                      <div className="settings-field">
                        <div className="settings-field-label">{t("codex.remoteBackend")}</div>
                        <div className="settings-field-row">
                          <input
                            className="settings-input settings-input--compact"
                            value={remoteHostDraft}
                            placeholder={t("codex.remoteBackendHostPlaceholder")}
                            onChange={(event) => setRemoteHostDraft(event.target.value)}
                            onBlur={() => {
                              void handleCommitRemoteHost();
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                void handleCommitRemoteHost();
                              }
                            }}
                            aria-label={t("codex.remoteBackendHost")}
                          />
                          <input
                            type="password"
                            className="settings-input settings-input--compact"
                            value={remoteTokenDraft}
                            placeholder={t("codex.remoteBackendTokenPlaceholder")}
                            onChange={(event) => setRemoteTokenDraft(event.target.value)}
                            onBlur={() => {
                              void handleCommitRemoteToken();
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                void handleCommitRemoteToken();
                              }
                            }}
                            aria-label={t("codex.remoteBackendToken")}
                          />
                        </div>
                        <div className="settings-help">
                          {t("codex.remoteBackendHelp")}
                        </div>
                      </div>
                    )}

                    {appSettings.remoteBackendProvider === "orbit" && (
                      <>
                        <div className="settings-field">
                          <label
                            className="settings-field-label"
                            htmlFor="orbit-deployment-mode"
                          >
                            {t("codex.orbitDeploymentMode")}
                          </label>
                          <select
                            id="orbit-deployment-mode"
                            className="settings-select"
                            value={appSettings.orbitDeploymentMode}
                            onChange={(event) => {
                              void handleChangeOrbitDeploymentMode(
                                event.target.value as AppSettings["orbitDeploymentMode"],
                              );
                            }}
                            aria-label={t("codex.orbitDeploymentMode")}
                          >
                            <option value="hosted">{t("codex.orbitHosted")}</option>
                            <option value="self_hosted">{t("codex.orbitSelfHosted")}</option>
                          </select>
                        </div>

                        <div className="settings-field">
                          <label className="settings-field-label" htmlFor="orbit-ws-url">
                            {t("codex.orbitWebsocketUrl")}
                          </label>
                          <input
                            id="orbit-ws-url"
                            className="settings-input settings-input--compact"
                            value={orbitWsUrlDraft}
                            placeholder={t("codex.orbitWebsocketUrlPlaceholder")}
                            onChange={(event) => setOrbitWsUrlDraft(event.target.value)}
                            onBlur={() => {
                              void handleCommitOrbitWsUrl();
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                void handleCommitOrbitWsUrl();
                              }
                            }}
                            aria-label={t("codex.orbitWebsocketUrl")}
                          />
                        </div>

                        <div className="settings-field">
                          <label className="settings-field-label" htmlFor="orbit-auth-url">
                            {t("codex.orbitAuthUrl")}
                          </label>
                          <input
                            id="orbit-auth-url"
                            className="settings-input settings-input--compact"
                            value={orbitAuthUrlDraft}
                            placeholder={t("codex.orbitAuthUrlPlaceholder")}
                            onChange={(event) => setOrbitAuthUrlDraft(event.target.value)}
                            onBlur={() => {
                              void handleCommitOrbitAuthUrl();
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                void handleCommitOrbitAuthUrl();
                              }
                            }}
                            aria-label={t("codex.orbitAuthUrl")}
                          />
                        </div>

                        <div className="settings-field">
                          <label className="settings-field-label" htmlFor="orbit-runner-name">
                            {t("codex.orbitRunnerName")}
                          </label>
                          <input
                            id="orbit-runner-name"
                            className="settings-input settings-input--compact"
                            value={orbitRunnerNameDraft}
                            placeholder={t("codex.orbitRunnerNamePlaceholder")}
                            onChange={(event) => setOrbitRunnerNameDraft(event.target.value)}
                            onBlur={() => {
                              void handleCommitOrbitRunnerName();
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                void handleCommitOrbitRunnerName();
                              }
                            }}
                            aria-label={t("codex.orbitRunnerName")}
                          />
                        </div>

                        <div className="settings-toggle-row">
                          <div>
                            <div className="settings-toggle-title">{t("codex.orbitAutoStartRunner")}</div>
                            <div className="settings-toggle-subtitle">
                              {t("codex.orbitAutoStartRunnerSubtitle")}
                            </div>
                          </div>
                          <button
                            type="button"
                            className={`settings-toggle ${
                              appSettings.orbitAutoStartRunner ? "on" : ""
                            }`}
                            onClick={() =>
                              void onUpdateAppSettings({
                                ...appSettings,
                                orbitAutoStartRunner: !appSettings.orbitAutoStartRunner,
                              })
                            }
                            aria-pressed={appSettings.orbitAutoStartRunner}
                          >
                            <span className="settings-toggle-knob" />
                          </button>
                        </div>

                        <div className="settings-toggle-row">
                          <div>
                            <div className="settings-toggle-title">{t("codex.orbitUseAccess")}</div>
                            <div className="settings-toggle-subtitle">
                              {t("codex.orbitUseAccessSubtitle")}
                            </div>
                          </div>
                          <button
                            type="button"
                            className={`settings-toggle ${appSettings.orbitUseAccess ? "on" : ""}`}
                            onClick={() =>
                              void onUpdateAppSettings({
                                ...appSettings,
                                orbitUseAccess: !appSettings.orbitUseAccess,
                              })
                            }
                            aria-pressed={appSettings.orbitUseAccess}
                          >
                            <span className="settings-toggle-knob" />
                          </button>
                        </div>

                        <div className="settings-field">
                          <label
                            className="settings-field-label"
                            htmlFor="orbit-access-client-id"
                          >
                            {t("codex.orbitAccessClientId")}
                          </label>
                          <input
                            id="orbit-access-client-id"
                            className="settings-input settings-input--compact"
                            value={orbitAccessClientIdDraft}
                            placeholder={t("codex.orbitAccessClientIdPlaceholder")}
                            disabled={!appSettings.orbitUseAccess}
                            onChange={(event) =>
                              setOrbitAccessClientIdDraft(event.target.value)
                            }
                            onBlur={() => {
                              void handleCommitOrbitAccessClientId();
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                void handleCommitOrbitAccessClientId();
                              }
                            }}
                            aria-label={t("codex.orbitAccessClientId")}
                          />
                        </div>

                        <div className="settings-field">
                          <label
                            className="settings-field-label"
                            htmlFor="orbit-access-client-secret-ref"
                          >
                            {t("codex.orbitAccessClientSecretRef")}
                          </label>
                          <input
                            id="orbit-access-client-secret-ref"
                            className="settings-input settings-input--compact"
                            value={orbitAccessClientSecretRefDraft}
                            placeholder={t("codex.orbitAccessClientSecretRefPlaceholder")}
                            disabled={!appSettings.orbitUseAccess}
                            onChange={(event) =>
                              setOrbitAccessClientSecretRefDraft(event.target.value)
                            }
                            onBlur={() => {
                              void handleCommitOrbitAccessClientSecretRef();
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                void handleCommitOrbitAccessClientSecretRef();
                              }
                            }}
                            aria-label={t("codex.orbitAccessClientSecretRef")}
                          />
                        </div>

                        <div className="settings-field">
                          <div className="settings-field-label">{t("codex.orbitActions")}</div>
                          <div className="settings-field-row">
                            <button
                              type="button"
                              className="button settings-button-compact"
                              onClick={handleOrbitConnectTest}
                              disabled={orbitBusyAction !== null}
                            >
                              {orbitBusyAction === "connect-test"
                                ? t("codex.testing")
                                : t("codex.connectTest")}
                            </button>
                            <button
                              type="button"
                              className="button settings-button-compact"
                              onClick={handleOrbitSignIn}
                              disabled={orbitBusyAction !== null}
                            >
                              {orbitBusyAction === "sign-in" ? t("codex.signingIn") : t("codex.signIn")}
                            </button>
                            <button
                              type="button"
                              className="button settings-button-compact"
                              onClick={handleOrbitSignOut}
                              disabled={orbitBusyAction !== null}
                            >
                              {orbitBusyAction === "sign-out" ? t("codex.signingOut") : t("codex.signOut")}
                            </button>
                          </div>
                          <div className="settings-field-row">
                            <button
                              type="button"
                              className="button settings-button-compact"
                              onClick={handleOrbitRunnerStart}
                              disabled={orbitBusyAction !== null}
                            >
                              {orbitBusyAction === "runner-start"
                                ? t("codex.starting")
                                : t("codex.startRunner")}
                            </button>
                            <button
                              type="button"
                              className="button settings-button-compact"
                              onClick={handleOrbitRunnerStop}
                              disabled={orbitBusyAction !== null}
                            >
                              {orbitBusyAction === "runner-stop" ? t("codex.stopping") : t("codex.stopRunner")}
                            </button>
                            <button
                              type="button"
                              className="button settings-button-compact"
                              onClick={handleOrbitRunnerStatus}
                              disabled={orbitBusyAction !== null}
                            >
                              {orbitBusyAction === "runner-status"
                                ? t("codex.refreshing")
                                : t("codex.refreshStatus")}
                            </button>
                          </div>
                          {orbitStatusText && (
                            <div className="settings-help">{orbitStatusText}</div>
                          )}
                          {orbitAuthCode && (
                            <div className="settings-help">
                              {t("codex.authCode")}: <code>{orbitAuthCode}</code>
                            </div>
                          )}
                          {orbitVerificationUrl && (
                            <div className="settings-help">
                              {t("codex.verificationUrl")}:{" "}
                              <a
                                href={orbitVerificationUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {orbitVerificationUrl}
                              </a>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}

                <FileEditorCard
                  title={t("codex.globalAgentsTitle")}
                  meta={globalAgentsMeta}
                  error={globalAgentsError}
                  value={globalAgentsContent}
                  placeholder={t("codex.globalAgentsPlaceholder")}
                  disabled={globalAgentsLoading}
                  refreshDisabled={globalAgentsRefreshDisabled}
                  saveDisabled={globalAgentsSaveDisabled}
                  saveLabel={globalAgentsSaveLabel}
                  onChange={setGlobalAgentsContent}
                  onRefresh={() => {
                    void refreshGlobalAgents();
                  }}
                  onSave={() => {
                    void saveGlobalAgents();
                  }}
                  helpText={
                    <>
                      {t("codex.globalAgentsStoredAt")} <code>~/.codex/AGENTS.md</code>.
                    </>
                  }
                  classNames={{
                    container: "settings-field settings-agents",
                    header: "settings-agents-header",
                    title: "settings-field-label",
                    actions: "settings-agents-actions",
                    meta: "settings-help settings-help-inline",
                    iconButton: "ghost settings-icon-button",
                    error: "settings-agents-error",
                    textarea: "settings-agents-textarea",
                    help: "settings-help",
                  }}
                />

                <FileEditorCard
                  title={t("codex.globalConfigTitle")}
                  meta={globalConfigMeta}
                  error={globalConfigError}
                  value={globalConfigContent}
                  placeholder={t("codex.globalConfigPlaceholder")}
                  disabled={globalConfigLoading}
                  refreshDisabled={globalConfigRefreshDisabled}
                  saveDisabled={globalConfigSaveDisabled}
                  saveLabel={globalConfigSaveLabel}
                  onChange={setGlobalConfigContent}
                  onRefresh={() => {
                    void refreshGlobalConfig();
                  }}
                  onSave={() => {
                    void saveGlobalConfig();
                  }}
                  helpText={
                    <>
                      {t("codex.globalConfigStoredAt")} <code>~/.codex/config.toml</code>.
                    </>
                  }
                  classNames={{
                    container: "settings-field settings-agents",
                    header: "settings-agents-header",
                    title: "settings-field-label",
                    actions: "settings-agents-actions",
                    meta: "settings-help settings-help-inline",
                    iconButton: "ghost settings-icon-button",
                    error: "settings-agents-error",
                    textarea: "settings-agents-textarea",
                    help: "settings-help",
                  }}
                />

                <div className="settings-field">
                  <div className="settings-field-label">{t("codex.workspaceOverrides")}</div>
                  <div className="settings-overrides">
                    {projects.map((workspace) => (
                      <div key={workspace.id} className="settings-override-row">
                        <div className="settings-override-info">
                          <div className="settings-project-name">{workspace.name}</div>
                          <div className="settings-project-path">{workspace.path}</div>
                        </div>
                        <div className="settings-override-actions">
                          <div className="settings-override-field">
                            <input
                              className="settings-input settings-input--compact"
                              value={codexBinOverrideDrafts[workspace.id] ?? ""}
                              placeholder={t("codex.codexBinaryOverride")}
                              onChange={(event) =>
                                setCodexBinOverrideDrafts((prev) => ({
                                  ...prev,
                                  [workspace.id]: event.target.value,
                                }))
                              }
                              onBlur={async () => {
                                const draft = codexBinOverrideDrafts[workspace.id] ?? "";
                                const nextValue = normalizeOverrideValue(draft);
                                if (nextValue === (workspace.codex_bin ?? null)) {
                                  return;
                                }
                                await onUpdateWorkspaceCodexBin(workspace.id, nextValue);
                              }}
                              aria-label={t("codex.codexBinaryOverrideForWorkspace", {
                                name: workspace.name,
                              })}
                            />
                            <button
                              type="button"
                              className="ghost"
                              onClick={async () => {
                                setCodexBinOverrideDrafts((prev) => ({
                                  ...prev,
                                  [workspace.id]: "",
                                }));
                                await onUpdateWorkspaceCodexBin(workspace.id, null);
                              }}
                            >
                              {t("codex.clear")}
                            </button>
                          </div>
                          <div className="settings-override-field">
                            <input
                              className="settings-input settings-input--compact"
                              value={codexHomeOverrideDrafts[workspace.id] ?? ""}
                              placeholder={t("codex.codexHomeOverride")}
                              onChange={(event) =>
                                setCodexHomeOverrideDrafts((prev) => ({
                                  ...prev,
                                  [workspace.id]: event.target.value,
                                }))
                              }
                              onBlur={async () => {
                                const draft = codexHomeOverrideDrafts[workspace.id] ?? "";
                                const nextValue = normalizeOverrideValue(draft);
                                if (nextValue === (workspace.settings.codexHome ?? null)) {
                                  return;
                                }
                                await onUpdateWorkspaceSettings(workspace.id, {
                                  codexHome: nextValue,
                                });
                              }}
                              aria-label={t("codex.codexHomeOverrideForWorkspace", {
                                name: workspace.name,
                              })}
                            />
                            <button
                              type="button"
                              className="ghost"
                              onClick={async () => {
                                setCodexHomeOverrideDrafts((prev) => ({
                                  ...prev,
                                  [workspace.id]: "",
                                }));
                                await onUpdateWorkspaceSettings(workspace.id, {
                                  codexHome: null,
                                });
                              }}
                            >
                              {t("codex.clear")}
                            </button>
                          </div>
                          <div className="settings-override-field">
                            <input
                              className="settings-input settings-input--compact"
                              value={codexArgsOverrideDrafts[workspace.id] ?? ""}
                              placeholder={t("codex.codexArgsOverride")}
                              onChange={(event) =>
                                setCodexArgsOverrideDrafts((prev) => ({
                                  ...prev,
                                  [workspace.id]: event.target.value,
                                }))
                              }
                              onBlur={async () => {
                                const draft = codexArgsOverrideDrafts[workspace.id] ?? "";
                                const nextValue = normalizeOverrideValue(draft);
                                if (nextValue === (workspace.settings.codexArgs ?? null)) {
                                  return;
                                }
                                await onUpdateWorkspaceSettings(workspace.id, {
                                  codexArgs: nextValue,
                                });
                              }}
                              aria-label={t("codex.codexArgsOverrideForWorkspace", {
                                name: workspace.name,
                              })}
                            />
                            <button
                              type="button"
                              className="ghost"
                              onClick={async () => {
                                setCodexArgsOverrideDrafts((prev) => ({
                                  ...prev,
                                  [workspace.id]: "",
                                }));
                                await onUpdateWorkspaceSettings(workspace.id, {
                                  codexArgs: null,
                                });
                              }}
                            >
                              {t("codex.clear")}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {projects.length === 0 && (
                      <div className="settings-empty">{t("projects.noProjects")}</div>
                    )}
                  </div>
                </div>

              </section>
            )}
            {activeSection === "features" && (
              <section className="settings-section">
                <div className="settings-section-title">{t("features.title")}</div>
                <div className="settings-section-subtitle">
                  {t("features.subtitle")}
                </div>
                {hasCodexHomeOverrides && (
                  <div className="settings-help">
                    {t("features.overridesWarningLine1")}
                    <br />
                    {t("features.overridesWarningLine2")}
                  </div>
                )}
                <div className="settings-toggle-row">
                  <div>
                    <div className="settings-toggle-title">{t("features.configFileTitle")}</div>
                    <div className="settings-toggle-subtitle">
                      {t("features.configFileSubtitle", { fileManager: fileManagerName() })}
                    </div>
                  </div>
                  <button type="button" className="ghost" onClick={handleOpenConfig}>
                    {openInFileManagerLabel()}
                  </button>
                </div>
                {openConfigError && (
                  <div className="settings-help">{openConfigError}</div>
                )}
                <div className="settings-subsection-title">{t("features.stableTitle")}</div>
                <div className="settings-subsection-subtitle">
                  {t("features.stableSubtitle")}
                </div>
                <div className="settings-toggle-row">
                  <div>
                    <div className="settings-toggle-title">{t("features.collaborationModesTitle")}</div>
                    <div className="settings-toggle-subtitle">
                      {t("features.collaborationModesSubtitle")}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle ${
                      appSettings.collaborationModesEnabled ? "on" : ""
                    }`}
                    onClick={() =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        collaborationModesEnabled:
                          !appSettings.collaborationModesEnabled,
                      })
                    }
                    aria-pressed={appSettings.collaborationModesEnabled}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>
                <div className="settings-toggle-row">
                  <div>
                    <div className="settings-toggle-title">{t("features.personalityTitle")}</div>
                    <div className="settings-toggle-subtitle">
                      {t("features.personalitySubtitlePrefix")} <code>personality</code>{" "}
                      {t("features.personalitySubtitleSuffix")}
                    </div>
                  </div>
                  <select
                    id="features-personality-select"
                    className="settings-select"
                    value={appSettings.personality}
                    onChange={(event) =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        personality: event.target.value as AppSettings["personality"],
                      })
                    }
                    aria-label={t("features.personalityTitle")}
                  >
                    <option value="friendly">{t("features.personalityFriendly")}</option>
                    <option value="pragmatic">{t("features.personalityPragmatic")}</option>
                  </select>
                </div>
                <div className="settings-toggle-row">
                  <div>
                    <div className="settings-toggle-title">{t("features.steerModeTitle")}</div>
                    <div className="settings-toggle-subtitle">
                      {t("features.steerModeSubtitle")}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle ${appSettings.steerEnabled ? "on" : ""}`}
                    onClick={() =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        steerEnabled: !appSettings.steerEnabled,
                      })
                    }
                    aria-pressed={appSettings.steerEnabled}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>
                <div className="settings-toggle-row">
                  <div>
                    <div className="settings-toggle-title">{t("features.backgroundTerminalTitle")}</div>
                    <div className="settings-toggle-subtitle">
                      {t("features.backgroundTerminalSubtitle")}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle ${appSettings.unifiedExecEnabled ? "on" : ""}`}
                    onClick={() =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        unifiedExecEnabled: !appSettings.unifiedExecEnabled,
                      })
                    }
                    aria-pressed={appSettings.unifiedExecEnabled}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>
                <div className="settings-subsection-title">{t("features.experimentalTitle")}</div>
                <div className="settings-subsection-subtitle">
                  {t("features.experimentalSubtitle")}
                </div>
                <div className="settings-toggle-row">
                  <div>
                    <div className="settings-toggle-title">{t("features.multiAgentTitle")}</div>
                    <div className="settings-toggle-subtitle">
                      {t("features.multiAgentSubtitle")}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle ${appSettings.experimentalCollabEnabled ? "on" : ""}`}
                    onClick={() =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        experimentalCollabEnabled: !appSettings.experimentalCollabEnabled,
                      })
                    }
                    aria-pressed={appSettings.experimentalCollabEnabled}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>
                <div className="settings-toggle-row">
                  <div>
                    <div className="settings-toggle-title">{t("features.appsTitle")}</div>
                    <div className="settings-toggle-subtitle">
                      {t("features.appsSubtitlePrefix")} <code>/apps</code> {t("features.appsSubtitleSuffix")}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle ${appSettings.experimentalAppsEnabled ? "on" : ""}`}
                    onClick={() =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        experimentalAppsEnabled: !appSettings.experimentalAppsEnabled,
                      })
                    }
                    aria-pressed={appSettings.experimentalAppsEnabled}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>
              </section>
            )}
          </div>
      </div>
    </ModalShell>
  );
}

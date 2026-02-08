import type { KeyboardEvent } from "react";
import { formatShortcut, getDefaultInterruptShortcut } from "../../../../utils/shortcuts";
import { isMacPlatform } from "../../../../utils/platformPaths";
import { useAppTranslation } from "../../../i18n/i18n";
import type {
  ShortcutDraftKey,
  ShortcutDrafts,
  ShortcutSettingKey,
} from "../settingsTypes";

type ShortcutItem = {
  label: string;
  draftKey: ShortcutDraftKey;
  settingKey: ShortcutSettingKey;
  help: string;
};

type ShortcutGroup = {
  title: string;
  subtitle: string;
  items: ShortcutItem[];
};

type SettingsShortcutsSectionProps = {
  shortcutDrafts: ShortcutDrafts;
  onShortcutKeyDown: (
    event: KeyboardEvent<HTMLInputElement>,
    key: ShortcutSettingKey,
  ) => void;
  onClearShortcut: (key: ShortcutSettingKey) => void;
};

function ShortcutField({
  item,
  shortcutDrafts,
  onShortcutKeyDown,
  onClearShortcut,
  shortcutPlaceholder,
  clearLabel,
}: {
  item: ShortcutItem;
  shortcutDrafts: ShortcutDrafts;
  onShortcutKeyDown: (
    event: KeyboardEvent<HTMLInputElement>,
    key: ShortcutSettingKey,
  ) => void;
  onClearShortcut: (key: ShortcutSettingKey) => void;
  shortcutPlaceholder: string;
  clearLabel: string;
}) {
  return (
    <div className="settings-field">
      <div className="settings-field-label">{item.label}</div>
      <div className="settings-field-row">
        <input
          className="settings-input settings-input--shortcut"
          value={formatShortcut(shortcutDrafts[item.draftKey])}
          onKeyDown={(event) => onShortcutKeyDown(event, item.settingKey)}
          placeholder={shortcutPlaceholder}
          readOnly
        />
        <button
          type="button"
          className="ghost settings-button-compact"
          onClick={() => onClearShortcut(item.settingKey)}
        >
          {clearLabel}
        </button>
      </div>
      <div className="settings-help">{item.help}</div>
    </div>
  );
}

export function SettingsShortcutsSection({
  shortcutDrafts,
  onShortcutKeyDown,
  onClearShortcut,
}: SettingsShortcutsSectionProps) {
  const { t } = useAppTranslation("settings");
  const isMac = isMacPlatform();

  const defaultHelp = (shortcut: string) =>
    `${t("shortcuts.default")}: ${formatShortcut(shortcut)}`;
  const defaultHelpWithPress = (shortcut: string) =>
    `${t("shortcuts.pressNewShortcut")} ${t("shortcuts.default")}: ${formatShortcut(shortcut)}`;

  const groups: ShortcutGroup[] = [
    {
      title: t("shortcuts.fileTitle"),
      subtitle: t("shortcuts.fileSubtitle"),
      items: [
        {
          label: t("shortcuts.newAgent"),
          draftKey: "newAgent",
          settingKey: "newAgentShortcut",
          help: defaultHelp("cmd+n"),
        },
        {
          label: t("shortcuts.newWorktreeAgent"),
          draftKey: "newWorktreeAgent",
          settingKey: "newWorktreeAgentShortcut",
          help: defaultHelp("cmd+shift+n"),
        },
        {
          label: t("shortcuts.newCloneAgent"),
          draftKey: "newCloneAgent",
          settingKey: "newCloneAgentShortcut",
          help: defaultHelp("cmd+alt+n"),
        },
        {
          label: t("shortcuts.archiveActiveThread"),
          draftKey: "archiveThread",
          settingKey: "archiveThreadShortcut",
          help: defaultHelp(isMac ? "cmd+ctrl+a" : "ctrl+alt+a"),
        },
      ],
    },
    {
      title: t("shortcuts.composerTitle"),
      subtitle: t("shortcuts.composerSubtitle"),
      items: [
        {
          label: t("shortcuts.cycleModel"),
          draftKey: "model",
          settingKey: "composerModelShortcut",
          help: defaultHelpWithPress("cmd+shift+m"),
        },
        {
          label: t("shortcuts.cycleAccessMode"),
          draftKey: "access",
          settingKey: "composerAccessShortcut",
          help: defaultHelp("cmd+shift+a"),
        },
        {
          label: t("shortcuts.cycleReasoningMode"),
          draftKey: "reasoning",
          settingKey: "composerReasoningShortcut",
          help: defaultHelp("cmd+shift+r"),
        },
        {
          label: t("shortcuts.cycleCollaborationMode"),
          draftKey: "collaboration",
          settingKey: "composerCollaborationShortcut",
          help: defaultHelp("shift+tab"),
        },
        {
          label: t("shortcuts.stopActiveRun"),
          draftKey: "interrupt",
          settingKey: "interruptShortcut",
          help: defaultHelp(getDefaultInterruptShortcut()),
        },
      ],
    },
    {
      title: t("shortcuts.panelsTitle"),
      subtitle: t("shortcuts.panelsSubtitle"),
      items: [
        {
          label: t("shortcuts.toggleProjectsSidebar"),
          draftKey: "projectsSidebar",
          settingKey: "toggleProjectsSidebarShortcut",
          help: defaultHelp("cmd+shift+p"),
        },
        {
          label: t("shortcuts.toggleGitSidebar"),
          draftKey: "gitSidebar",
          settingKey: "toggleGitSidebarShortcut",
          help: defaultHelp("cmd+shift+g"),
        },
        {
          label: t("shortcuts.branchSwitcher"),
          draftKey: "branchSwitcher",
          settingKey: "branchSwitcherShortcut",
          help: defaultHelp("cmd+b"),
        },
        {
          label: t("shortcuts.toggleDebugPanel"),
          draftKey: "debugPanel",
          settingKey: "toggleDebugPanelShortcut",
          help: defaultHelp("cmd+shift+d"),
        },
        {
          label: t("shortcuts.toggleTerminalPanel"),
          draftKey: "terminal",
          settingKey: "toggleTerminalShortcut",
          help: defaultHelp("cmd+shift+t"),
        },
      ],
    },
    {
      title: t("shortcuts.navigationTitle"),
      subtitle: t("shortcuts.navigationSubtitle"),
      items: [
        {
          label: t("shortcuts.nextAgent"),
          draftKey: "cycleAgentNext",
          settingKey: "cycleAgentNextShortcut",
          help: defaultHelp(isMac ? "cmd+ctrl+down" : "ctrl+alt+down"),
        },
        {
          label: t("shortcuts.previousAgent"),
          draftKey: "cycleAgentPrev",
          settingKey: "cycleAgentPrevShortcut",
          help: defaultHelp(isMac ? "cmd+ctrl+up" : "ctrl+alt+up"),
        },
        {
          label: t("shortcuts.nextWorkspace"),
          draftKey: "cycleWorkspaceNext",
          settingKey: "cycleWorkspaceNextShortcut",
          help: defaultHelp(isMac ? "cmd+shift+down" : "ctrl+alt+shift+down"),
        },
        {
          label: t("shortcuts.previousWorkspace"),
          draftKey: "cycleWorkspacePrev",
          settingKey: "cycleWorkspacePrevShortcut",
          help: defaultHelp(isMac ? "cmd+shift+up" : "ctrl+alt+shift+up"),
        },
      ],
    },
  ];

  return (
    <section className="settings-section">
      <div className="settings-section-title">{t("shortcuts.title")}</div>
      <div className="settings-section-subtitle">
        {t("shortcuts.subtitle")}
      </div>
      {groups.map((group, index) => (
        <div key={group.title}>
          {index > 0 && <div className="settings-divider" />}
          <div className="settings-subsection-title">{group.title}</div>
          <div className="settings-subsection-subtitle">{group.subtitle}</div>
          {group.items.map((item) => (
            <ShortcutField
              key={item.settingKey}
              item={item}
              shortcutDrafts={shortcutDrafts}
              onShortcutKeyDown={onShortcutKeyDown}
              onClearShortcut={onClearShortcut}
              shortcutPlaceholder={t("shortcuts.typeShortcut")}
              clearLabel={t("shortcuts.clear")}
            />
          ))}
        </div>
      ))}
    </section>
  );
}

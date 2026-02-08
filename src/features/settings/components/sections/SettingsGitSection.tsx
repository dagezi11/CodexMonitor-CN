import type { AppSettings } from "../../../../types";
import { useAppTranslation } from "../../../i18n/i18n";

type SettingsGitSectionProps = {
  appSettings: AppSettings;
  onUpdateAppSettings: (next: AppSettings) => Promise<void>;
};

export function SettingsGitSection({
  appSettings,
  onUpdateAppSettings,
}: SettingsGitSectionProps) {
  const { t } = useAppTranslation("settings");

  return (
    <section className="settings-section">
      <div className="settings-section-title">{t("git.title")}</div>
      <div className="settings-section-subtitle">
        {t("git.subtitle")}
      </div>
      <div className="settings-toggle-row">
        <div>
          <div className="settings-toggle-title">{t("git.preloadDiffsTitle")}</div>
          <div className="settings-toggle-subtitle">{t("git.preloadDiffsSubtitle")}</div>
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
  );
}

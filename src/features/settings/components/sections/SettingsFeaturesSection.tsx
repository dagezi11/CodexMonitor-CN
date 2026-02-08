import type { AppSettings } from "../../../../types";
import { fileManagerName, openInFileManagerLabel } from "../../../../utils/platformPaths";
import { useAppTranslation } from "../../../i18n/i18n";

type SettingsFeaturesSectionProps = {
  appSettings: AppSettings;
  hasCodexHomeOverrides: boolean;
  openConfigError: string | null;
  onOpenConfig: () => void;
  onUpdateAppSettings: (next: AppSettings) => Promise<void>;
};

export function SettingsFeaturesSection({
  appSettings,
  hasCodexHomeOverrides,
  openConfigError,
  onOpenConfig,
  onUpdateAppSettings,
}: SettingsFeaturesSectionProps) {
  const { t } = useAppTranslation("settings");

  return (
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
        <button type="button" className="ghost" onClick={onOpenConfig}>
          {openInFileManagerLabel()}
        </button>
      </div>
      {openConfigError && <div className="settings-help">{openConfigError}</div>}
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
          className={`settings-toggle ${appSettings.collaborationModesEnabled ? "on" : ""}`}
          onClick={() =>
            void onUpdateAppSettings({
              ...appSettings,
              collaborationModesEnabled: !appSettings.collaborationModesEnabled,
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
  );
}

import type { Dispatch, SetStateAction } from "react";
import type { AppSettings } from "../../../../types";
import {
  CODE_FONT_SIZE_MAX,
  CODE_FONT_SIZE_MIN,
  CODE_FONT_SIZE_DEFAULT,
  DEFAULT_CODE_FONT_FAMILY,
  DEFAULT_UI_FONT_FAMILY,
} from "../../../../utils/fonts";
import { useAppTranslation } from "../../../i18n/i18n";

type SettingsDisplaySectionProps = {
  appSettings: AppSettings;
  reduceTransparency: boolean;
  scaleShortcutTitle: string;
  scaleShortcutText: string;
  scaleDraft: string;
  uiFontDraft: string;
  codeFontDraft: string;
  codeFontSizeDraft: number;
  onUpdateAppSettings: (next: AppSettings) => Promise<void>;
  onToggleTransparency: (value: boolean) => void;
  onSetScaleDraft: Dispatch<SetStateAction<string>>;
  onCommitScale: () => Promise<void>;
  onResetScale: () => Promise<void>;
  onSetUiFontDraft: Dispatch<SetStateAction<string>>;
  onCommitUiFont: () => Promise<void>;
  onSetCodeFontDraft: Dispatch<SetStateAction<string>>;
  onCommitCodeFont: () => Promise<void>;
  onSetCodeFontSizeDraft: Dispatch<SetStateAction<number>>;
  onCommitCodeFontSize: (nextSize: number) => Promise<void>;
  onTestNotificationSound: () => void;
  onTestSystemNotification: () => void;
};

export function SettingsDisplaySection({
  appSettings,
  reduceTransparency,
  scaleShortcutTitle,
  scaleShortcutText,
  scaleDraft,
  uiFontDraft,
  codeFontDraft,
  codeFontSizeDraft,
  onUpdateAppSettings,
  onToggleTransparency,
  onSetScaleDraft,
  onCommitScale,
  onResetScale,
  onSetUiFontDraft,
  onCommitUiFont,
  onSetCodeFontDraft,
  onCommitCodeFont,
  onSetCodeFontSizeDraft,
  onCommitCodeFontSize,
  onTestNotificationSound,
  onTestSystemNotification,
}: SettingsDisplaySectionProps) {
  const { t } = useAppTranslation("settings");

  return (
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
          <div className="settings-toggle-title">{t("display.showRemainingTitle")}</div>
          <div className="settings-toggle-subtitle">
            {t("display.showRemainingSubtitle")}
          </div>
        </div>
        <button
          type="button"
          className={`settings-toggle ${appSettings.usageShowRemaining ? "on" : ""}`}
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
          <div className="settings-toggle-title">{t("display.showMessageFilePathTitle")}</div>
          <div className="settings-toggle-subtitle">
            {t("display.showMessageFilePathSubtitle")}
          </div>
        </div>
        <button
          type="button"
          className={`settings-toggle ${appSettings.showMessageFilePath ? "on" : ""}`}
          onClick={() =>
            void onUpdateAppSettings({
              ...appSettings,
              showMessageFilePath: !appSettings.showMessageFilePath,
            })
          }
          aria-pressed={appSettings.showMessageFilePath}
        >
          <span className="settings-toggle-knob" />
        </button>
      </div>
      <div className="settings-toggle-row">
        <div>
          <div className="settings-toggle-title">{t("display.reduceTransparencyTitle")}</div>
          <div className="settings-toggle-subtitle">{t("display.reduceTransparencySubtitle")}</div>
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
          <div className="settings-toggle-subtitle" title={scaleShortcutTitle}>
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
            onChange={(event) => onSetScaleDraft(event.target.value)}
            onBlur={() => {
              void onCommitScale();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void onCommitScale();
              }
            }}
          />
          <button
            type="button"
            className="ghost settings-scale-reset"
            onClick={() => {
              void onResetScale();
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
            onChange={(event) => onSetUiFontDraft(event.target.value)}
            onBlur={() => {
              void onCommitUiFont();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void onCommitUiFont();
              }
            }}
          />
          <button
            type="button"
            className="ghost settings-button-compact"
            onClick={() => {
              onSetUiFontDraft(DEFAULT_UI_FONT_FAMILY);
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
            onChange={(event) => onSetCodeFontDraft(event.target.value)}
            onBlur={() => {
              void onCommitCodeFont();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void onCommitCodeFont();
              }
            }}
          />
          <button
            type="button"
            className="ghost settings-button-compact"
            onClick={() => {
              onSetCodeFontDraft(DEFAULT_CODE_FONT_FAMILY);
              void onUpdateAppSettings({
                ...appSettings,
                codeFontFamily: DEFAULT_CODE_FONT_FAMILY,
              });
            }}
          >
            {t("display.reset")}
          </button>
        </div>
        <div className="settings-help">{t("display.codeFontFamilyHelp")}</div>
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
              onSetCodeFontSizeDraft(nextValue);
              void onCommitCodeFontSize(nextValue);
            }}
          />
          <div className="settings-scale-value">{codeFontSizeDraft}px</div>
          <button
            type="button"
            className="ghost settings-button-compact"
            onClick={() => {
              onSetCodeFontSizeDraft(CODE_FONT_SIZE_DEFAULT);
              void onCommitCodeFontSize(CODE_FONT_SIZE_DEFAULT);
            }}
          >
            Reset
          </button>
        </div>
        <div className="settings-help">{t("display.codeFontSizeHelp")}</div>
      </div>
      <div className="settings-subsection-title">{t("display.sounds")}</div>
      <div className="settings-subsection-subtitle">{t("display.soundsSubtitle")}</div>
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
  );
}

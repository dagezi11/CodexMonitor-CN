import type { AppSettings, DictationModelStatus } from "../../../../types";
import { formatDownloadSize } from "../../../../utils/formatting";
import { useAppTranslation } from "../../../i18n/i18n";

type DictationModelOption = {
  id: string;
  label: string;
  size: string;
  note: string;
};

type SettingsDictationSectionProps = {
  appSettings: AppSettings;
  optionKeyLabel: string;
  metaKeyLabel: string;
  dictationModels: DictationModelOption[];
  selectedDictationModel: DictationModelOption;
  dictationModelStatus?: DictationModelStatus | null;
  dictationReady: boolean;
  onUpdateAppSettings: (next: AppSettings) => Promise<void>;
  onDownloadDictationModel?: () => void;
  onCancelDictationDownload?: () => void;
  onRemoveDictationModel?: () => void;
};

export function SettingsDictationSection({
  appSettings,
  optionKeyLabel,
  metaKeyLabel,
  dictationModels,
  selectedDictationModel,
  dictationModelStatus,
  dictationReady,
  onUpdateAppSettings,
  onDownloadDictationModel,
  onCancelDictationDownload,
  onRemoveDictationModel,
}: SettingsDictationSectionProps) {
  const { t } = useAppTranslation("settings");
  const dictationProgress = dictationModelStatus?.progress ?? null;

  return (
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
          {dictationModels.map((model) => (
            <option key={model.id} value={model.id}>
              {model.label} ({model.size})
            </option>
          ))}
        </select>
        <div className="settings-help">
          {selectedDictationModel.note} {t("dictation.downloadSize")} {selectedDictationModel.size}.
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
          <option value="en">{t("dictation.languages.en")}</option>
          <option value="es">{t("dictation.languages.es")}</option>
          <option value="fr">{t("dictation.languages.fr")}</option>
          <option value="de">{t("dictation.languages.de")}</option>
          <option value="it">{t("dictation.languages.it")}</option>
          <option value="pt">{t("dictation.languages.pt")}</option>
          <option value="nl">{t("dictation.languages.nl")}</option>
          <option value="sv">{t("dictation.languages.sv")}</option>
          <option value="no">{t("dictation.languages.no")}</option>
          <option value="da">{t("dictation.languages.da")}</option>
          <option value="fi">{t("dictation.languages.fi")}</option>
          <option value="pl">{t("dictation.languages.pl")}</option>
          <option value="tr">{t("dictation.languages.tr")}</option>
          <option value="ru">{t("dictation.languages.ru")}</option>
          <option value="uk">{t("dictation.languages.uk")}</option>
          <option value="ja">{t("dictation.languages.ja")}</option>
          <option value="ko">{t("dictation.languages.ko")}</option>
          <option value="zh">{t("dictation.languages.zh")}</option>
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
            {t("dictation.modelStatus", { label: selectedDictationModel.label })}
          </div>
          <div className="settings-help">
            {dictationModelStatus.state === "ready" && t("dictation.statusReady")}
            {dictationModelStatus.state === "missing" && t("dictation.statusMissing")}
            {dictationModelStatus.state === "downloading" && t("dictation.statusDownloading")}
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
                          (dictationProgress.downloadedBytes / dictationProgress.totalBytes) * 100,
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
  );
}

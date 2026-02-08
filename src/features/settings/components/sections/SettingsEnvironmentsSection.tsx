import type { Dispatch, SetStateAction } from "react";
import type { WorkspaceInfo } from "../../../../types";
import { pushErrorToast } from "../../../../services/toasts";
import { useAppTranslation } from "../../../i18n/i18n";

type SettingsEnvironmentsSectionProps = {
  mainWorkspaces: WorkspaceInfo[];
  environmentWorkspace: WorkspaceInfo | null;
  environmentSaving: boolean;
  environmentError: string | null;
  environmentDraftScript: string;
  environmentSavedScript: string | null;
  environmentDirty: boolean;
  onSetEnvironmentWorkspaceId: Dispatch<SetStateAction<string | null>>;
  onSetEnvironmentDraftScript: Dispatch<SetStateAction<string>>;
  onSaveEnvironmentSetup: () => Promise<void>;
};

export function SettingsEnvironmentsSection({
  mainWorkspaces,
  environmentWorkspace,
  environmentSaving,
  environmentError,
  environmentDraftScript,
  environmentSavedScript,
  environmentDirty,
  onSetEnvironmentWorkspaceId,
  onSetEnvironmentDraftScript,
  onSaveEnvironmentSetup,
}: SettingsEnvironmentsSectionProps) {
  const { t } = useAppTranslation("settings");

  return (
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
            <label className="settings-field-label" htmlFor="settings-environment-project">
              {t("environments.project")}
            </label>
            <select
              id="settings-environment-project"
              className="settings-select"
              value={environmentWorkspace?.id ?? ""}
              onChange={(event) => onSetEnvironmentWorkspaceId(event.target.value)}
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
              onChange={(event) => onSetEnvironmentDraftScript(event.target.value)}
              placeholder={t("environments.setupScriptPlaceholder")}
              spellCheck={false}
              disabled={environmentSaving}
            />
            <div className="settings-field-actions">
              <button
                type="button"
                className="ghost settings-button-compact"
                onClick={() => {
                  const clipboard = typeof navigator === "undefined" ? null : navigator.clipboard;
                  if (!clipboard?.writeText) {
                    pushErrorToast({
                      title: t("environments.copyFailedTitle"),
                      message: t("environments.copyFailedClipboardUnavailable"),
                    });
                    return;
                  }

                  void clipboard.writeText(environmentDraftScript).catch(() => {
                    pushErrorToast({
                      title: t("environments.copyFailedTitle"),
                      message: t("environments.copyFailedWrite"),
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
                onClick={() => onSetEnvironmentDraftScript(environmentSavedScript ?? "")}
                disabled={environmentSaving || !environmentDirty}
              >
                {t("environments.reset")}
              </button>
              <button
                type="button"
                className="primary settings-button-compact"
                onClick={() => {
                  void onSaveEnvironmentSetup();
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
  );
}

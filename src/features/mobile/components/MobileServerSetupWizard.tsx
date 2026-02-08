import "../../../styles/mobile-setup-wizard.css";
import { ModalShell } from "../../design-system/components/modal/ModalShell";
import { useTranslation } from "react-i18next";
import type { AppSettings } from "../../../types";

export type MobileServerSetupWizardProps = {
  provider: AppSettings["remoteBackendProvider"];
  remoteHostDraft: string;
  orbitWsUrlDraft: string;
  remoteTokenDraft: string;
  busy: boolean;
  checking: boolean;
  statusMessage: string | null;
  statusError: boolean;
  onProviderChange: (provider: AppSettings["remoteBackendProvider"]) => void;
  onRemoteHostChange: (value: string) => void;
  onOrbitWsUrlChange: (value: string) => void;
  onRemoteTokenChange: (value: string) => void;
  onConnectTest: () => void;
};

export function MobileServerSetupWizard({
  provider,
  remoteHostDraft,
  orbitWsUrlDraft,
  remoteTokenDraft,
  busy,
  checking,
  statusMessage,
  statusError,
  onProviderChange,
  onRemoteHostChange,
  onOrbitWsUrlChange,
  onRemoteTokenChange,
  onConnectTest,
}: MobileServerSetupWizardProps) {
  const { t } = useTranslation();

  return (
    <ModalShell
      className="mobile-setup-wizard-overlay"
      cardClassName="mobile-setup-wizard-card"
      ariaLabel={t("settings.codex.mobileSetupAriaLabel")}
    >
      <div className="mobile-setup-wizard-header">
        <div className="mobile-setup-wizard-kicker">{t("settings.codex.mobileSetupKicker")}</div>
        <h2 className="mobile-setup-wizard-title">{t("settings.codex.mobileSetupTitle")}</h2>
        <p className="mobile-setup-wizard-subtitle">
          {t("settings.codex.mobileSetupSubtitle")}
        </p>
      </div>

      <div className="mobile-setup-wizard-body">
        <label className="mobile-setup-wizard-label" htmlFor="mobile-setup-provider">
          {t("settings.codex.mobileSetupConnectionType")}
        </label>
        <select
          id="mobile-setup-provider"
          className="mobile-setup-wizard-input"
          value={provider}
          onChange={(event) =>
            onProviderChange(event.target.value as AppSettings["remoteBackendProvider"])
          }
          disabled={busy || checking}
        >
          <option value="tcp">{t("settings.codex.remoteProviderTcp")}</option>
          <option value="orbit">{t("settings.codex.remoteProviderOrbit")}</option>
        </select>

        {provider === "tcp" && (
          <>
            <label className="mobile-setup-wizard-label" htmlFor="mobile-setup-host">
              {t("settings.codex.mobileSetupTailscaleHost")}
            </label>
            <input
              id="mobile-setup-host"
              className="mobile-setup-wizard-input"
              value={remoteHostDraft}
              placeholder={t("settings.codex.mobileSetupTailscaleHostPlaceholder")}
              onChange={(event) => onRemoteHostChange(event.target.value)}
              disabled={busy || checking}
            />
          </>
        )}

        {provider === "orbit" && (
          <>
            <label className="mobile-setup-wizard-label" htmlFor="mobile-setup-orbit-url">
              {t("settings.codex.mobileSetupOrbitUrl")}
            </label>
            <input
              id="mobile-setup-orbit-url"
              className="mobile-setup-wizard-input"
              value={orbitWsUrlDraft}
              placeholder={t("settings.codex.mobileSetupOrbitUrlPlaceholder")}
              onChange={(event) => onOrbitWsUrlChange(event.target.value)}
              disabled={busy || checking}
            />
          </>
        )}

        <label className="mobile-setup-wizard-label" htmlFor="mobile-setup-token">
          {t("settings.codex.mobileSetupToken")}
        </label>
        <input
          id="mobile-setup-token"
          type="password"
          className="mobile-setup-wizard-input"
          value={remoteTokenDraft}
          placeholder={t("settings.codex.mobileSetupTokenPlaceholder")}
          onChange={(event) => onRemoteTokenChange(event.target.value)}
          disabled={busy || checking}
        />

        <button
          type="button"
          className="button primary mobile-setup-wizard-action"
          onClick={onConnectTest}
          disabled={busy || checking}
        >
          {checking
            ? t("settings.codex.mobileSetupChecking")
            : busy
              ? t("settings.codex.mobileSetupConnecting")
              : t("settings.codex.mobileSetupConnectTest")}
        </button>

        {statusMessage ? (
          <div
            className={`mobile-setup-wizard-status${
              statusError ? " mobile-setup-wizard-status-error" : ""
            }`}
            role="status"
            aria-live="polite"
          >
            {statusMessage}
          </div>
        ) : null}

        <div className="mobile-setup-wizard-hint">
          {provider === "tcp"
            ? t("settings.codex.mobileSetupTcpHint")
            : t("settings.codex.mobileSetupOrbitHint")}
        </div>
      </div>
    </ModalShell>
  );
}

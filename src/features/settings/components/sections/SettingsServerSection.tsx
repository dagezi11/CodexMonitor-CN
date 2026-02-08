import type { Dispatch, SetStateAction } from "react";
import type {
  AppSettings,
  TailscaleDaemonCommandPreview,
  TailscaleStatus,
  TcpDaemonStatus,
} from "../../../../types";
import { useAppTranslation } from "../../../i18n/i18n";

type SettingsServerSectionProps = {
  appSettings: AppSettings;
  onUpdateAppSettings: (next: AppSettings) => Promise<void>;
  isMobilePlatform: boolean;
  mobileConnectBusy: boolean;
  mobileConnectStatusText: string | null;
  mobileConnectStatusError: boolean;
  remoteHostDraft: string;
  remoteTokenDraft: string;
  orbitWsUrlDraft: string;
  orbitAuthUrlDraft: string;
  orbitRunnerNameDraft: string;
  orbitAccessClientIdDraft: string;
  orbitAccessClientSecretRefDraft: string;
  orbitStatusText: string | null;
  orbitAuthCode: string | null;
  orbitVerificationUrl: string | null;
  orbitBusyAction: string | null;
  tailscaleStatus: TailscaleStatus | null;
  tailscaleStatusBusy: boolean;
  tailscaleStatusError: string | null;
  tailscaleCommandPreview: TailscaleDaemonCommandPreview | null;
  tailscaleCommandBusy: boolean;
  tailscaleCommandError: string | null;
  tcpDaemonStatus: TcpDaemonStatus | null;
  tcpDaemonBusyAction: "start" | "stop" | "status" | null;
  onSetRemoteHostDraft: Dispatch<SetStateAction<string>>;
  onSetRemoteTokenDraft: Dispatch<SetStateAction<string>>;
  onSetOrbitWsUrlDraft: Dispatch<SetStateAction<string>>;
  onSetOrbitAuthUrlDraft: Dispatch<SetStateAction<string>>;
  onSetOrbitRunnerNameDraft: Dispatch<SetStateAction<string>>;
  onSetOrbitAccessClientIdDraft: Dispatch<SetStateAction<string>>;
  onSetOrbitAccessClientSecretRefDraft: Dispatch<SetStateAction<string>>;
  onCommitRemoteHost: () => Promise<void>;
  onCommitRemoteToken: () => Promise<void>;
  onChangeRemoteProvider: (provider: AppSettings["remoteBackendProvider"]) => Promise<void>;
  onRefreshTailscaleStatus: () => void;
  onRefreshTailscaleCommandPreview: () => void;
  onUseSuggestedTailscaleHost: () => Promise<void>;
  onTcpDaemonStart: () => Promise<void>;
  onTcpDaemonStop: () => Promise<void>;
  onTcpDaemonStatus: () => Promise<void>;
  onCommitOrbitWsUrl: () => Promise<void>;
  onCommitOrbitAuthUrl: () => Promise<void>;
  onCommitOrbitRunnerName: () => Promise<void>;
  onCommitOrbitAccessClientId: () => Promise<void>;
  onCommitOrbitAccessClientSecretRef: () => Promise<void>;
  onOrbitConnectTest: () => void;
  onOrbitSignIn: () => void;
  onOrbitSignOut: () => void;
  onOrbitRunnerStart: () => void;
  onOrbitRunnerStop: () => void;
  onOrbitRunnerStatus: () => void;
  onMobileConnectTest: () => void;
};

export function SettingsServerSection({
  appSettings,
  onUpdateAppSettings,
  isMobilePlatform,
  mobileConnectBusy,
  mobileConnectStatusText,
  mobileConnectStatusError,
  remoteHostDraft,
  remoteTokenDraft,
  orbitWsUrlDraft,
  orbitAuthUrlDraft,
  orbitRunnerNameDraft,
  orbitAccessClientIdDraft,
  orbitAccessClientSecretRefDraft,
  orbitStatusText,
  orbitAuthCode,
  orbitVerificationUrl,
  orbitBusyAction,
  tailscaleStatus,
  tailscaleStatusBusy,
  tailscaleStatusError,
  tailscaleCommandPreview,
  tailscaleCommandBusy,
  tailscaleCommandError,
  tcpDaemonStatus,
  tcpDaemonBusyAction,
  onSetRemoteHostDraft,
  onSetRemoteTokenDraft,
  onSetOrbitWsUrlDraft,
  onSetOrbitAuthUrlDraft,
  onSetOrbitRunnerNameDraft,
  onSetOrbitAccessClientIdDraft,
  onSetOrbitAccessClientSecretRefDraft,
  onCommitRemoteHost,
  onCommitRemoteToken,
  onChangeRemoteProvider,
  onRefreshTailscaleStatus,
  onRefreshTailscaleCommandPreview,
  onUseSuggestedTailscaleHost,
  onTcpDaemonStart,
  onTcpDaemonStop,
  onTcpDaemonStatus,
  onCommitOrbitWsUrl,
  onCommitOrbitAuthUrl,
  onCommitOrbitRunnerName,
  onCommitOrbitAccessClientId,
  onCommitOrbitAccessClientSecretRef,
  onOrbitConnectTest,
  onOrbitSignIn,
  onOrbitSignOut,
  onOrbitRunnerStart,
  onOrbitRunnerStop,
  onOrbitRunnerStatus,
  onMobileConnectTest,
}: SettingsServerSectionProps) {
  const { t } = useAppTranslation("settings");
  const isMobileSimplified = isMobilePlatform;
  const remoteProviderWipSuffix = " (wip)";
  const tcpRunnerStatusText = (() => {
    if (!tcpDaemonStatus) {
      return null;
    }
    const configuredListenAddress = t("codex.configuredListenAddress");
    if (tcpDaemonStatus.state === "running") {
      return tcpDaemonStatus.pid
        ? t("codex.tcpDaemonRunningWithPid", {
            pid: tcpDaemonStatus.pid,
            listenAddr: tcpDaemonStatus.listenAddr ?? configuredListenAddress,
          })
        : t("codex.tcpDaemonRunning", {
            listenAddr: tcpDaemonStatus.listenAddr ?? configuredListenAddress,
          });
    }
    if (tcpDaemonStatus.state === "error") {
      return tcpDaemonStatus.lastError ?? t("codex.tcpDaemonErrorState");
    }
    return t("codex.tcpDaemonStopped", {
      listenAddrSuffix: tcpDaemonStatus.listenAddr ? ` (${tcpDaemonStatus.listenAddr})` : "",
    });
  })();

  return (
    <section className="settings-section">
      <div className="settings-section-title">{t("nav.server")}</div>
      <div className="settings-section-subtitle">
        {isMobileSimplified
          ? t("codex.mobileSetupSubtitle")
          : t("codex.serverSubtitleDesktop")}
      </div>

      {!isMobileSimplified && (
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
      )}

      <>
        <div className="settings-field">
          <label className="settings-field-label" htmlFor="remote-provider">
            {isMobileSimplified ? t("codex.mobileSetupConnectionType") : t("codex.remoteProvider")}
          </label>
          <select
            id="remote-provider"
            className="settings-select"
            value={appSettings.remoteBackendProvider}
            onChange={(event) => {
              void onChangeRemoteProvider(
                event.target.value as AppSettings["remoteBackendProvider"],
              );
            }}
            aria-label={isMobileSimplified ? t("codex.mobileSetupConnectionType") : t("codex.remoteProvider")}
          >
            <option value="tcp">
              {isMobileSimplified
                ? t("codex.remoteProviderTcp")
                : `${t("codex.remoteProviderTcp")}${remoteProviderWipSuffix}`}
            </option>
            <option value="orbit">
              {isMobileSimplified
                ? t("codex.remoteProviderOrbit")
                : `${t("codex.remoteProviderOrbit")}${remoteProviderWipSuffix}`}
            </option>
          </select>
          <div className="settings-help">
            {isMobileSimplified
              ? appSettings.remoteBackendProvider === "tcp"
                ? t("codex.mobileSetupTcpHint")
                : t("codex.mobileSetupOrbitHint")
              : t("codex.remoteProviderHelp")}
          </div>
        </div>

        {appSettings.remoteBackendProvider === "tcp" && (
          <>
            <div className="settings-field">
              <div className="settings-field-label">{t("codex.remoteBackend")}</div>
              <div className="settings-field-row">
                <input
                  className="settings-input settings-input--compact"
                  value={remoteHostDraft}
                  placeholder={t("codex.remoteBackendHostPlaceholder")}
                  onChange={(event) => onSetRemoteHostDraft(event.target.value)}
                  onBlur={() => {
                    void onCommitRemoteHost();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void onCommitRemoteHost();
                    }
                  }}
                  aria-label={t("codex.remoteBackendHost")}
                />
                <input
                  type="password"
                  className="settings-input settings-input--compact"
                  value={remoteTokenDraft}
                  placeholder={t("codex.mobileSetupTokenPlaceholder")}
                  onChange={(event) => onSetRemoteTokenDraft(event.target.value)}
                  onBlur={() => {
                    void onCommitRemoteToken();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void onCommitRemoteToken();
                    }
                  }}
                  aria-label={t("codex.remoteBackendToken")}
                />
              </div>
              <div className="settings-help">
                {isMobileSimplified
                  ? t("codex.mobileSetupTcpHint")
                  : t("codex.remoteBackendHelp")}
              </div>
            </div>

            {isMobileSimplified && (
              <div className="settings-field">
                <div className="settings-field-label">{t("codex.connectTest")}</div>
                <div className="settings-field-row">
                  <button
                    type="button"
                    className="button settings-button-compact"
                    onClick={onMobileConnectTest}
                    disabled={mobileConnectBusy}
                  >
                    {mobileConnectBusy ? t("codex.mobileSetupConnecting") : t("codex.mobileSetupConnectTest")}
                  </button>
                </div>
                {mobileConnectStatusText && (
                  <div
                    className={`settings-help${mobileConnectStatusError ? " settings-help-error" : ""}`}
                  >
                    {mobileConnectStatusText}
                  </div>
                )}
                <div className="settings-help">
                  {t("codex.mobileSetupTcpHint")}
                </div>
              </div>
            )}

            {!isMobileSimplified && (
              <div className="settings-field">
                <div className="settings-field-label">{t("codex.mobileAccessDaemon")}</div>
                <div className="settings-field-row">
                  <button
                    type="button"
                    className="button settings-button-compact"
                    onClick={() => {
                      void onTcpDaemonStart();
                    }}
                    disabled={tcpDaemonBusyAction !== null}
                  >
                    {tcpDaemonBusyAction === "start" ? t("codex.starting") : t("codex.startDaemon")}
                  </button>
                  <button
                    type="button"
                    className="button settings-button-compact"
                    onClick={() => {
                      void onTcpDaemonStop();
                    }}
                    disabled={tcpDaemonBusyAction !== null}
                  >
                    {tcpDaemonBusyAction === "stop" ? t("codex.stopping") : t("codex.stopDaemon")}
                  </button>
                  <button
                    type="button"
                    className="button settings-button-compact"
                    onClick={() => {
                      void onTcpDaemonStatus();
                    }}
                    disabled={tcpDaemonBusyAction !== null}
                  >
                    {tcpDaemonBusyAction === "status" ? t("codex.refreshing") : t("codex.refreshDaemonStatus")}
                  </button>
                </div>
                {tcpRunnerStatusText && <div className="settings-help">{tcpRunnerStatusText}</div>}
                {tcpDaemonStatus?.startedAtMs && (
                  <div className="settings-help">
                    {t("codex.startedAt")}: {new Date(tcpDaemonStatus.startedAtMs).toLocaleString()}
                  </div>
                )}
                <div className="settings-help">
                  {t("codex.mobileAccessDaemonHelp")}
                </div>
              </div>
            )}

            {!isMobileSimplified && (
              <div className="settings-field">
                <div className="settings-field-label">{t("codex.tailscaleHelper")}</div>
                <div className="settings-field-row">
                  <button
                    type="button"
                    className="button settings-button-compact"
                    onClick={onRefreshTailscaleStatus}
                    disabled={tailscaleStatusBusy}
                  >
                    {tailscaleStatusBusy ? t("codex.mobileSetupChecking") : t("codex.detectTailscale")}
                  </button>
                  <button
                    type="button"
                    className="button settings-button-compact"
                    onClick={onRefreshTailscaleCommandPreview}
                    disabled={tailscaleCommandBusy}
                  >
                    {tailscaleCommandBusy ? t("codex.refreshing") : t("codex.refreshDaemonCommand")}
                  </button>
                  <button
                    type="button"
                    className="button settings-button-compact"
                    disabled={!tailscaleStatus?.suggestedRemoteHost}
                    onClick={() => {
                      void onUseSuggestedTailscaleHost();
                    }}
                  >
                    {t("codex.useSuggestedHost")}
                  </button>
                </div>
                {tailscaleStatusError && (
                  <div className="settings-help settings-help-error">{tailscaleStatusError}</div>
                )}
                {tailscaleStatus && (
                  <>
                    <div className="settings-help">{tailscaleStatus.message}</div>
                    <div className="settings-help">
                      {tailscaleStatus.installed
                        ? `${t("codex.version")}: ${tailscaleStatus.version ?? t("codex.unknown")}`
                        : t("codex.installTailscalePrompt")}
                    </div>
                    {tailscaleStatus.suggestedRemoteHost && (
                      <div className="settings-help">
                        {t("codex.suggestedRemoteHost")}: <code>{tailscaleStatus.suggestedRemoteHost}</code>
                      </div>
                    )}
                    {tailscaleStatus.tailnetName && (
                      <div className="settings-help">
                        {t("codex.tailnet")}: <code>{tailscaleStatus.tailnetName}</code>
                      </div>
                    )}
                  </>
                )}
                {tailscaleCommandError && (
                  <div className="settings-help settings-help-error">{tailscaleCommandError}</div>
                )}
                {tailscaleCommandPreview && (
                  <>
                    <div className="settings-help">
                      {t("codex.daemonCommandTemplate")}
                    </div>
                    <pre className="settings-command-preview">
                      <code>{tailscaleCommandPreview.command}</code>
                    </pre>
                    {!tailscaleCommandPreview.tokenConfigured && (
                      <div className="settings-help settings-help-error">
                        {t("codex.remoteTokenRequiredWarning")}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}

        {appSettings.remoteBackendProvider === "orbit" && (
          <>
            <div className="settings-field">
              <label className="settings-field-label" htmlFor="orbit-ws-url">
                {t("codex.orbitWebsocketUrl")}
              </label>
              <input
                id="orbit-ws-url"
                className="settings-input settings-input--compact"
                value={orbitWsUrlDraft}
                placeholder={t("codex.orbitWebsocketUrlPlaceholder")}
                onChange={(event) => onSetOrbitWsUrlDraft(event.target.value)}
                onBlur={() => {
                  void onCommitOrbitWsUrl();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void onCommitOrbitWsUrl();
                  }
                }}
                aria-label={t("codex.orbitWebsocketUrl")}
              />
            </div>

            {isMobileSimplified && (
              <>
                <div className="settings-field">
                  <label className="settings-field-label" htmlFor="orbit-token-mobile">
                    {t("codex.remoteBackendToken")}
                  </label>
                  <input
                    id="orbit-token-mobile"
                    type="password"
                    className="settings-input settings-input--compact"
                    value={remoteTokenDraft}
                    placeholder={t("codex.mobileSetupTokenPlaceholder")}
                    onChange={(event) => onSetRemoteTokenDraft(event.target.value)}
                    onBlur={() => {
                      void onCommitRemoteToken();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void onCommitRemoteToken();
                      }
                    }}
                    aria-label={t("codex.remoteBackendToken")}
                  />
                  <div className="settings-help">
                    {t("codex.mobileSetupOrbitHint")}
                  </div>
                </div>
                <div className="settings-field">
                  <div className="settings-field-label">{t("codex.connectTest")}</div>
                  <div className="settings-field-row">
                    <button
                      type="button"
                      className="button settings-button-compact"
                      onClick={onMobileConnectTest}
                      disabled={mobileConnectBusy}
                    >
                      {mobileConnectBusy ? t("codex.mobileSetupConnecting") : t("codex.mobileSetupConnectTest")}
                    </button>
                  </div>
                  {mobileConnectStatusText && (
                    <div
                      className={`settings-help${mobileConnectStatusError ? " settings-help-error" : ""}`}
                    >
                      {mobileConnectStatusText}
                    </div>
                  )}
                  <div className="settings-help">
                    {t("codex.mobileSetupOrbitHint")}
                  </div>
                </div>
              </>
            )}

            {!isMobileSimplified && (
              <>
                <div className="settings-field">
                  <label className="settings-field-label" htmlFor="orbit-auth-url">
                    {t("codex.orbitAuthUrl")}
                  </label>
                  <input
                    id="orbit-auth-url"
                    className="settings-input settings-input--compact"
                    value={orbitAuthUrlDraft}
                    placeholder={t("codex.orbitAuthUrlPlaceholder")}
                    onChange={(event) => onSetOrbitAuthUrlDraft(event.target.value)}
                    onBlur={() => {
                      void onCommitOrbitAuthUrl();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void onCommitOrbitAuthUrl();
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
                    onChange={(event) => onSetOrbitRunnerNameDraft(event.target.value)}
                    onBlur={() => {
                      void onCommitOrbitRunnerName();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void onCommitOrbitRunnerName();
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
                    className={`settings-toggle ${appSettings.orbitAutoStartRunner ? "on" : ""}`}
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
                  <label className="settings-field-label" htmlFor="orbit-access-client-id">
                    {t("codex.orbitAccessClientId")}
                  </label>
                  <input
                    id="orbit-access-client-id"
                    className="settings-input settings-input--compact"
                    value={orbitAccessClientIdDraft}
                    placeholder={t("codex.orbitAccessClientIdPlaceholder")}
                    disabled={!appSettings.orbitUseAccess}
                    onChange={(event) => onSetOrbitAccessClientIdDraft(event.target.value)}
                    onBlur={() => {
                      void onCommitOrbitAccessClientId();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void onCommitOrbitAccessClientId();
                      }
                    }}
                    aria-label={t("codex.orbitAccessClientId")}
                  />
                </div>

                <div className="settings-field">
                  <label className="settings-field-label" htmlFor="orbit-access-client-secret-ref">
                    {t("codex.orbitAccessClientSecretRef")}
                  </label>
                  <input
                    id="orbit-access-client-secret-ref"
                    className="settings-input settings-input--compact"
                    value={orbitAccessClientSecretRefDraft}
                    placeholder={t("codex.orbitAccessClientSecretRefPlaceholder")}
                    disabled={!appSettings.orbitUseAccess}
                    onChange={(event) => onSetOrbitAccessClientSecretRefDraft(event.target.value)}
                    onBlur={() => {
                      void onCommitOrbitAccessClientSecretRef();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void onCommitOrbitAccessClientSecretRef();
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
                    onClick={onOrbitConnectTest}
                    disabled={orbitBusyAction !== null}
                  >
                      {orbitBusyAction === "connect-test" ? t("codex.testing") : t("codex.connectTest")}
                    </button>
                    <button
                      type="button"
                      className="button settings-button-compact"
                    onClick={onOrbitSignIn}
                    disabled={orbitBusyAction !== null}
                  >
                      {orbitBusyAction === "sign-in" ? t("codex.signingIn") : t("codex.signIn")}
                    </button>
                    <button
                      type="button"
                      className="button settings-button-compact"
                    onClick={onOrbitSignOut}
                    disabled={orbitBusyAction !== null}
                  >
                      {orbitBusyAction === "sign-out" ? t("codex.signingOut") : t("codex.signOut")}
                    </button>
                  </div>
                  <div className="settings-field-row">
                    <button
                      type="button"
                      className="button settings-button-compact"
                    onClick={onOrbitRunnerStart}
                    disabled={orbitBusyAction !== null}
                  >
                      {orbitBusyAction === "runner-start" ? t("codex.starting") : t("codex.startRunner")}
                    </button>
                    <button
                      type="button"
                      className="button settings-button-compact"
                    onClick={onOrbitRunnerStop}
                    disabled={orbitBusyAction !== null}
                  >
                      {orbitBusyAction === "runner-stop" ? t("codex.stopping") : t("codex.stopRunner")}
                    </button>
                    <button
                      type="button"
                      className="button settings-button-compact"
                    onClick={onOrbitRunnerStatus}
                    disabled={orbitBusyAction !== null}
                  >
                      {orbitBusyAction === "runner-status" ? t("codex.refreshing") : t("codex.refreshStatus")}
                    </button>
                  </div>
                  {orbitStatusText && <div className="settings-help">{orbitStatusText}</div>}
                  {orbitAuthCode && (
                    <div className="settings-help">
                      {t("codex.authCode")}: <code>{orbitAuthCode}</code>
                    </div>
                  )}
                  {orbitVerificationUrl && (
                    <div className="settings-help">
                      {t("codex.verificationUrl")}:{" "}
                      <a href={orbitVerificationUrl} target="_blank" rel="noreferrer">
                        {orbitVerificationUrl}
                      </a>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </>

      <div className="settings-help">
        {isMobileSimplified
          ? appSettings.remoteBackendProvider === "tcp"
            ? t("codex.selfHostWarningTcpMobile")
            : t("codex.selfHostWarningOrbitMobile")
          : t("codex.selfHostWarningDesktop")}
      </div>
    </section>
  );
}

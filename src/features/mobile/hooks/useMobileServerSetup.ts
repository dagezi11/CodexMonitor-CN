import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { listWorkspaces } from "../../../services/tauri";
import type { AppSettings } from "../../../types";
import { isMobilePlatform } from "../../../utils/platformPaths";
import type { MobileServerSetupWizardProps } from "../components/MobileServerSetupWizard";

type UseMobileServerSetupParams = {
  appSettings: AppSettings;
  appSettingsLoading: boolean;
  queueSaveSettings: (next: AppSettings) => Promise<AppSettings>;
  refreshWorkspaces: () => Promise<unknown>;
};

type UseMobileServerSetupResult = {
  isMobileRuntime: boolean;
  showMobileSetupWizard: boolean;
  mobileSetupWizardProps: MobileServerSetupWizardProps;
  handleMobileConnectSuccess: () => Promise<void>;
};

function isRemoteServerConfigured(settings: AppSettings): boolean {
  const tokenConfigured = Boolean(settings.remoteBackendToken?.trim());
  if (!tokenConfigured) {
    return false;
  }
  if (settings.remoteBackendProvider === "orbit") {
    return Boolean(settings.orbitWsUrl?.trim());
  }
  return Boolean(settings.remoteBackendHost.trim());
}

function defaultMobileSetupMessage(
  provider: AppSettings["remoteBackendProvider"],
  translate: (key: string) => string,
): string {
  if (provider === "orbit") {
    return translate("settings.codex.mobileSetupDefaultMessageOrbit");
  }
  return translate("settings.codex.mobileSetupDefaultMessageTcp");
}

export function useMobileServerSetup({
  appSettings,
  appSettingsLoading,
  queueSaveSettings,
  refreshWorkspaces,
}: UseMobileServerSetupParams): UseMobileServerSetupResult {
  const { t } = useTranslation();
  const isMobileRuntime = useMemo(() => isMobilePlatform(), []);

  const [providerDraft, setProviderDraft] = useState<AppSettings["remoteBackendProvider"]>(
    appSettings.remoteBackendProvider,
  );
  const [remoteHostDraft, setRemoteHostDraft] = useState(appSettings.remoteBackendHost);
  const [orbitWsUrlDraft, setOrbitWsUrlDraft] = useState(appSettings.orbitWsUrl ?? "");
  const [remoteTokenDraft, setRemoteTokenDraft] = useState(appSettings.remoteBackendToken ?? "");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState(false);
  const [mobileServerReady, setMobileServerReady] = useState(!isMobileRuntime);

  useEffect(() => {
    if (!isMobileRuntime) {
      return;
    }
    setProviderDraft(appSettings.remoteBackendProvider);
    setRemoteHostDraft(appSettings.remoteBackendHost);
    setOrbitWsUrlDraft(appSettings.orbitWsUrl ?? "");
    setRemoteTokenDraft(appSettings.remoteBackendToken ?? "");
  }, [
    appSettings.orbitWsUrl,
    appSettings.remoteBackendHost,
    appSettings.remoteBackendProvider,
    appSettings.remoteBackendToken,
    isMobileRuntime,
  ]);

  const runConnectivityCheck = useCallback(
    async (options?: { announceSuccess?: boolean }) => {
      if (!isMobileRuntime) {
        return true;
      }
      try {
        const entries = await listWorkspaces();
        try {
          await refreshWorkspaces();
        } catch {
          // Connectivity is confirmed by listWorkspaces; refresh is best-effort.
        }
        setMobileServerReady(true);
        setStatusError(false);
        if (options?.announceSuccess) {
          setStatusMessage(
            t("settings.codex.mobileSetupConnectedCount", {
              count: entries.length,
            }),
          );
        } else {
          setStatusMessage(null);
        }
        return true;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : t("settings.codex.mobileSetupReachBackendError");
        setMobileServerReady(false);
        setStatusError(true);
        setStatusMessage(message);
        return false;
      }
    },
    [isMobileRuntime, refreshWorkspaces, t],
  );

  const onConnectTest = useCallback(() => {
    void (async () => {
      if (!isMobileRuntime || busy) {
        return;
      }

      const nextProvider = providerDraft;
      const nextHost = remoteHostDraft.trim();
      const nextToken = remoteTokenDraft.trim() ? remoteTokenDraft.trim() : null;
      const nextOrbitWsUrl = orbitWsUrlDraft.trim() ? orbitWsUrlDraft.trim() : null;
      const missingEndpoint = nextProvider === "orbit" ? !nextOrbitWsUrl : !nextHost.trim();

      if (missingEndpoint || !nextToken) {
        setMobileServerReady(false);
        setStatusError(true);
        setStatusMessage(defaultMobileSetupMessage(nextProvider, t));
        return;
      }

      setBusy(true);
      setStatusError(false);
      setStatusMessage(null);
      try {
        await queueSaveSettings({
          ...appSettings,
          backendMode: "remote",
          remoteBackendProvider: nextProvider,
          remoteBackendHost: nextHost,
          remoteBackendToken: nextToken,
          orbitWsUrl: nextOrbitWsUrl,
        });
        await runConnectivityCheck({ announceSuccess: true });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : t("settings.codex.mobileSetupSaveSettingsError");
        setMobileServerReady(false);
        setStatusError(true);
        setStatusMessage(message);
      } finally {
        setBusy(false);
      }
    })();
  }, [
    appSettings,
    busy,
    isMobileRuntime,
    orbitWsUrlDraft,
    providerDraft,
    queueSaveSettings,
    remoteHostDraft,
    remoteTokenDraft,
    runConnectivityCheck,
    t,
  ]);

  useEffect(() => {
    if (!isMobileRuntime || appSettingsLoading || busy) {
      return;
    }
    if (!isRemoteServerConfigured(appSettings)) {
      setMobileServerReady(false);
      setChecking(false);
      setStatusError(true);
      setStatusMessage(defaultMobileSetupMessage(appSettings.remoteBackendProvider, t));
      return;
    }

    let active = true;
    setChecking(true);

    void (async () => {
      const ok = await runConnectivityCheck();
      if (active && !ok) {
        setStatusMessage(
          (previous) => previous ?? t("settings.codex.mobileSetupConnectFallback"),
        );
      }
      if (active) {
        setChecking(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [
    appSettings,
    appSettingsLoading,
    busy,
    isMobileRuntime,
    runConnectivityCheck,
    t,
  ]);

  const handleMobileConnectSuccess = useCallback(async () => {
    if (!isMobileRuntime) {
      return;
    }
    setStatusError(false);
    setStatusMessage(null);
    setMobileServerReady(true);
    try {
      await refreshWorkspaces();
    } catch {
      // Keep successful connectivity result even if local refresh fails.
    }
  }, [isMobileRuntime, refreshWorkspaces]);

  return {
    isMobileRuntime,
    showMobileSetupWizard: isMobileRuntime && !appSettingsLoading && !mobileServerReady,
    mobileSetupWizardProps: {
      provider: providerDraft,
      remoteHostDraft,
      orbitWsUrlDraft,
      remoteTokenDraft,
      busy,
      checking,
      statusMessage,
      statusError,
      onProviderChange: setProviderDraft,
      onRemoteHostChange: setRemoteHostDraft,
      onOrbitWsUrlChange: setOrbitWsUrlDraft,
      onRemoteTokenChange: setRemoteTokenDraft,
      onConnectTest,
    },
    handleMobileConnectSuccess,
  };
}

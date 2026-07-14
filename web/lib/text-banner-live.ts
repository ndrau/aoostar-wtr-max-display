import { appendLog } from "./logger";
import { DEVICE } from "./paths";
import {
  acquireSensorCollector,
  releaseSensorCollector,
} from "./sensor-collector";
import { loadAllSensorValues } from "./sensor-sources";
import {
  needsTextBannerLiveRefresh,
  shouldShowCornerSensors,
} from "./sensor-fields";
import { generateTextBannerImage } from "./text-banner";
import { runAsterctlDirect } from "./asterctl-runner";
import type { TextBannerSettings } from "./types";

const REFRESH_MS = 3_000;

let refreshTimer: NodeJS.Timeout | null = null;
let activeSettings: TextBannerSettings | null = null;
let sensorCollectorActive = false;

export function isTextBannerLiveRunning(): boolean {
  return refreshTimer !== null;
}

async function refreshTextBanner(): Promise<void> {
  if (!activeSettings) {
    return;
  }

  const snapshot = shouldShowCornerSensors(activeSettings)
    ? await loadAllSensorValues()
    : {};
  const imagePath = await generateTextBannerImage(
    activeSettings,
    snapshot,
  );
  await runAsterctlDirect(["--device", DEVICE, "--image", imagePath]);
}

export async function startTextBannerLive(
  settings: TextBannerSettings,
): Promise<void> {
  await stopTextBannerLive();

  if (!needsTextBannerLiveRefresh(settings)) {
    return;
  }

  activeSettings = settings;

  if (shouldShowCornerSensors(settings)) {
    await acquireSensorCollector("text-banner");
    sensorCollectorActive = true;
  }

  await appendLog(
    "info",
    "text-banner",
    "Started live text banner updates",
    settings.showClock ? "clock" : "corners",
  );

  try {
    await refreshTextBanner();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await appendLog("error", "text-banner", "Initial refresh failed", message);
  }

  refreshTimer = setInterval(() => {
    refreshTextBanner().catch((error) => {
      const message = error instanceof Error ? error.message : "Unknown error";
      void appendLog("error", "text-banner", "Refresh failed", message);
    });
  }, REFRESH_MS);
}

export async function stopTextBannerLive(): Promise<void> {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }

  activeSettings = null;

  if (sensorCollectorActive) {
    await releaseSensorCollector("text-banner");
    sensorCollectorActive = false;
  }
}

export function updateTextBannerLiveSettings(
  settings: TextBannerSettings,
): void {
  if (!refreshTimer) {
    return;
  }

  activeSettings = settings;
}

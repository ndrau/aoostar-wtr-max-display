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

const CORNER_REFRESH_MS = 3_000;
const CLOCK_REFRESH_MS = 1_000;
const STOP_WAIT_MS = 5_000;
const STOP_POLL_MS = 25;

function resolveRefreshMs(settings: TextBannerSettings): number {
  return settings.showClock ? CLOCK_REFRESH_MS : CORNER_REFRESH_MS;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let refreshTimer: NodeJS.Timeout | null = null;
let activeSettings: TextBannerSettings | null = null;
let sensorCollectorActive = false;
let refreshInFlight = false;
let liveGeneration = 0;

export function isTextBannerLiveRunning(): boolean {
  return refreshTimer !== null;
}

async function refreshTextBanner(): Promise<void> {
  if (!activeSettings || refreshInFlight) {
    return;
  }

  const generation = liveGeneration;
  const settings = activeSettings;
  refreshInFlight = true;

  try {
    const snapshot = shouldShowCornerSensors(settings)
      ? await loadAllSensorValues()
      : {};

    if (generation !== liveGeneration) {
      return;
    }

    const imagePath = await generateTextBannerImage(settings, snapshot);

    if (generation !== liveGeneration) {
      return;
    }

    await runAsterctlDirect(["--device", DEVICE, "--image", imagePath]);
  } finally {
    refreshInFlight = false;
  }
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
  }, resolveRefreshMs(settings));
}

export async function stopTextBannerLive(): Promise<void> {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }

  liveGeneration += 1;
  activeSettings = null;

  const started = Date.now();
  while (refreshInFlight && Date.now() - started < STOP_WAIT_MS) {
    await sleep(STOP_POLL_MS);
  }

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

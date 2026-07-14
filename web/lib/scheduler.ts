import { applyConfig } from "./display";
import { appendLog } from "./logger";
import { readConfig } from "./config";
import { stopTextBannerLive } from "./text-banner-live";
import {
  isWithinDisplayWindow,
  resolveScheduledDisplayConfig,
} from "./schedule-helpers";
import type { DisplayConfig } from "./types";

let lastAppliedState: "on-window" | "off-window" | null = null;

async function applyScheduledState(config: DisplayConfig): Promise<void> {
  const activeConfig = resolveScheduledDisplayConfig(config);
  await stopTextBannerLive();
  await applyConfig(activeConfig);
}

export async function applyConfigForSave(config: DisplayConfig): Promise<void> {
  if (!config.schedule.enabled) {
    lastAppliedState = null;
    await stopTextBannerLive();
    await applyConfig(config);
    return;
  }

  const nextState = isWithinDisplayWindow(config) ? "on-window" : "off-window";
  lastAppliedState = nextState;
  await applyScheduledState(config);
}

export async function runScheduledCheck(): Promise<void> {
  const config = await readConfig();

  if (!config.schedule.enabled) {
    if (lastAppliedState === "off-window") {
      await appendLog(
        "info",
        "scheduler",
        "Timer disabled, restoring configured display mode",
        config.displayMode,
      );
      lastAppliedState = null;
      await stopTextBannerLive();
      await applyConfig(config);
    } else {
      lastAppliedState = null;
    }
    return;
  }

  const shouldDisplay = isWithinDisplayWindow(config);
  const nextState = shouldDisplay ? "on-window" : "off-window";

  if (lastAppliedState === nextState) {
    return;
  }

  if (shouldDisplay) {
    await appendLog(
      "info",
      "scheduler",
      "Timer window active, turning display on",
      `on ${config.schedule.displayOnTime}, off ${config.schedule.displayOffTime}`,
    );
  } else {
    await appendLog(
      "info",
      "scheduler",
      "Timer window inactive, turning display off",
      `on ${config.schedule.displayOnTime}, off ${config.schedule.displayOffTime}`,
    );
  }

  lastAppliedState = nextState;
  await applyScheduledState(config);
}

function scheduleAlignedTicks(run: () => void): void {
  const now = new Date();
  const msUntilNextMinute =
    (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

  setTimeout(() => {
    run();
    setInterval(run, 60_000);
  }, Math.max(0, msUntilNextMinute));
}

export function startScheduler(): void {
  void appendLog("info", "scheduler", "Scheduler started");

  const tick = () => {
    runScheduledCheck().catch((error) => {
      const message = error instanceof Error ? error.message : "Unknown error";
      void appendLog("error", "scheduler", "Scheduler tick failed", message);
    });
  };

  scheduleAlignedTicks(tick);
}

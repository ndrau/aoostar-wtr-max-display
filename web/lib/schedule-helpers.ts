import type { DisplayConfig } from "./types";
import { isValidTime } from "./validation";

function parseTimeToMinutes(value: string): number | null {
  if (!isValidTime(value)) {
    return null;
  }

  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function getCurrentMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function isWithinDisplayWindow(
  config: DisplayConfig,
  now = new Date(),
): boolean {
  const current = getCurrentMinutes(now);
  const onAt = parseTimeToMinutes(config.schedule.displayOnTime);
  const offAt = parseTimeToMinutes(config.schedule.displayOffTime);

  if (onAt === null || offAt === null) {
    return true;
  }

  if (onAt === offAt) {
    return true;
  }

  if (onAt < offAt) {
    return current >= onAt && current < offAt;
  }

  return current >= onAt || current < offAt;
}

export function resolveScheduledDisplayConfig(
  config: DisplayConfig,
): DisplayConfig {
  if (!config.schedule.enabled || isWithinDisplayWindow(config)) {
    if (config.displayMode === "off") {
      return { ...config, displayMode: "truenas" };
    }
    return config;
  }

  return { ...config, displayMode: "off" };
}

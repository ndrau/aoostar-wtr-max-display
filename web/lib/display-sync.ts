import { readConfig } from "./config";
import { applyConfig } from "./display";

export async function syncDisplayFromConfig(): Promise<void> {
  const config = await readConfig();

  if (config.schedule.enabled) {
    return;
  }

  if (config.displayMode === "sensors" || config.displayMode === "text") {
    await applyConfig(config);
  }
}

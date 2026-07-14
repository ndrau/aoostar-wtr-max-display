import { mkdir, readFile, writeFile } from "fs/promises";
import { CONFIG_PATH, DATA_DIR, UPLOAD_DIR } from "./paths";
import { DEFAULT_CONFIG, DEFAULT_TEXT_BANNER, type DisplayConfig, type DisplayMode } from "./types";

async function ensureDataDir() {
  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(UPLOAD_DIR, { recursive: true });
}

function normalizeDisplayMode(value: unknown): DisplayMode | undefined {
  if (value === "original") {
    return "sensors";
  }

  if (
    value === "truenas" ||
    value === "sensors" ||
    value === "text" ||
    value === "custom" ||
    value === "off"
  ) {
    return value;
  }

  return undefined;
}

export function mergeConfig(parsed: Partial<DisplayConfig>): DisplayConfig {
  const displayMode = normalizeDisplayMode(parsed.displayMode);

  return {
    ...DEFAULT_CONFIG,
    ...parsed,
    ...(displayMode ? { displayMode } : {}),
    textBanner: {
      ...DEFAULT_TEXT_BANNER,
      ...parsed.textBanner,
      corners: {
        ...DEFAULT_TEXT_BANNER.corners,
        ...parsed.textBanner?.corners,
      },
    },
    schedule: {
      ...DEFAULT_CONFIG.schedule,
      ...parsed.schedule,
    },
  };
}

export async function readConfig(): Promise<DisplayConfig> {
  await ensureDataDir();

  try {
    const raw = await readFile(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<DisplayConfig>;
    return mergeConfig(parsed);
  } catch {
    await writeConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }
}

export async function writeConfig(config: DisplayConfig): Promise<void> {
  await ensureDataDir();
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
}

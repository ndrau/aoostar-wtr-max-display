import path from "path";
import type { DisplayConfig, DisplayMode, TextBannerSettings } from "./types";
import { DEFAULT_TEXT_BANNER } from "./types";
import {
  TEXT_BANNER_FONT_DEFAULT,
  TEXT_BANNER_FONT_MAX,
  TEXT_BANNER_FONT_MIN,
} from "./text-banner-font";
import {
  DEFAULT_TEXT_BANNER_CORNERS,
  isSensorFieldId,
  type BannerCorner,
  type TextBannerCorners,
} from "./sensor-fields";
import { UPLOAD_DIR } from "./paths";

const DISPLAY_MODES: DisplayMode[] = [
  "truenas",
  "sensors",
  "text",
  "custom",
  "off",
];
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

export function isDisplayMode(value: unknown): value is DisplayMode {
  return typeof value === "string" && DISPLAY_MODES.includes(value as DisplayMode);
}

export function isValidTime(value: unknown): value is string {
  return typeof value === "string" && TIME_PATTERN.test(value);
}

function normalizeFontSize(value: unknown): number {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : TEXT_BANNER_FONT_DEFAULT;

  if (Number.isNaN(numeric)) {
    return TEXT_BANNER_FONT_DEFAULT;
  }

  return Math.min(
    TEXT_BANNER_FONT_MAX,
    Math.max(TEXT_BANNER_FONT_MIN, Math.round(numeric)),
  );
}

export function isValidHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR_PATTERN.test(value);
}

function mergeTextBannerCorners(
  input: Partial<TextBannerCorners> | undefined,
  fallback: TextBannerCorners = DEFAULT_TEXT_BANNER_CORNERS,
): TextBannerCorners {
  const corners: BannerCorner[] = [
    "topLeft",
    "topRight",
    "bottomLeft",
    "bottomRight",
  ];

  const result = { ...fallback };

  for (const corner of corners) {
    const value = input?.[corner] ?? fallback[corner];
    result[corner] = isSensorFieldId(value) ? value : fallback[corner];
  }

  return result;
}

export function validateTextBannerCorners(
  input: Partial<TextBannerCorners> | undefined,
  fallback: TextBannerCorners = DEFAULT_TEXT_BANNER_CORNERS,
): TextBannerCorners {
  const corners: BannerCorner[] = [
    "topLeft",
    "topRight",
    "bottomLeft",
    "bottomRight",
  ];

  const result = { ...fallback };

  for (const corner of corners) {
    const value = input?.[corner] ?? fallback[corner];
    if (!isSensorFieldId(value)) {
      throw new Error(`Invalid sensor selection for ${corner}`);
    }
    result[corner] = value;
  }

  return result;
}

export function validateTextBanner(
  input: Partial<TextBannerSettings> | undefined,
  fallback: TextBannerSettings = DEFAULT_TEXT_BANNER,
): TextBannerSettings {
  const text = (input?.text ?? fallback.text).trim();

  if (!text) {
    throw new Error("Text banner requires at least one character");
  }

  if (text.length > 80) {
    throw new Error("Text banner supports up to 80 characters");
  }

  const textColor = input?.textColor ?? fallback.textColor;
  const backgroundColor = input?.backgroundColor ?? fallback.backgroundColor;
  const cornerColor = input?.cornerColor ?? fallback.cornerColor;

  if (
    !isValidHexColor(textColor) ||
    !isValidHexColor(backgroundColor) ||
    !isValidHexColor(cornerColor)
  ) {
    throw new Error("Colors must be hex values like #0b1220");
  }

  return {
    text,
    textColor: textColor.toLowerCase(),
    backgroundColor: backgroundColor.toLowerCase(),
    cornerColor: cornerColor.toLowerCase(),
    showCornerSensors: input?.showCornerSensors ?? fallback.showCornerSensors,
    showClock: input?.showClock ?? fallback.showClock,
    fontSizeAuto: input?.fontSizeAuto ?? fallback.fontSizeAuto,
    fontSize: normalizeFontSize(input?.fontSize ?? fallback.fontSize),
    corners: validateTextBannerCorners(input?.corners, fallback.corners),
  };
}

function mergeTextBanner(
  input: Partial<TextBannerSettings> | undefined,
  strict: boolean,
): TextBannerSettings {
  const raw = {
    ...DEFAULT_TEXT_BANNER,
    ...input,
    corners: {
      ...DEFAULT_TEXT_BANNER_CORNERS,
      ...input?.corners,
    },
  };

  if (strict) {
    return validateTextBanner(raw, DEFAULT_TEXT_BANNER);
  }

  return {
    text: raw.text.slice(0, 80),
    textColor: isValidHexColor(raw.textColor)
      ? raw.textColor.toLowerCase()
      : DEFAULT_TEXT_BANNER.textColor,
    backgroundColor: isValidHexColor(raw.backgroundColor)
      ? raw.backgroundColor.toLowerCase()
      : DEFAULT_TEXT_BANNER.backgroundColor,
    cornerColor: isValidHexColor(raw.cornerColor)
      ? raw.cornerColor.toLowerCase()
      : DEFAULT_TEXT_BANNER.cornerColor,
    showCornerSensors:
      typeof raw.showCornerSensors === "boolean"
        ? raw.showCornerSensors
        : DEFAULT_TEXT_BANNER.showCornerSensors,
    showClock:
      typeof raw.showClock === "boolean"
        ? raw.showClock
        : DEFAULT_TEXT_BANNER.showClock,
    fontSizeAuto:
      typeof raw.fontSizeAuto === "boolean"
        ? raw.fontSizeAuto
        : DEFAULT_TEXT_BANNER.fontSizeAuto,
    fontSize: normalizeFontSize(raw.fontSize),
    corners: mergeTextBannerCorners(raw.corners, DEFAULT_TEXT_BANNER_CORNERS),
  };
}

export function sanitizeCustomImagePath(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  const resolved = path.resolve(value);
  const uploadRoot = path.resolve(UPLOAD_DIR);

  if (!resolved.startsWith(`${uploadRoot}${path.sep}`) && resolved !== uploadRoot) {
    throw new Error("Custom image path must stay inside the uploads directory");
  }

  return resolved;
}

export function validateConfig(input: Partial<DisplayConfig>): DisplayConfig {
  if (input.displayMode !== undefined && !isDisplayMode(input.displayMode)) {
    throw new Error("Invalid display mode");
  }

  const schedule = input.schedule;
  if (schedule) {
    if (
      schedule.displayOnTime !== undefined &&
      !isValidTime(schedule.displayOnTime)
    ) {
      throw new Error("Invalid display on time");
    }

    if (
      schedule.displayOffTime !== undefined &&
      !isValidTime(schedule.displayOffTime)
    ) {
      throw new Error("Invalid display off time");
    }
  }

  const displayMode = input.displayMode ?? "truenas";
  let customImagePath: string | null = null;
  let textBanner: TextBannerSettings;

  if (displayMode === "text") {
    textBanner = mergeTextBanner(input.textBanner, true);
  } else {
    textBanner = mergeTextBanner(input.textBanner, false);
  }

  if (displayMode === "custom") {
    customImagePath = sanitizeCustomImagePath(input.customImagePath ?? null);
    if (!customImagePath) {
      throw new Error("Custom display mode requires an uploaded image");
    }
  }

  return {
    displayMode,
    customImagePath,
    textBanner,
    schedule: {
      enabled: schedule?.enabled ?? false,
      displayOnTime: schedule?.displayOnTime ?? "08:00",
      displayOffTime: schedule?.displayOffTime ?? "22:00",
    },
  };
}

export function validateUpload(file: File): void {
  if (file.size <= 0) {
    throw new Error("Uploaded file is empty");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Uploaded file exceeds the 10 MB limit");
  }

  const extension = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error("Only PNG, JPG, JPEG, and WEBP uploads are allowed");
  }
}

export function getUploadExtension(fileName: string): string {
  const extension = path.extname(fileName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error("Unsupported file extension");
  }

  return extension;
}

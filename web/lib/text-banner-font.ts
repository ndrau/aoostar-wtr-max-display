import type { TextBannerSettings } from "./types";

export const TEXT_BANNER_FONT_MIN = 24;
export const TEXT_BANNER_FONT_MAX = 140;
export const TEXT_BANNER_FONT_DEFAULT = 64;
const MAX_TEXT_LENGTH = 80;

function estimateFontSize(text: string, lineCount: number): number {
  const longestLine = text
    .split("\n")
    .reduce((max, line) => Math.max(max, line.trim().length), 0);

  const lengthFactor =
    longestLine <= 6
      ? 108
      : longestLine <= 10
        ? 88
        : longestLine <= 16
          ? 68
          : longestLine <= 24
            ? 52
            : longestLine <= 36
              ? 40
              : 32;

  return Math.max(28, Math.floor(lengthFactor / Math.max(1, lineCount * 0.85)));
}

function clampFontSize(value: number): number {
  return Math.min(
    TEXT_BANNER_FONT_MAX,
    Math.max(TEXT_BANNER_FONT_MIN, Math.round(value)),
  );
}

export function resolveBannerFontSize(settings: TextBannerSettings): number {
  if (settings.fontSizeAuto) {
    const text = settings.text.trim().slice(0, MAX_TEXT_LENGTH);
    const lineCount = Math.max(1, text.split("\n").length);
    return estimateFontSize(text, lineCount);
  }

  return clampFontSize(settings.fontSize);
}

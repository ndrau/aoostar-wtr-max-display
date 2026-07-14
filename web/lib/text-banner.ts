import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import {
  formatCornerLabel,
  type BannerCorner,
} from "./sensor-fields";
import { TEXT_BANNER_PATH, UPLOAD_DIR } from "./paths";
import { resolveBannerFontSize } from "./text-banner-font";
import type { TextBannerSettings } from "./types";

export const DISPLAY_WIDTH = 960;
export const DISPLAY_HEIGHT = 376;
const MAX_TEXT_LENGTH = 80;

export {
  TEXT_BANNER_FONT_DEFAULT,
  TEXT_BANNER_FONT_MAX,
  TEXT_BANNER_FONT_MIN,
} from "./text-banner-font";

const FONT_FAMILY = "DejaVu Sans, Liberation Sans, sans-serif";
const CORNER_FONT_SIZE = 22;
const CORNER_PADDING_X = 20;
const CORNER_PADDING_Y = 28;

const CORNER_LAYOUT: Record<
  BannerCorner,
  { x: number; y: number; anchor: "start" | "end" }
> = {
  topLeft: { x: CORNER_PADDING_X, y: CORNER_PADDING_Y, anchor: "start" },
  topRight: {
    x: DISPLAY_WIDTH - CORNER_PADDING_X,
    y: CORNER_PADDING_Y,
    anchor: "end",
  },
  bottomLeft: {
    x: CORNER_PADDING_X,
    y: DISPLAY_HEIGHT - CORNER_PADDING_Y,
    anchor: "start",
  },
  bottomRight: {
    x: DISPLAY_WIDTH - CORNER_PADDING_X,
    y: DISPLAY_HEIGHT - CORNER_PADDING_Y,
    anchor: "end",
  },
};

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function buildTextElements(text: string, fontSize: number): string {
  const lines = text.split("\n").map((line) => line.trimEnd());
  const lineHeight = fontSize * 1.2;
  const totalHeight = lineHeight * lines.length;
  const startY = DISPLAY_HEIGHT / 2 - totalHeight / 2 + fontSize * 0.82;

  return lines
    .map((line, index) => {
      const y = startY + index * lineHeight;
      return `<tspan x="50%" y="${y}">${escapeXml(line)}</tspan>`;
    })
    .join("");
}

function buildCornerElements(
  settings: TextBannerSettings,
  sensorValues: Record<string, string>,
): string {
  if (!settings.showCornerSensors) {
    return "";
  }

  return (Object.keys(CORNER_LAYOUT) as BannerCorner[])
    .map((corner) => {
      const fieldId = settings.corners[corner];
      const label = formatCornerLabel(fieldId, sensorValues);
      if (!label) {
        return "";
      }

      const layout = CORNER_LAYOUT[corner];
      return `<text
        x="${layout.x}"
        y="${layout.y}"
        fill="${settings.cornerColor}"
        font-family="${FONT_FAMILY}"
        font-size="${CORNER_FONT_SIZE}"
        font-weight="600"
        text-anchor="${layout.anchor}"
      >${escapeXml(label)}</text>`;
    })
    .join("\n");
}

export function buildTextBannerSvg(
  settings: TextBannerSettings,
  sensorValues: Record<string, string> = {},
): string {
  const text = settings.text.trim().slice(0, MAX_TEXT_LENGTH);
  const fontSize = resolveBannerFontSize(settings);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${DISPLAY_WIDTH}" height="${DISPLAY_HEIGHT}" viewBox="0 0 ${DISPLAY_WIDTH} ${DISPLAY_HEIGHT}">
  <rect width="100%" height="100%" fill="${settings.backgroundColor}" />
  <text
    text-anchor="middle"
    fill="${settings.textColor}"
    font-family="${FONT_FAMILY}"
    font-size="${fontSize}"
    font-weight="700"
  >
    ${buildTextElements(text, fontSize)}
  </text>
  ${buildCornerElements(settings, sensorValues)}
</svg>`;
}

export async function generateTextBannerImage(
  settings: TextBannerSettings,
  sensorValues: Record<string, string> = {},
  outputPath: string = TEXT_BANNER_PATH,
): Promise<string> {
  const resolved = path.resolve(outputPath);
  const uploadRoot = path.resolve(UPLOAD_DIR);

  if (
    !resolved.startsWith(`${uploadRoot}${path.sep}`) &&
    resolved !== uploadRoot
  ) {
    throw new Error("Text banner image must stay inside uploads directory");
  }

  await mkdir(uploadRoot, { recursive: true });

  const svg = buildTextBannerSvg(settings, sensorValues);
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  await writeFile(resolved, png);

  return resolved;
}

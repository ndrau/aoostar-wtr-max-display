import type {
  BannerCorner,
  SensorFieldId,
  TextBannerCorners,
} from "./sensor-fields";
import {
  DEFAULT_TEXT_BANNER_CORNERS,
} from "./sensor-fields";

export type DisplayMode = "truenas" | "sensors" | "text" | "custom" | "off";

export interface DisplaySchedule {
  enabled: boolean;
  displayOnTime: string;
  displayOffTime: string;
}

export interface TextBannerSettings {
  text: string;
  textColor: string;
  backgroundColor: string;
  cornerColor: string;
  showCornerSensors: boolean;
  fontSizeAuto: boolean;
  fontSize: number;
  corners: TextBannerCorners;
}

export interface DisplayConfig {
  displayMode: DisplayMode;
  customImagePath: string | null;
  textBanner: TextBannerSettings;
  schedule: DisplaySchedule;
}

export type { BannerCorner, SensorFieldId, TextBannerCorners };

export const DEFAULT_TEXT_BANNER: TextBannerSettings = {
  text: "TrueNAS SCALE",
  textColor: "#e8eef8",
  backgroundColor: "#0b1220",
  cornerColor: "#9aa8c2",
  showCornerSensors: false,
  fontSizeAuto: true,
  fontSize: 64,
  corners: DEFAULT_TEXT_BANNER_CORNERS,
};

export const DEFAULT_CONFIG: DisplayConfig = {
  displayMode: "truenas",
  customImagePath: null,
  textBanner: DEFAULT_TEXT_BANNER,
  schedule: {
    enabled: false,
    displayOnTime: "08:00",
    displayOffTime: "22:00",
  },
};

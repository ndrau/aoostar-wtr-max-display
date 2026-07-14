"use client";

import { useEffect, useState } from "react";
import { formatCornerLabel } from "@/lib/sensor-fields";
import { getModeMeta } from "@/lib/mode-meta";
import { formatBannerClock } from "@/lib/format";
import { resolveBannerFontSize } from "@/lib/text-banner-font";
import type { DisplayConfig } from "@/lib/types";

export function DisplayPreview({
  config,
  sensorValues,
  panelRunning,
}: {
  config: DisplayConfig;
  sensorValues: Record<string, string>;
  panelRunning: boolean;
}) {
  const mode = getModeMeta(config.displayMode);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (config.displayMode !== "text" || !config.textBanner.showClock) {
      return;
    }

    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, [config.displayMode, config.textBanner.showClock]);

  if (config.displayMode === "text") {
    const corners = [
      ["corner-top-left", "topLeft"],
      ["corner-top-right", "topRight"],
      ["corner-bottom-left", "bottomLeft"],
      ["corner-bottom-right", "bottomRight"],
    ] as const;

    const bannerFontSize = resolveBannerFontSize(config.textBanner);

    return (
      <div className="preview-shell">
        <div className="preview-meta">
          <span className="preview-label">Vorschau · 960×376</span>
          <span className="pill pill-muted">{mode.title}</span>
        </div>
        <div
          className="display-frame text-banner-preview"
          style={{
            backgroundColor: config.textBanner.backgroundColor,
            color: config.textBanner.textColor,
            containerType: "inline-size",
          }}
        >
          {config.textBanner.showClock ? (
            <span
              className="text-banner-clock"
              style={{ color: config.textBanner.cornerColor }}
            >
              {formatBannerClock(now)}
            </span>
          ) : null}
          {config.textBanner.showCornerSensors
            ? corners.map(([className, corner]) => {
                const label = formatCornerLabel(
                  config.textBanner.corners[corner],
                  sensorValues,
                );
                if (!label) return null;

                return (
                  <span
                    key={corner}
                    className={`text-banner-corner ${className}`}
                    style={{ color: config.textBanner.cornerColor }}
                  >
                    {label}
                  </span>
                );
              })
            : null}
          <span
            className="text-banner-center"
            style={{
              fontSize: `calc(${bannerFontSize} / ${960} * 100cqw)`,
            }}
          >
            {config.textBanner.text.trim() || "Vorschau"}
          </span>
        </div>
      </div>
    );
  }

  const previewContent: Record<DisplayConfig["displayMode"], string> = {
    truenas: "TrueNAS SCALE",
    sensors: panelRunning ? "Live Dashboard aktiv" : "System-Dashboard",
    custom: "Eigenes Bild",
    off: "Display aus",
    text: "",
  };

  const previewClass =
    config.displayMode === "truenas"
      ? "preview-truenas"
      : config.displayMode === "sensors"
        ? "preview-sensors"
        : config.displayMode === "custom"
          ? "preview-custom"
          : config.displayMode === "off"
            ? "preview-off"
            : "preview-default";

  return (
    <div className="preview-shell">
      <div className="preview-meta">
        <span className="preview-label">Anzeige</span>
        <span className={`pill ${panelRunning ? "pill-accent" : "pill-muted"}`}>
          {mode.title}
        </span>
      </div>
      <div className={`display-frame display-frame-mock ${previewClass}`}>
        <span className="display-frame-title">{previewContent[config.displayMode]}</span>
        {config.displayMode === "sensors" ? (
          <span className="display-frame-sub">
            {panelRunning ? "Sensoren werden live aktualisiert" : "Nach Übernehmen starten"}
          </span>
        ) : null}
      </div>
    </div>
  );
}

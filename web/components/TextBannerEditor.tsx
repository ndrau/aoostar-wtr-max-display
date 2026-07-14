"use client";

import {
  BANNER_CORNER_LABELS,
  SENSOR_FIELD_GROUPS,
  type BannerCorner,
  type SensorFieldId,
} from "@/lib/sensor-fields";
import {
  TEXT_BANNER_FONT_MAX,
  TEXT_BANNER_FONT_MIN,
} from "@/lib/text-banner-font";
import type { TextBannerSettings } from "@/lib/types";

const COLOR_PRESETS = [
  {
    name: "TrueNAS",
    textColor: "#e8eef8",
    backgroundColor: "#0b1220",
    cornerColor: "#9aa8c2",
  },
  {
    name: "Hell",
    textColor: "#0b1220",
    backgroundColor: "#f4f7fb",
    cornerColor: "#526075",
  },
  {
    name: "Kontrast",
    textColor: "#00d4aa",
    backgroundColor: "#05070d",
    cornerColor: "#7ee7c6",
  },
] as const;

function normalizeHexColor(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  return fallback;
}

export function TextBannerEditor({
  textBanner,
  onChange,
}: {
  textBanner: TextBannerSettings;
  onChange: (next: TextBannerSettings) => void;
}) {
  function updateColor(
    key: "textColor" | "backgroundColor" | "cornerColor",
    value: string,
    fallback: string,
  ) {
    onChange({
      ...textBanner,
      [key]: normalizeHexColor(value, fallback),
    });
  }

  function updateCorner(corner: BannerCorner, value: SensorFieldId) {
    onChange({
      ...textBanner,
      corners: { ...textBanner.corners, [corner]: value },
    });
  }

  const showLiveAccentColor =
    textBanner.showCornerSensors || textBanner.showClock;
  const hasLiveRefresh =
    textBanner.showClock || textBanner.showCornerSensors;

  return (
    <div className="stack">
      <div className="field">
        <label htmlFor="banner-text">Schriftzug</label>
        <textarea
          id="banner-text"
          rows={2}
          maxLength={80}
          value={textBanner.text}
          placeholder="z. B. TrueNAS SCALE"
          onChange={(event) =>
            onChange({ ...textBanner, text: event.target.value })
          }
        />
        <span className="field-hint">{textBanner.text.length}/80 Zeichen</span>
      </div>

      <label className="switch-row">
        <input
          type="checkbox"
          checked={textBanner.fontSizeAuto}
          onChange={(event) =>
            onChange({
              ...textBanner,
              fontSizeAuto: event.target.checked,
            })
          }
        />
        <span>
          <strong>Automatische Schriftgröße</strong>
          <small>Passt die Größe an die Textlänge an (empfohlen).</small>
        </span>
      </label>

      {!textBanner.fontSizeAuto ? (
        <div className="field">
          <label htmlFor="banner-font-size">
            Schriftgröße ({textBanner.fontSize}px)
          </label>
          <input
            id="banner-font-size"
            type="range"
            min={TEXT_BANNER_FONT_MIN}
            max={TEXT_BANNER_FONT_MAX}
            step={1}
            value={textBanner.fontSize}
            onChange={(event) =>
              onChange({
                ...textBanner,
                fontSize: Number.parseInt(event.target.value, 10),
              })
            }
          />
          <div className="range-labels">
            <span>{TEXT_BANNER_FONT_MIN}px</span>
            <span>{TEXT_BANNER_FONT_MAX}px</span>
          </div>
        </div>
      ) : null}

      <label className="switch-row">
        <input
          type="checkbox"
          checked={textBanner.showClock}
          onChange={(event) =>
            onChange({
              ...textBanner,
              showClock: event.target.checked,
            })
          }
        />
        <span>
          <strong>Uhrzeit oben (live)</strong>
          <small>
            Zeigt die aktuelle Zeit mittig oben — aktualisiert sich alle paar
            Sekunden.
          </small>
        </span>
      </label>

      <label className="switch-row">
        <input
          type="checkbox"
          checked={textBanner.showCornerSensors}
          onChange={(event) =>
            onChange({
              ...textBanner,
              showCornerSensors: event.target.checked,
            })
          }
        />
        <span>
          <strong>Live-Daten in Ecken</strong>
          <small>
            Aus: nur Schriftzug. An: Sensorwerte in den vier Ecken zusätzlich
            zum Text.
          </small>
        </span>
      </label>

      <div className="preset-row">
        {COLOR_PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            className="preset-chip"
            onClick={() =>
              onChange({
                ...textBanner,
                textColor: preset.textColor,
                backgroundColor: preset.backgroundColor,
                cornerColor: preset.cornerColor,
              })
            }
          >
            <span
              className="preset-swatch"
              style={{ background: preset.backgroundColor }}
            />
            {preset.name}
          </button>
        ))}
      </div>

      <div
        className={`color-grid ${showLiveAccentColor ? "color-grid-3" : "color-grid-2"}`}
      >
        <ColorField
          id="banner-text-color"
          label="Textfarbe"
          value={textBanner.textColor}
          onChange={(value) =>
            updateColor("textColor", value, textBanner.textColor)
          }
        />
        <ColorField
          id="banner-bg-color"
          label="Hintergrund"
          value={textBanner.backgroundColor}
          onChange={(value) =>
            updateColor("backgroundColor", value, textBanner.backgroundColor)
          }
        />
        {showLiveAccentColor ? (
          <ColorField
            id="banner-corner-color"
            label="Live-Daten-Farbe"
            value={textBanner.cornerColor}
            onChange={(value) =>
              updateColor("cornerColor", value, textBanner.cornerColor)
            }
          />
        ) : null}
      </div>

      {textBanner.showCornerSensors ? (
        <div className="corner-grid">
          {(Object.keys(BANNER_CORNER_LABELS) as BannerCorner[]).map((corner) => (
            <div className="field" key={corner}>
              <label htmlFor={`corner-${corner}`}>
                {BANNER_CORNER_LABELS[corner]}
              </label>
              <select
                id={`corner-${corner}`}
                value={textBanner.corners[corner]}
                onChange={(event) =>
                  updateCorner(corner, event.target.value as SensorFieldId)
                }
              >
                {SENSOR_FIELD_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          ))}
          <p className="hint span-2">
            Für Live-Werte braucht der Container <code>pid: host</code> und ein
            read-only Mount von <code>/sys</code>.
          </p>
        </div>
      ) : hasLiveRefresh ? (
        <p className="hint">
          {textBanner.showClock
            ? "Uhrzeit wird live aktualisiert"
            : null}
          {textBanner.showClock && textBanner.showCornerSensors ? " · " : null}
          {textBanner.showCornerSensors
            ? "Ecken-Sensoren brauchen pid: host und /sys"
            : null}
        </p>
      ) : (
        <p className="hint">
          Nur der Schriftzug wird angezeigt — keine Live-Aktualisierung.
        </p>
      )}
    </div>
  );
}

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="color-input">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          type="text"
          value={value}
          spellCheck={false}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  );
}

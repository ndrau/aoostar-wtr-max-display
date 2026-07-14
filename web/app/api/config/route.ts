import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { mergeConfig, readConfig, writeConfig } from "@/lib/config";
import { applyConfigForSave } from "@/lib/scheduler";
import { appendLog } from "@/lib/logger";
import type { DisplayConfig } from "@/lib/types";
import { validateConfig } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const config = await readConfig();
  return NextResponse.json(config);
}

export async function PUT(request: Request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = (await request.json()) as Partial<DisplayConfig>;
    const current = await readConfig();
    const merged = mergeConfig({
      ...current,
      ...body,
      textBanner: {
        ...current.textBanner,
        ...body.textBanner,
        corners: {
          ...current.textBanner.corners,
          ...body.textBanner?.corners,
        },
      },
      schedule: { ...current.schedule, ...body.schedule },
    });
    const nextConfig = validateConfig(merged);

    await appendLog(
      "info",
      "config",
      "Saving configuration",
      JSON.stringify(nextConfig),
    );
    await writeConfig(nextConfig);
    await applyConfigForSave(nextConfig);

    return NextResponse.json({ ok: true, config: nextConfig });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await appendLog("error", "config", "Failed to save configuration", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

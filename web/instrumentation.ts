export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { appendLog } = await import("./lib/logger");
    const { runScheduledCheck, startScheduler } = await import("./lib/scheduler");
    const { syncDisplayFromConfig } = await import("./lib/display-sync");

    if (!process.env.API_TOKEN?.trim()) {
      await appendLog(
        "warn",
        "security",
        "API_TOKEN is not set; web API is open to anyone who can reach this port",
      );
    } else {
      await appendLog("info", "security", "API token protection enabled");
    }

    await appendLog("info", "system", "Web UI started");
    await runScheduledCheck();
    startScheduler();
    await syncDisplayFromConfig();
  }
}

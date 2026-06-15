import { processorEngine } from "../lib/engine/processor";
import { CONFIG } from "../lib/config";
import dotenv from "dotenv";

// Load env locally (if running locally). In GitHub Actions, secrets will populate process.env automatically.
dotenv.config({ path: ".env.local" });

// Manually map environment variables to config if they were empty at import time
CONFIG.ai.geminiApiKey = process.env.GEMINI_API_KEY || CONFIG.ai.geminiApiKey;
// Disable dummy mode for real production cron runs
CONFIG.ai.dummyMode = false;

for (const target of CONFIG.targets) {
  if (target.id === "adobe-stock") {
    target.username = process.env.ADOBE_USERNAME || "";
    target.password = process.env.ADOBE_PASSWORD || "";
  } else if (target.id === "shutterstock") {
    target.username = process.env.SHUTTERSTOCK_USERNAME || "";
    target.password = process.env.SHUTTERSTOCK_PASSWORD || "";
  } else if (target.id === "dreamstime") {
    target.username = process.env.DREAMSTIME_USERNAME || "";
    target.password = process.env.DREAMSTIME_PASSWORD || "";
  } else if (target.id === "pond5") {
    target.username = process.env.POND5_USERNAME || "";
    target.password = process.env.POND5_PASSWORD || "";
  } else if (target.id === "123rf") {
    target.username = process.env["123RF_USERNAME"] || "";
    target.password = process.env["123RF_PASSWORD"] || "";
  } else if (target.id === "freepik") {
    target.username = process.env.FREEPIK_USERNAME || "";
    target.password = process.env.FREEPIK_PASSWORD || "";
  }
}

async function runCron() {
  console.log("=== Starting Imagecuan Cron Job ===");
  try {
    await processorEngine.scanAndProcess();
    console.log("=== Cron Job Finished Successfully ===");
  } catch (err) {
    console.error("Cron Job Failed:", err);
    process.exit(1);
  }
}

runCron();

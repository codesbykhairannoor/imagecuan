import { processorEngine } from "./lib/engine/processor";
import { CONFIG } from "./lib/config";
import sharp from "sharp";
import fs from "fs-extra";
import path from "path";
import dotenv from "dotenv";

// Load environment variables manually for this script
dotenv.config({ path: ".env.local" });

// Apply env vars to CONFIG since config.ts was already imported with empty process.env
CONFIG.ai.geminiApiKey = process.env.GEMINI_API_KEY || CONFIG.ai.geminiApiKey;
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
  }
}

async function runLocalTest() {
  console.log("=== Starting Local Pipeline Test ===");

  const rawDir = CONFIG.paths.raw;
  const processedDir = CONFIG.paths.processed;
  const logsDir = CONFIG.paths.logs;

  // Ensure directories exist
  await fs.ensureDir(rawDir);
  await fs.ensureDir(processedDir);
  await fs.ensureDir(logsDir);

  const testFileName = "dreamstime-test-upload.jpg";
  const testFilePath = path.join(rawDir, testFileName);

  // Generate a valid dummy JPEG using sharp
  console.log(`[Test] Generating test image at ${testFilePath}`);
  await sharp({
    create: {
      width: 2500, // Meets > 3 Megapixels resolution generally
      height: 1500,
      channels: 3,
      background: { r: 100, g: 150, b: 255 }
    }
  })
  .jpeg()
  .toFile(testFilePath);

  console.log("[Test] Running Processor Engine...");
  // Disable dummy mode for this test so we really hit Gemini
  CONFIG.ai.dummyMode = false;

  await processorEngine.scanAndProcess();

  console.log("=== Local Pipeline Test Complete ===");
}

runLocalTest().catch(console.error);

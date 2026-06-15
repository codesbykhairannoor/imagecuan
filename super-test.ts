import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { aiMetadataEngine } from "./lib/engine/ai-metadata";
import { CONFIG } from "./lib/config";
import sharp from "sharp";

CONFIG.ai.dummyMode = false;


async function runSuperTest() {
  console.log("=== SUPER TESTING: HUGGINGFACE TOKEN ROTATION ===");
  const testBuffer = await sharp({
    create: { width: 500, height: 500, channels: 3, background: { r: 255, g: 0, b: 0 } }
  }).jpeg().toBuffer();

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  for (let i = 1; i <= 6; i++) {
    console.log(`Sending AI request ${i} to HuggingFace...`);
    try {
      const start = Date.now();
      const meta = await aiMetadataEngine.generateMetadata(testBuffer, `test-${i}.jpg`);
      const elapsed = Date.now() - start;
      console.log(`[Success ${i}] Time: ${elapsed}ms | Title: ${meta.title} | Keywords: ${meta.keywords.slice(0,3).join(',')}`);
      await sleep(2000); // Respect the rate limit delay
    } catch (e: any) {
      console.error(`[Error ${i}]`, e.message || e);
    }
  }
}

runSuperTest().catch(console.error);

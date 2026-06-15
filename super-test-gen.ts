import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { imageGeneratorEngine } from "./lib/engine/image-generator";

async function runSuperTest() {
  console.log("=== SUPER TESTING: AI IMAGE GENERATION ===");
  try {
    const fileName = await imageGeneratorEngine.generateImage();
    if (fileName) {
      console.log("TEST SUCCESSFUL. Image saved at storage/raw/" + fileName);
    } else {
      console.log("TEST FAILED. No image returned.");
    }
  } catch (err) {
    console.error("Test error:", err);
  }
}

runSuperTest();

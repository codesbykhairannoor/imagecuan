/**
 * IMAGECUAN - Central Processor
 * The brain of the automation.
 */

import fs from "fs-extra";
import path from "path";
import { metadataEngine } from "./metadata";
import { uploaderEngine } from "./uploader";
import { CONFIG } from "../config";

export class ProcessorEngine {
  /**
   * Run the full pipeline for a single image.
   */
  async processImage(fileName: string) {
    const rawPath = path.join(CONFIG.paths.raw, fileName);
    const processedPath = path.join(CONFIG.paths.processed, fileName);
    
    console.log(`[Processor] Processing: ${fileName}`);
    
    // 1. Read Image
    const buffer = await fs.readFile(rawPath);
    
    // 2. Generate AI Metadata
    const metadata = await metadataEngine.generateMetadata(buffer, fileName);
    console.log(`[Processor] AI generated metadata for ${fileName}`);
    
    // 3. Inject Metadata into file
    // Move to processed first so we don't modify the original in raw (and clean raw)
    await fs.move(rawPath, processedPath, { overwrite: true });
    await metadataEngine.injectMetadata(processedPath, metadata);
    
    // 4. Upload to each target
    for (const target of CONFIG.targets) {
      if (!target.username || !target.password) {
        console.warn(`[Processor] Skipping ${target.name}: Credentials not set.`);
        continue;
      }
      
      try {
        const remoteFilePath = target.remoteDir.endsWith('/') ? `${target.remoteDir}${fileName}` : `${target.remoteDir}/${fileName}`;
        await uploaderEngine.upload(processedPath, remoteFilePath, target as any);
      } catch (error) {
        console.error(`[Processor] Failed to upload ${fileName} to ${target.name}:`, error);
      }
    }
    
    console.log(`[Processor] Finished: ${fileName}`);
  }

  /**
   * Watch for new files in the raw folder.
   */
  async scanAndProcess() {
    const files = await fs.readdir(CONFIG.paths.raw);
    const images = files.filter(f => /\.(jpg|jpeg|png)$/i.test(f));
    
    if (images.length === 0) {
      console.log("[Processor] No images found in storage/raw");
      return;
    }
    
    const batchSize = images.length; // Process ALL generated images, not just 5
    const batch = images.slice(0, batchSize);
    console.log(`[Processor] Processing batch of ${batch.length} images (out of ${images.length} total)`);
    
    // Helper function to sleep
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    for (const image of batch) {
      try {
        await this.processImage(image);
      } catch (err) {
        console.error(`[Processor] CRITICAL FAILURE processing ${image}:`, err);
        // Continue to the next image instead of crashing the whole batch
      }
      // Wait 2 seconds before processing the next image to prevent rate limiting
      console.log(`[Processor] Waiting 2 seconds before next image...`);
      await sleep(2000);
    }
  }
}

export const processorEngine = new ProcessorEngine();

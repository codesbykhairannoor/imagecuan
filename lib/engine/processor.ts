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
        await uploaderEngine.upload(processedPath, path.join(target.remoteDir, fileName), target as any);
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
    
    const batchSize = 5;
    const batch = images.slice(0, batchSize);
    console.log(`[Processor] Processing batch of ${batch.length} images (out of ${images.length} total)`);
    
    for (const image of batch) {
      await this.processImage(image);
    }
  }
}

export const processorEngine = new ProcessorEngine();

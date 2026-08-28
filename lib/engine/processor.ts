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
  async processImage(fileName: string) {
    const rawPath = path.join(CONFIG.paths.raw, fileName);
    
    console.log(`[Processor] Processing: ${fileName}`);
    
    // 1. Read Image
    const buffer = await fs.readFile(rawPath);
    
    // 2. Generate Base AI Metadata (Clean, no AI keywords)
    const baseMetadata = await metadataEngine.generateMetadata(buffer, fileName);
    console.log(`[Processor] AI generated base metadata for ${fileName}`);
    
    // 3. Define Agencies (Add dreamstime)
    const agencies = ["adobe", "vecteezy", "freepik", "123rf", "dreamstime"];
    
    for (const agency of agencies) {
      const agencyDir = path.join(CONFIG.paths.processed, agency);
      await fs.ensureDir(agencyDir);
      
      const agencyFilePath = path.join(agencyDir, fileName);
      await fs.copy(rawPath, agencyFilePath);
      
      // Clone metadata
      const agencyMetadata = { ...baseMetadata, keywords: [...baseMetadata.keywords] };
      
      // Agency specific rules
      if (agency === "123rf") {
        // 123RF REQUIRES "AI-Generated" keyword
        agencyMetadata.keywords.push("ai-generated", "ai generative");
      } else if (agency === "dreamstime") {
        // Dreamstime REQUIRES AI declaration. Prepended to avoid IPTC 255-char truncation.
        let desc = agencyMetadata.description;
        if (desc.length > 200) {
           // Cut at 200, then find the last period to ensure a complete sentence
           const cut = desc.substring(0, 200);
           const lastPeriod = cut.lastIndexOf(".");
           desc = lastPeriod > 0 ? cut.substring(0, lastPeriod + 1) : cut.trim() + ".";
        }
        agencyMetadata.description = `(AI-Generated) ${desc}`;
        agencyMetadata.keywords.push("generative ai", "ai generated");
      } else if (agency === "adobe") {
        agencyMetadata.keywords.push("generative ai", "ai generated");
      }
      
      await metadataEngine.injectMetadata(agencyFilePath, agencyMetadata);
      console.log(`[Processor] Injected ${agency} metadata into ${fileName}`);
      
      if (agency === "adobe") {
        const csvPath = path.join(agencyDir, "adobe_metadata.csv");
        const titleSafe = `"${agencyMetadata.title.replace(/"/g, '""')}"`;
        const keywordsSafe = `"${agencyMetadata.keywords.map(k => String(k)).join(",")}"`;
        // Check if CSV exists, if not write header
        if (!fs.existsSync(csvPath)) {
          await fs.writeFile(csvPath, "Filename,Title,Keywords,Category,Releases\n");
        }
        await fs.appendFile(csvPath, `${fileName},${titleSafe},${keywordsSafe},${(baseMetadata as any).adobe_category || 8},\n`);
      }

      // 4. Automatic FTP Upload (if configured for this agency)
      const target = CONFIG.targets.find(t => t.id === agency);
      if (target && target.username && target.password) {
        try {
          console.log(`[Processor] Starting FTP upload to ${target.name}...`);
          const remoteFilePath = target.remoteDir.endsWith('/') ? `${target.remoteDir}${fileName}` : `${target.remoteDir}/${fileName}`;
          await uploaderEngine.upload(agencyFilePath, remoteFilePath, target as any);
          console.log(`[Processor] Uploaded to ${target.name} successfully.`);
        } catch (error) {
          console.error(`[Processor] Failed to upload ${fileName} to ${target.name}:`, error);
        }
      }
    }
    
    // Clean up original raw file
    await fs.remove(rawPath);
    
    console.log(`[Processor] Finished branching ${fileName} into agency folders`);
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

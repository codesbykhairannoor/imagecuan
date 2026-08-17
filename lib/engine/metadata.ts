/**
 * IMAGECUAN - Metadata Engine
 * Handles AI-powered tagging and IPTC metadata injection.
 */

import { exiftool } from "exiftool-vendored";
import path from "path";
import { aiMetadataEngine } from "./ai-metadata";

export interface ImageMetadata {
  title: string;
  description: string;
  keywords: string[];
}

export class MetadataEngine {
  /**
   * Inject IPTC metadata into an image file.
   */
  async injectMetadata(filePath: string, metadata: ImageMetadata): Promise<void> {
    const absolutePath = path.resolve(filePath);
    
    try {
      await exiftool.write(absolutePath, {
        "IPTC:ObjectName": metadata.title,
        "XMP:Title": metadata.title,
        "IPTC:Caption-Abstract": metadata.description,
        "XMP:Description": metadata.description,
        "IPTC:Keywords": metadata.keywords,
        "XMP:Subject": metadata.keywords,
      });
      console.log(`[MetadataEngine] Success: ${path.basename(filePath)}`);
    } catch (error) {
      console.error(`[MetadataEngine] Error:`, error);
      throw error;
    }
  }

  /**
   * Analyze image using AI (Gemini) to generate metadata.
   */
  async generateMetadata(imageBuffer: Buffer, fileName: string): Promise<ImageMetadata> {
    return await aiMetadataEngine.generateMetadata(imageBuffer, fileName);
  }

  /**
   * Gracefully close the ExifTool background daemon to prevent orphan processes.
   */
  async close(): Promise<void> {
    await exiftool.end();
  }
}

export const metadataEngine = new MetadataEngine();

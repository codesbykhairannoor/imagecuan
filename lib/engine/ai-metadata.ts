/**
 * IMAGECUAN - HuggingFace AI Metadata Engine
 * Uses token rotation to bypass rate limits.
 */

import { CONFIG } from "../config";

export class AIMetadataEngine {
  private tokens: string[] = [];
  private tokenIndex: number = 0;

  private getNextToken(): string | null {
    const potentialTokens = [
      process.env.HF_TOKEN_2,
      process.env.HF_TOKEN_3,
      process.env.HF_TOKEN_4,
      process.env.HF_TOKEN
    ];
    
    const tokens = potentialTokens.filter(t => t && t.trim() !== "") as string[];
    
    if (tokens.length === 0) return null;
    const token = tokens[this.tokenIndex % tokens.length];
    this.tokenIndex++;
    return token;
  }

  /**
   * Use HuggingFace BLIP to analyze the image and generate stock photography metadata.
   */
  async generateMetadata(imageBuffer: Buffer, fileName: string) {
    const token = this.getNextToken();
    
    if (!token || CONFIG.ai.dummyMode) {
      if (!CONFIG.ai.dummyMode) console.warn("[AI] No HuggingFace tokens available. Using fallback metadata.");
      return this.getFallbackMetadata(fileName);
    }

    try {
      console.log(`[AI] Querying HuggingFace Vision API (Token rotating...)`);
      
      let response;
      let retries = 3;
      while (retries > 0) {
        response = await fetch(
          "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/octet-stream",
            },
            method: "POST",
            // @ts-ignore
            body: imageBuffer,
          }
        );

        if (response.status === 503) {
          const json = await response.json().catch(() => ({}));
          const waitTime = json.estimated_time ? Math.ceil(json.estimated_time) + 2 : 20;
          console.log(`[AI] Vision model is loading. Waiting ${waitTime} seconds before retry...`);
          await new Promise(r => setTimeout(r, waitTime * 1000));
          retries--;
          continue;
        }
        break;
      }

      if (!response || !response.ok) {
        throw new Error(`HF Vision API Error: ${response?.status} ${response?.statusText}`);
      }

      const result = await response.json();
      
      if (Array.isArray(result) && result.length > 0 && result[0].generated_text) {
        const description = result[0].generated_text;
        
        // Capitalize title
        const title = description.charAt(0).toUpperCase() + description.slice(1);
        
        // Generate pseudo-keywords from the description
        const words = description.replace(/[^a-zA-Z0-9 ]/g, "").split(" ");
        const baseKeywords = ["stock", "photo", "image", "asset", "high quality", "background"];
        const keywords = [...new Set([...words, ...baseKeywords])].filter(w => w.length > 2);
        
        return {
          title: title.slice(0, 70), // Max 70 chars for titles
          description: description,
          keywords: keywords.slice(0, 30), // 30 keywords
        };
      }
      
      throw new Error("Invalid response format from HF");
    } catch (error) {
      console.error("[AI] HuggingFace Error:", error);
      return this.getFallbackMetadata(fileName);
    }
  }

  private getFallbackMetadata(fileName: string) {
    const cleanName = fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
    return {
      title: cleanName,
      description: `Stock photography image: ${cleanName}`,
      keywords: ["photography", "stock", "image", "asset"],
    };
  }
}

export const aiMetadataEngine = new AIMetadataEngine();

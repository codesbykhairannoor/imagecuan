/**
 * IMAGECUAN - Gemini AI Metadata Engine
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { CONFIG } from "../config";

export class AIMetadataEngine {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    if (CONFIG.ai.geminiApiKey) {
      this.genAI = new GoogleGenerativeAI(CONFIG.ai.geminiApiKey);
    }
  }

  /**
   * Use Gemini 1.5 Flash to analyze the image and generate stock photography metadata.
   */
  async generateMetadata(imageBuffer: Buffer, fileName: string) {
    if (!this.genAI) {
      console.warn("[AI] Gemini API Key missing. Using fallback metadata.");
      return this.getFallbackMetadata(fileName);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `
        Analyze this image for stock photography purposes. 
        Provide the following in JSON format:
        {
          "title": "A concise, descriptive title (max 70 chars)",
          "description": "A detailed description including main subjects and mood",
          "keywords": ["at", "least", "20", "relevant", "keywords", "comma", "separated"]
        }
        Focus on high-value SEO keywords for buyers.
      `;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBuffer.toString("base64"),
            mimeType: "image/jpeg", // Assuming JPEG for now
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from potential markdown blocks
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error("Failed to parse AI response as JSON");
    } catch (error) {
      console.error("[AI] Gemini Error:", error);
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

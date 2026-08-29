/**
 * IMAGECUAN - AI Metadata Engine (Gemini-Powered)
 * Generates super SEO-optimized metadata: viral title, rich description, and 30+ keywords.
 */

import { CONFIG } from "../config";
import axios from "axios";

export class AIMetadataEngine {

  /**
   * Parse subject + color from SEO filename like: minimalist-flat-vector-golden-piggy-bank-12345.jpg
   */
  private parseFilenameContext(fileName: string): { subject: string; styleSlug: string; style: string } {
    const base = fileName.replace(/\.[^/.]+$/, "").replace(/-\d+$/, "");
    // Pattern: {styleSlug}-{subject...}
    const parts = base.split("-");
    const styleSlug = parts[0] || "cinematic";
    const subject = parts.slice(1).join(" ") || base;
    return { subject, styleSlug, style: "highly detailed cinematic high quality imagery" };
  }

  /**
   * Generate metadata using Google Gemini API with deep SEO research.
   */
  async generateMetadata(imageBuffer: Buffer, fileName: string) {
    // Collect all available Gemini keys from environment variables
    const geminiKeys: string[] = [];
    if (CONFIG.ai.geminiApiKey) geminiKeys.push(...CONFIG.ai.geminiApiKey.split(",").map(k => k.trim()));
    if (process.env.GEMINI_API_KEY_1) geminiKeys.push(process.env.GEMINI_API_KEY_1.trim());
    if (process.env.GEMINI_API_KEY_2) geminiKeys.push(process.env.GEMINI_API_KEY_2.trim());
    if (process.env.GEMINI_API_KEY_3) geminiKeys.push(process.env.GEMINI_API_KEY_3.trim());

    // Deduplicate and remove empty keys
    const validKeys = [...new Set(geminiKeys.filter(k => k.length > 10))];

    if (validKeys.length > 0 && !CONFIG.ai.dummyMode) {
      try {
        return await this.generateWithGemini(imageBuffer, fileName, validKeys);
      } catch (err: any) {
        console.warn(`[AI] All Gemini keys failed: ${err.message}. Falling back to smart filename-based metadata.`);
      }
    }

    // Smart fallback: use filename context to build rich metadata without AI
    return this.getSmartFallbackMetadata(fileName);
  }

  private async generateWithGemini(imageBuffer: Buffer, fileName: string, apiKeys: string[]) {
    const ctx = this.parseFilenameContext(fileName);
    const base64Image = imageBuffer.toString("base64");

    console.log(`[AI] Querying Gemini Vision API for rich SEO metadata...`);

    const prompt = `You are an expert stock photography SEO specialist. Analyze this ${ctx.style} image of a ${ctx.subject} with ${ctx.styleSlug} aesthetic and generate highly optimized metadata for stock photo platforms (Adobe Stock, Vecteezy, Freepik, 123RF).

Return a JSON object with EXACTLY this structure:
{
  "title": "A compelling, specific, SEO-rich title (max 70 chars). Must include the main subject and aesthetic. Example: 'A glowing digital nomad typing on a laptop in a stylized sunny cafe'",
  "description": "A detailed 2-3 sentence description (150-200 chars) that describes what is shown, the lighting, the mood, and potential commercial use cases (lifestyle, business, editorial). Include main keywords naturally.",
  "keywords": ["array", "of", "exactly", "30", "to", "40", "highly", "relevant", "stock", "keywords"],
  "adobe_category": 8
}

CATEGORY RULES:
- "adobe_category" MUST be a single integer between 1 and 21 corresponding to Adobe Stock Categories:
  1-Animals, 2-Buildings/Architecture, 3-Business, 4-Drinks, 5-Environment, 6-States of Mind, 7-Food, 8-Graphic Resources, 9-Hobbies/Leisure, 10-Industry, 11-Landscapes, 12-Lifestyle, 13-People, 14-Plants/Flowers, 15-Culture/Religion, 16-Science, 17-Social Issues, 18-Sports, 19-Technology, 20-Transport, 21-Travel.
- If unsure, use 8 (Graphic Resources).

KEYWORD RULES (VERY IMPORTANT):
- Include: main subject synonyms, lighting (cinematic, natural, golden hour), mood, setting, camera angles (macro, wide shot, bokeh), and concepts related to the subject.
- ALWAYS include these high-traffic terms when relevant: "high resolution", "highly detailed", "cinematic", "lifestyle", "commercial", "authentic"
- STRICTLY FORBIDDEN TERMS: Do not use generalized terms like "vector", "video", "photo", "photography", "illustration", "image", "picture". Do not use camera terms like "shot of", "photo of", "macro shot", "captured", "lens". Do not use AI terms like "ai", "ai-generated", "generative ai", "midjourney". Do not include ANY trademarked brands (e.g., Nike) or famous artist names.
- NO NEWSWORTHY EVENTS: Do not imply an actual depiction of real newsworthy events or photojournalism. Must be descriptive, not editorial.
- Include at least 2-3 industry/niche keywords
- All keywords must be lowercase
- Minimum 30 keywords, maximum 40 keywords

Respond with ONLY the JSON object, no markdown, no extra text.`;

    const GEMINI_MODELS = [
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
      "gemini-flash-lite-latest"
    ];

    let rawText = "";
    
    // Outer loop: Try each API key
    outer: for (let i = 0; i < apiKeys.length; i++) {
      const apiKey = apiKeys[i];
      console.log(`[AI] Testing Gemini Key ${i + 1}...`);
      
      // Inner loop: Try each model with the current key
      for (const model of GEMINI_MODELS) {
        try {
          const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              contents: [{
                parts: [
                  { inlineData: { mimeType: "image/jpeg", data: base64Image } },
                  { text: prompt }
                ]
              }],
              generationConfig: { temperature: 0.4, maxOutputTokens: 1024 }
            },
            { timeout: 30000 }
          );
          rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (rawText) {
            console.log(`[AI] Gemini (${model}) via Key ${i + 1} returned metadata successfully.`);
            break outer; // Break completely out of both loops on success
          }
        } catch (err: any) {
          const status = err.response?.data?.error?.code || err.response?.status;
          console.warn(`[AI] Key ${i + 1} (${model}) failed with status ${status}.`);
          // If 403 or 400 (bad key), or 429/503 (rate limit/overload), try next model or next key
          continue;
        }
      }
    }
    
    // Clean JSON from markdown code fences if present
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in Gemini response");
    
    const parsed = JSON.parse(jsonMatch[0]);

    const keywords: string[] = Array.isArray(parsed.keywords) ? parsed.keywords : [];
    const title: string = String(parsed.title || "").slice(0, 100);
    const description: string = String(parsed.description || "").slice(0, 500);
    const adobe_category: number = Number(parsed.adobe_category) || 8;

    if (!title || keywords.length < 5) throw new Error("Gemini returned insufficient metadata");

    console.log(`[AI] Gemini generated ${keywords.length} keywords for: ${title}`);

    return { title, description, keywords: keywords.slice(0, 49), adobe_category };
  }

  /**
   * Smart fallback using deep filename context - much better than the old 4-keyword fallback.
   */
  private getSmartFallbackMetadata(fileName: string) {
    const ctx = this.parseFilenameContext(fileName);
    const { subject, styleSlug } = ctx;
    let subjectTitle = subject.replace(/\b\w/g, c => c.toUpperCase());
    let styleTitle = styleSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    // Deep clean words from fallback title
    subjectTitle = subjectTitle.replace(/Photo/gi, "").replace(/Shot/gi, "").replace(/Camera/gi, "").replace(/\s+/g, " ").trim();
    styleTitle = styleTitle.replace(/Photo/gi, "").replace(/Shot/gi, "").replace(/Camera/gi, "").replace(/\s+/g, " ").trim();

    const title = `${subjectTitle} with ${styleTitle} Aesthetic Details`;

    const description = `A highly detailed creation of a ${subject} captured with beautiful ${styleTitle.toLowerCase()} aesthetics. Ideal for modern commercial use, web design, and editorial layouts. High resolution and pristine quality.`;

    const subjectWords = subject.split(" ");
    const keywords = [
      ...subjectWords,
      subject,
      "cinematic",
      "highly detailed",
      "high quality",
      "commercial",
      "lifestyle",
      "editorial",
      "beautiful",
      "modern",
      "authentic",
      "professional",
      "8k",
      styleSlug.replace(/-/g, ' '),
      `${subject} imagery`,
      "background",
      "texture",
      "lighting"
    ].map(k => k.toLowerCase().trim())
      .filter((k, i, arr) => k.length > 1 && arr.indexOf(k) === i)
      .slice(0, 40);

    return { title, description, keywords, adobe_category: 8 };
  }
}

export const aiMetadataEngine = new AIMetadataEngine();

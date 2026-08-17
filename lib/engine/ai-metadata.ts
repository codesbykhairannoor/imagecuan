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
    // Pattern: cinematic-photo-{styleSlug}-{subject...}
    const parts = base.split("-");
    const styleSlug = parts[2] || "cinematic";
    const subject = parts.slice(3).join(" ") || base;
    return { subject, styleSlug, style: "photorealistic cinematic high quality photography" };
  }

  /**
   * Generate metadata using Google Gemini API with deep SEO research.
   */
  async generateMetadata(imageBuffer: Buffer, fileName: string) {
    const geminiKey = CONFIG.ai.geminiApiKey;

    if (geminiKey && !CONFIG.ai.dummyMode) {
      try {
        return await this.generateWithGemini(imageBuffer, fileName, geminiKey);
      } catch (err: any) {
        console.warn(`[AI] Gemini Error: ${err.message}. Falling back to smart filename-based metadata.`);
      }
    }

    // Smart fallback: use filename context to build rich metadata without AI
    return this.getSmartFallbackMetadata(fileName);
  }

  private async generateWithGemini(imageBuffer: Buffer, fileName: string, apiKey: string) {
    const ctx = this.parseFilenameContext(fileName);
    const base64Image = imageBuffer.toString("base64");

    console.log(`[AI] Querying Gemini Vision API for rich SEO metadata...`);

    const prompt = `You are an expert stock photography SEO specialist. Analyze this ${ctx.style} image of a ${ctx.subject} with ${ctx.styleSlug} aesthetic and generate highly optimized metadata for stock photo platforms (Adobe Stock, Vecteezy, Freepik, 123RF).

Return a JSON object with EXACTLY this structure:
{
  "title": "A compelling, specific, SEO-rich title (max 70 chars). Must include the main subject and photography style. Example: 'Cinematic Shot of a Digital Nomad Typing in a Sunny Cafe'",
  "description": "A detailed 2-3 sentence description (150-200 chars) that describes what is shown, the lighting, the mood, and potential commercial use cases (lifestyle, business, editorial). Include main keywords naturally.",
  "keywords": ["array", "of", "exactly", "30", "to", "40", "highly", "relevant", "stock", "keywords"]
}

KEYWORD RULES (VERY IMPORTANT):
- Include: main subject synonyms, lighting (cinematic, natural, golden hour), mood, setting, camera angles (macro, wide shot, bokeh), and concepts related to the subject.
- ALWAYS include these high-traffic terms when relevant: "high resolution", "photorealistic", "cinematic", "lifestyle", "commercial photography", "authentic", "generative ai"
- STRICTLY FORBIDDEN: Do not include ANY trademarked brands (e.g., Nike, Apple), specific camera brands (e.g., Nikon, Fujifilm, 35mm), or famous artist names (e.g., Greg Rutkowski). Microstock agencies will reject the image if these are included.
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
          console.log(`[AI] Gemini (${model}) returned metadata.`);
          break;
        }
      } catch (err: any) {
        const status = err.response?.data?.error?.code;
        if (status === 429) {
          console.warn(`[AI] ${model} quota exceeded, trying next model...`);
          continue;
        }
        throw err;
      }
    }
    
    // Clean JSON from markdown code fences if present
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in Gemini response");
    
    const parsed = JSON.parse(jsonMatch[0]);

    const keywords: string[] = Array.isArray(parsed.keywords) ? parsed.keywords : [];
    const title: string = String(parsed.title || "").slice(0, 100);
    const description: string = String(parsed.description || "").slice(0, 500);

    if (!title || keywords.length < 5) throw new Error("Gemini returned insufficient metadata");

    console.log(`[AI] Gemini generated ${keywords.length} keywords for: ${title}`);

    return { title, description, keywords: keywords.slice(0, 49) };
  }

  /**
   * Smart fallback using deep filename context - much better than the old 4-keyword fallback.
   */
  private getSmartFallbackMetadata(fileName: string) {
    const ctx = this.parseFilenameContext(fileName);
    const { subject, styleSlug } = ctx;
    const subjectTitle = subject.replace(/\b\w/g, c => c.toUpperCase());
    const styleTitle = styleSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const title = `Cinematic Photo of ${subjectTitle} - ${styleTitle} Style`;

    const description = `A highly detailed, photorealistic image of a ${subject} captured with beautiful ${styleTitle.toLowerCase()} aesthetics. Ideal for modern commercial use, web design, and editorial layouts. High resolution and pristine quality.`;

    const subjectWords = subject.split(" ");
    const keywords = [
      ...subjectWords,
      subject,
      "cinematic",
      "photography",
      "photorealistic",
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
      `${subject} photography`,
      "background",
      "texture",
      "lighting"
    ].map(k => k.toLowerCase().trim())
      .filter((k, i, arr) => k.length > 1 && arr.indexOf(k) === i)
      .slice(0, 40);

    return { title, description, keywords };
  }
}

export const aiMetadataEngine = new AIMetadataEngine();

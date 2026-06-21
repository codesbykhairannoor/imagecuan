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
  private parseFilenameContext(fileName: string): { subject: string; color: string; style: string } {
    const base = fileName.replace(/\.[^/.]+$/, "").replace(/-\d+$/, "");
    // Pattern: minimalist-flat-vector-{color}-{subject...}
    const parts = base.split("-");
    // parts[0]=minimalist, parts[1]=flat, parts[2]=vector, parts[3]=color, parts[4..]=subject
    const color = parts[3] || "vibrant";
    const subject = parts.slice(4).join(" ") || base;
    return { subject, color, style: "minimalist flat vector illustration" };
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

    const prompt = `You are an expert stock photography SEO specialist. Analyze this ${ctx.style} image of a ${ctx.color} ${ctx.subject} and generate highly optimized metadata for stock photo platforms (Shutterstock, Adobe Stock, Dreamstime, 123RF, Pond5).

Return a JSON object with EXACTLY this structure:
{
  "title": "A compelling, specific, SEO-rich title (max 70 chars). Must include the main subject, style, and color. Example: 'Golden Piggy Bank Flat Vector Icon – Finance Savings Concept'",
  "description": "A detailed 2-3 sentence description (150-200 chars) that describes what is shown, the style (minimalist flat vector illustration), the use cases (web design, apps, infographics, presentations), and the mood/context. Include main keywords naturally.",
  "keywords": ["array", "of", "exactly", "30", "to", "40", "highly", "relevant", "stock", "keywords"]
}

KEYWORD RULES (VERY IMPORTANT):
- Include: main subject synonyms, style terms (flat design, vector, icon, illustration, clipart, graphic, symbol), color, use cases (web, app, business, finance etc), emotions/concepts related to subject
- ALWAYS include these high-traffic terms when relevant: "isolated white background", "flat design", "vector icon", "minimalist", "clean design", "digital art", "graphic element", "design asset"
- Include at least 2-3 industry/niche keywords
- All keywords must be lowercase
- Minimum 30 keywords, maximum 40 keywords

Respond with ONLY the JSON object, no markdown, no extra text.`;

    const GEMINI_MODELS = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-2.5-pro",
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
    const { subject, color, style } = ctx;
    const subjectTitle = subject.replace(/\b\w/g, c => c.toUpperCase());
    const colorTitle = color.charAt(0).toUpperCase() + color.slice(1);

    const title = `${colorTitle} ${subjectTitle} Flat Vector Icon Illustration – Isolated`;

    const description = `A clean, minimalist ${color} ${subject} flat vector illustration, perfectly isolated on a white background. Ideal for web design, mobile apps, business presentations, infographics, and digital marketing projects. High-resolution, 9MP JPEG, commercial use.`;

    const subjectWords = subject.split(" ");
    const keywords = [
      // Subject terms
      ...subjectWords,
      subject,
      `${color} ${subject}`,
      `${subject} icon`,
      `${subject} illustration`,
      `${subject} vector`,
      `${subject} clipart`,
      `${subject} symbol`,
      `${subject} graphic`,
      `${subject} design`,
      `${subject} element`,
      // Style terms
      "flat design",
      "flat vector",
      "vector icon",
      "minimalist",
      "clean design",
      "simple icon",
      "outline icon",
      "line art",
      "clipart",
      "graphic element",
      "design asset",
      "digital art",
      "2d illustration",
      // Background/isolation
      "isolated",
      "white background",
      "isolated white background",
      "transparent background",
      // Color
      color,
      `${color} icon`,
      // Use case
      "web design",
      "app icon",
      "ui element",
      "infographic",
      "presentation",
      "business",
      "commercial use",
      "high resolution",
      "stock image",
      "stock illustration",
    ].map(k => k.toLowerCase().trim())
      .filter((k, i, arr) => k.length > 1 && arr.indexOf(k) === i)
      .slice(0, 40);

    return { title, description, keywords };
  }
}

export const aiMetadataEngine = new AIMetadataEngine();

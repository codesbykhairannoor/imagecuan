import fs from "fs-extra";
import path from "path";
import { CONFIG } from "../config";
import axios from "axios";
import sharp from "sharp";

const SUBJECTS = [
  "rocket", "golden coin", "laptop", "lightbulb", "puzzle piece", "shield", 
  "megaphone", "calendar", "calculator", "shopping cart", "gift box", "trophy", 
  "target with arrow", "padlock", "magnifying glass", "gears", "clipboard", 
  "thumbs up", "smartphone", "cloud computing", "credit card", "piggy bank", 
  "briefcase", "compass", "anchor", "microphone", "headphones", "camera", 
  "paint palette", "books", "graduation cap", "stethoscope", "syringe", 
  "pill bottle", "dna strand", "microscope", "telescope", "saturn planet", 
  "leaf", "tree", "flower", "water drop", "fire flame", "lightning bolt", 
  "sun", "moon", "star", "heart", "diamond", "crown", "magic wand", "hourglass"
];

const COLORS = ["vibrant", "pastel", "neon", "monochrome", "golden", "silver", "metallic", "holographic"];

export class ImageGeneratorEngine {
  private tokenIndex: number = 0;

  private potentialTokens: string[] = [];

  constructor() {
    this.potentialTokens = [
      process.env.HF_TOKEN_2,
      process.env.HF_TOKEN_3,
      process.env.HF_TOKEN_4,
      process.env.HF_TOKEN
    ].filter(t => t && t.trim() !== "") as string[];
  }

  private getNextToken(): string | null {
    if (this.potentialTokens.length === 0) return null;
    const token = this.potentialTokens[this.tokenIndex % this.potentialTokens.length];
    this.tokenIndex++;
    return token;
  }

  private markTokenAsExhausted(token: string) {
    console.warn(`[Generator] Token exhausted (402). Removing from rotation.`);
    this.potentialTokens = this.potentialTokens.filter(t => t !== token);
  }

  /**
   * Generates a 3D Canva-style element image using various AI APIs
   */
  async generateImage(seed?: number): Promise<string | null> {
    // Randomize subject to prevent duplicates
    const randomSubject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    const prompt = `A single, perfectly drawn, clean minimalist 2D flat vector illustration of exactly one ${randomColor} ${randomSubject}. Anatomically correct, flawless geometry, symmetrical, simple solid colors, corporate dribbble style, isolated on a pure white background. NO double objects, NO extra fingers, NO bad anatomy, NO mutated shapes, NO deformed objects, no gradients, absolutely no glowing effects, no 3d render, clean crisp edges.`;

    console.log(`[Generator] Generating image for prompt: "${prompt}"`);

    let buffer: Buffer | null = null;

    // --- PRIORITY 1: POLLINATIONS.AI (Free global fallback) ---
    console.log(`[Generator] Trying Pollinations API (Priority 1)...`);
    try {
      const encodedPrompt = encodeURIComponent(prompt);
      const pollResponse = await axios.get(
        `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`,
        { responseType: "arraybuffer", timeout: 60000, validateStatus: () => true }
      );
      if (pollResponse.status === 200) {
        buffer = Buffer.from(pollResponse.data);
        console.log(`[Generator] Pollinations API succeeded.`);
      } else {
        console.warn(`[Generator] Pollinations failed: ${pollResponse.status}`);
      }
    } catch (err: any) {
      console.warn(`[Generator] Pollinations API Error: ${err.message}`);
    }

    // --- PRIORITY 2: ALIBABA API (Custom OpenAI Compatible Endpoint) ---
    if (!buffer && process.env.ALIBABA_API_KEY && process.env.ALIBABA_API_ENDPOINT) {
      console.log(`[Generator] Trying Alibaba API (Priority 2)...`);
      try {
        const alibabaResponse = await axios.post(
          `${process.env.ALIBABA_API_ENDPOINT}/images/generations`,
          {
            model: "wan2.7-image",
            prompt: prompt,
            n: 1,
            size: "1024x1024"
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.ALIBABA_API_KEY}`,
              "Content-Type": "application/json"
            },
            timeout: 60000,
            validateStatus: () => true
          }
        );

        if (alibabaResponse.status === 200 && alibabaResponse.data?.data?.[0]?.url) {
          const imageUrl = alibabaResponse.data.data[0].url;
          const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
          buffer = Buffer.from(imageResponse.data);
          console.log(`[Generator] Alibaba API succeeded.`);
        } else if (alibabaResponse.status === 200 && alibabaResponse.data?.data?.[0]?.b64_json) {
          buffer = Buffer.from(alibabaResponse.data.data[0].b64_json, "base64");
          console.log(`[Generator] Alibaba API succeeded (base64).`);
        } else {
          console.warn(`[Generator] Alibaba API failed: ${alibabaResponse.status} - ${JSON.stringify(alibabaResponse.data).substring(0, 100)}`);
        }
      } catch (err: any) {
        console.warn(`[Generator] Alibaba API Error: ${err.message}`);
      }
    }

    // --- PRIORITY 3: HUGGING FACE (Last Option) ---
    if (!buffer) {
      let token = this.getNextToken();
      if (!token) {
        console.warn("[Generator] No HF tokens available, and all previous priorities failed.");
      } else {
        console.log(`[Generator] Trying Hugging Face API (Priority 3)...`);
        let retries = 3;
        
        const models = [
          "black-forest-labs/FLUX.1-schnell",
          "stabilityai/stable-diffusion-3.5-large",
          "runwayml/stable-diffusion-v1-5"
        ];
        let currentModel = models[0];

        while (retries > 0 && !buffer) {
          try {
            const hfResponse = await axios.post(
              `https://router.huggingface.co/hf-inference/models/${currentModel}`,
              { inputs: prompt },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: "image/png",
                  "Content-Type": "application/json",
                },
                responseType: "arraybuffer",
                validateStatus: () => true
              }
            );

            if (hfResponse.status === 200) {
              buffer = Buffer.from(hfResponse.data);
              console.log(`[Generator] Hugging Face API succeeded using model ${currentModel}.`);
              break;
            }

            if (hfResponse.status === 503) {
              const json = JSON.parse(hfResponse.data.toString() || "{}");
              const waitTime = json.estimated_time ? Math.ceil(json.estimated_time) + 2 : 20;
              console.log(`[Generator] HF Model loading. Waiting ${waitTime}s...`);
              await new Promise(r => setTimeout(r, waitTime * 1000));
              retries--;
              continue;
            }

            if (hfResponse.status === 402) {
              this.markTokenAsExhausted(token);
              const freshToken = this.getNextToken();
              if (freshToken) {
                token = freshToken;
                continue;
              } else {
                console.warn("[Generator] All HF tokens exhausted!");
                break;
              }
            }

            // Model error or 404/410, try next model
            const nextModel = models[models.indexOf(currentModel) + 1];
            if (nextModel) {
              console.log(`[Generator] HF Model ${currentModel} failed (${hfResponse.status}). Switching to ${nextModel}...`);
              currentModel = nextModel;
              continue;
            }
            break;
          } catch (err: any) {
            console.warn(`[Generator] HF Network Error:`, err.message);
            retries--;
            await new Promise(r => setTimeout(r, 5000));
          }
        }
      }
    }

    if (!buffer) {
      console.error("[Generator] ALL Generation APIs failed. Cannot create image.");
      return null;
    }
      // Convert to JPEG and upscale to 3000x3000 (9 Megapixels) to exceed ALL stock agency minimums!
      // 123RF requires min 6MP, Dreamstime/Pond5 require min 3MP. 9MP clears all of them easily.
      const jpegBuffer = await sharp(buffer)
        .resize(3000, 3000, {
          kernel: sharp.kernel.lanczos3,
          fit: 'contain',
          background: { r: 255, g: 255, b: 255 }
        })
        .jpeg({ quality: 95 })
        .toBuffer();

      // Beautiful SEO-friendly filename instead of ugly timestamps
      const randomId = Math.floor(Math.random() * 100000);
      const sanitizedSubject = randomSubject.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const fileName = `minimalist-flat-vector-${randomColor}-${sanitizedSubject}-${randomId}.jpg`;
      const filePath = path.join(CONFIG.paths.raw, fileName);

      await fs.writeFile(filePath, jpegBuffer);
      console.log(`[Generator] Successfully saved new image: ${fileName}`);
      
      return fileName;
  }

  /**
   * Generates a batch of images
   */
  async generateBatch(count: number) {
    console.log(`[Generator] Starting generation of ${count} new images...`);
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    const generatedFiles = [];
    for (let i = 0; i < count; i++) {
      console.log(`[Generator] Processing ${i + 1}/${count}...`);
      const fileName = await this.generateImage();
      if (fileName) {
        generatedFiles.push(fileName);
      }
      // Delay 3 seconds between generations to avoid hitting rate limits
      await sleep(3000);
    }
    
    console.log(`[Generator] Batch completed. Created ${generatedFiles.length} images.`);
    return generatedFiles;
  }
}

export const imageGeneratorEngine = new ImageGeneratorEngine();

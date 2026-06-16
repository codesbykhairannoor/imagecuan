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
   * Generates a 3D Canva-style element image using HuggingFace Inference API
   */
  async generateImage(seed?: number): Promise<string | null> {
    const token = this.getNextToken();
    if (!token) {
      console.warn("[Generator] No HF tokens available for image generation.");
      return null;
    }

    // Randomize subject to prevent duplicates
    const randomSubject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    const prompt = `A clean, minimalist 2D flat vector illustration of a ${randomColor} ${randomSubject}, simple solid colors, corporate dribbble style, isolated on a pure white background, no gradients, absolutely no glowing effects, no bloom, no lighting effects, no 3d render, clean crisp edges`;

    console.log(`[Generator] Generating image for prompt: "${prompt}"`);

    try {
      let response: any;
      let retries = 3;
      
      const models = [
        "black-forest-labs/FLUX.1-schnell",
        "stabilityai/stable-diffusion-3.5-large",
        "runwayml/stable-diffusion-v1-5"
      ];
      
      let currentModel = models[0];

      while (retries > 0) {
        try {
          response = await axios.post(
            `https://router.huggingface.co/hf-inference/models/${currentModel}`,
            { inputs: prompt },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "image/png",
                "Content-Type": "application/json",
              },
              responseType: "arraybuffer",
              validateStatus: () => true // Resolve all statuses to handle 503 manually
            }
          );

          if (response.status === 503) {
            const json = JSON.parse(response.data.toString() || "{}");
            const waitTime = json.estimated_time ? Math.ceil(json.estimated_time) + 2 : 20;
            console.log(`[Generator] Model is loading. Waiting ${waitTime} seconds before retry...`);
            await new Promise(r => setTimeout(r, waitTime * 1000));
            retries--;
            continue;
          }
          if (response.status === 410 || response.status === 404 || response.status === 402) {
            // Model is no longer available or out of free quota. Try next model!
            const nextModel = models[models.indexOf(currentModel) + 1];
            if (nextModel) {
              console.log(`[Generator] Model ${currentModel} failed (${response.status}). Switching to ${nextModel}...`);
              currentModel = nextModel;
              continue; // don't decrement retries for model fallback
            }
          }
          break;
        } catch (err) {
          console.error(`[Generator] Network Error:`, err);
          retries--;
          await new Promise(r => setTimeout(r, 5000));
        }
      }

      if (!response || response.status !== 200) {
        throw new Error(`HF Generation Error: ${response?.status} ${response?.statusText}`);
      }

      // The response data is already an arraybuffer because of responseType: "arraybuffer"
      const buffer = Buffer.from(response.data);
      
      // Convert the buffer to a valid JPEG using sharp (FLUX.1 often returns PNG/WEBP)
      const jpegBuffer = await sharp(buffer)
        .jpeg({ quality: 100 })
        .toBuffer();

      // Save to raw folder
      const timestamp = Date.now();
      const sanitizedSubject = randomSubject.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `generated_${sanitizedSubject}_${timestamp}.jpg`;
      const filePath = path.join(CONFIG.paths.raw, fileName);

      await fs.writeFile(filePath, jpegBuffer);
      console.log(`[Generator] Successfully saved new image: ${fileName}`);
      
      return fileName;
    } catch (error) {
      console.error("[Generator] Failed to generate image:", error);
      return null;
    }
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

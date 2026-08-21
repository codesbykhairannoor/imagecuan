import fs from "fs-extra";
import path from "path";
import { CONFIG } from "../config";
import axios from "axios";
import sharp from "sharp";

import { PromptMatrix } from "./prompt-matrix";

export class ImageGeneratorEngine {
  /**
   * Generates a photorealistic stock image using procedural prompts
   */
  async generateImage(seed?: number): Promise<string | null> {
    const generated = PromptMatrix.generate();
    const prompt = generated.prompt;

    console.log(`[Generator] Generating image for prompt: "${prompt}"`);

    let buffer: Buffer | null = null;
    // --- PRIORITY 1: AGNES AI (Cinematic & Photorealistic Base) ---
    if (!buffer) {
      console.log(`[Generator] Trying Agnes AI (Priority 1)...`);
      try {
        const agnesResponse = await axios.post(
          'https://apihub.agnes-ai.com/v1/images/generations',
          {
            model: 'agnes-image-2.1-flash',
            prompt: prompt,
            size: '1024x1024'
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.AGNES_API_KEY || ''}`,
              'Content-Type': 'application/json'
            },
            timeout: 60000,
            validateStatus: () => true
          }
        );

        if (agnesResponse.status === 200 && agnesResponse.data?.data?.[0]) {
          const imgUrl = agnesResponse.data.data[0].url;
          const b64 = agnesResponse.data.data[0].b64_json;
          
          if (imgUrl) {
            const imgRes = await axios.get(imgUrl, { responseType: 'arraybuffer' });
            buffer = Buffer.from(imgRes.data);
          } else if (b64) {
            buffer = Buffer.from(b64, 'base64');
          }
          if (buffer) console.log(`[Generator] Agnes AI succeeded.`);
        } else {
          console.warn(`[Generator] Agnes AI failed: ${agnesResponse.status}`);
        }
      } catch (err: any) {
        console.warn(`[Generator] Agnes AI Error: ${err.message}`);
      }
    }

    // --- PRIORITY 2: CLOUDFLARE WORKERS AI (Fast Fallback) ---
    const cfAccountId = process.env.CF_ACCOUNT_ID || "";
    const cfApiToken = process.env.CF_API_TOKEN || "";

    if (!buffer && cfAccountId && cfApiToken) {
      console.log(`[Generator] Trying Cloudflare Workers AI (Priority 2)...`);
      try {
        const model = "@cf/black-forest-labs/flux-1-schnell";
        const response = await axios.post(
          `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${model}`,
          { prompt: prompt },
          {
            headers: {
              Authorization: `Bearer ${cfApiToken}`,
              "Content-Type": "application/json"
            },
            timeout: 60000,
            validateStatus: () => true
          }
        );

        if (response.status === 200 && response.data?.success) {
          const b64 = response.data.result.image;
          buffer = Buffer.from(b64, "base64");
          console.log(`[Generator] Cloudflare FLUX.1-Schnell generated image.`);
        } else {
          console.warn(`[Generator] Cloudflare Workers AI failed: ${response.status}`);
        }
      } catch (err: any) {
        console.warn(`[Generator] Cloudflare Workers AI Error: ${err.message}`);
      }
    }

    // --- PRIORITY 3: POLLINATIONS.AI (Fallback) ---
    if (!buffer) {
      console.log(`[Generator] Trying Pollinations API (Priority 3)...`);
      try {
        const encodedPrompt = encodeURIComponent(prompt);
        const randomSeed = seed || Math.floor(Math.random() * 1000000000);
        const pollResponse = await axios.get(
          `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${randomSeed}`,
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
    }

    if (!buffer) {
      console.error("[Generator] ALL Generation APIs failed. Cannot create image.");
      return null;
    }

    // Convert to JPEG and upscale to 3000x3000 (9 Megapixels)
    const jpegBuffer = await sharp(buffer)
      .resize(3000, 3000, {
        kernel: sharp.kernel.lanczos3,
        fit: 'cover'
      })
      .jpeg({ quality: 95 })
      .toBuffer();

    // Beautiful SEO-friendly filename from Prompt Matrix
    const randomId = Math.floor(Math.random() * 100000);
    const fileName = `${generated.categorySlug}-${generated.sanitizedSubject}-${randomId}.jpg`;
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
      // Delay 3 seconds between generations (API is stable, don't need 15s)
      await sleep(3000);
    }
    
    console.log(`[Generator] Batch completed. Created ${generatedFiles.length} images.`);
    return generatedFiles;
  }
}

export const imageGeneratorEngine = new ImageGeneratorEngine();

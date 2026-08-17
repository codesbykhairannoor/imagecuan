import fs from "fs-extra";
import path from "path";
import axios from "axios";
import { PromptMatrix } from "../lib/engine/prompt-matrix";
import { aiMetadataEngine } from "../lib/engine/ai-metadata";
import { MetadataEngine } from "../lib/engine/metadata";
import dotenv from "dotenv";
import { CONFIG } from "../lib/config";

dotenv.config({ path: ".env.local" });

const cfAccountId = process.env.CF_ACCOUNT_ID;
const cfApiToken = process.env.CF_API_TOKEN;
const model = "@cf/black-forest-labs/flux-1-schnell";

const TARGET_DIR = path.join(process.cwd(), "manual_upload");

async function generateManualBatch(count: number = 10) {
  console.log(`\n==================================================`);
  console.log(`🚜 MEMULAI PABRIK GAMBAR MANUAL (Target: ${count} Gambar)`);
  console.log(`==================================================`);
  
  await fs.ensureDir(TARGET_DIR);

  let successCount = 0;

  for (let i = 1; i <= count; i++) {
    console.log(`\n[${i}/${count}] Menyiapkan gambar baru...`);
    const generated = PromptMatrix.generate();
    
    let rawBuffer: Buffer | null = null;
    
    // 1. Generate Image
    try {
      console.log(`-> Meminta FLUX menggambar: ${generated.categorySlug}`);
      const response = await axios.post(
        `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${model}`,
        { prompt: generated.prompt },
        { headers: { Authorization: `Bearer ${cfApiToken}` }, timeout: 60000 }
      );
      
      if (response.data?.success) {
        rawBuffer = Buffer.from(response.data.result.image, "base64");
      } else {
        console.error("❌ Cloudflare merespons tapi gagal.");
        continue;
      }
    } catch (err: any) {
      console.error(`❌ FLUX Error (Bisa jadi Rate Limit): ${err.message}`);
      // Jeda 5 detik jika kena rate limit
      await new Promise(resolve => setTimeout(resolve, 5000));
      continue;
    }

    if (!rawBuffer) continue;
    
    const fileName = `${generated.categorySlug}_${Date.now()}.jpg`;
    
    // 2. Generate Metadata
    console.log(`-> Menulis Metadata SEO dengan Gemini...`);
    let meta;
    try {
      meta = await aiMetadataEngine.generateMetadata(rawBuffer, fileName);
    } catch (e: any) {
      console.warn(`⚠️ Metadata gagal, pakai fallback: ${e.message}`);
      meta = await aiMetadataEngine.getSmartFallbackMetadata(fileName); // Fallback paksa
    }

    // 3. Inject Metadata
    console.log(`-> Menyuntikkan Metadata ke dalam foto...`);
    const finalPath = path.join(TARGET_DIR, fileName);
    
    try {
      await fs.writeFile(finalPath, rawBuffer);
      await MetadataEngine.injectMetadata(finalPath, {
        title: meta.title,
        description: meta.description,
        keywords: meta.keywords
      });
      console.log(`✅ BERHASIL: ${fileName} tersimpan di folder 'manual_upload'`);
      successCount++;
    } catch (err: any) {
      console.error(`❌ Gagal menyuntik metadata: ${err.message}`);
    }
    
    // Jeda 2 detik agar API tidak diblokir karena spam
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\n==================================================`);
  console.log(`🎉 SELESAI! ${successCount} gambar berhasil dibuat.`);
  console.log(`📂 Silakan buka folder: ${TARGET_DIR}`);
  console.log(`☁️ Anda tinggal Drag & Drop semua isinya ke Web Adobe Stock!`);
  console.log(`==================================================`);
}

// Ambil argumen jumlah dari terminal (default 10)
const args = process.argv.slice(2);
const count = args.length > 0 ? parseInt(args[0]) : 10;

generateManualBatch(count);

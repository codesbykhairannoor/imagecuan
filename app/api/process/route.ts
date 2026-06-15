/**
 * IMAGECUAN - API Route
 * Handles the background processing request.
 */

import { NextResponse } from "next/server";
import { processorEngine } from "@/lib/engine/processor";

export async function POST(request: Request) {
  try {
    // In a real scenario, we might trigger this via a webhook or file watcher
    // For now, it scans storage/raw
    await processorEngine.scanAndProcess();
    
    return NextResponse.json({ success: true, message: "Processing started" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

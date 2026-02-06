import { NextRequest, NextResponse } from "next/server";
import { isS3Configured, getPresignedUrl } from "@/lib/s3";

// GET /api/videos/stream?key=xxx - Redirect to S3/R2 presigned URL for video playback
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "key parameter is required" }, { status: 400 });
  }

  if (!isS3Configured()) {
    return NextResponse.json({ error: "S3 storage is not configured" }, { status: 500 });
  }

  try {
    const url = await getPresignedUrl(key);
    return NextResponse.redirect(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate stream URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

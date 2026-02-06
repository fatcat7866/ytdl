import { NextRequest, NextResponse } from "next/server";
import { getJobStatus } from "@/lib/jobs";

// GET /api/jobs/[id] - Get download job status
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const job = getJobStatus(id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: job.id,
    videoId: job.videoId,
    status: job.status,
    progress: job.progress,
    error: job.error,
  });
}

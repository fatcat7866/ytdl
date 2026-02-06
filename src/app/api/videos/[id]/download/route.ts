import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isS3Configured } from "@/lib/s3";
import { enqueue, getJobByVideoId } from "@/lib/jobs";

// POST /api/videos/[id]/download - Trigger video download to S3
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isS3Configured()) {
    return NextResponse.json(
      { error: "S3 storage is not configured. Set S3 environment variables in .env" },
      { status: 400 }
    );
  }

  const video = await prisma.video.findUnique({ where: { id } });
  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  if (video.downloadStatus === "completed") {
    return NextResponse.json({ status: "already_completed", s3Key: video.s3Key });
  }

  // Check if already in queue
  const existingJob = getJobByVideoId(id);
  if (existingJob) {
    return NextResponse.json({ jobId: existingJob.id, status: existingJob.status });
  }

  // Update status and enqueue
  await prisma.video.update({
    where: { id },
    data: { downloadStatus: "pending", downloadProgress: 0 },
  });

  const jobId = enqueue(id);

  return NextResponse.json({ jobId, status: "pending" });
}

import { prisma } from "./prisma";
import { downloadVideo } from "./ytdlp";
import { uploadFile, isS3Configured, getBucket } from "./s3";
import fs from "fs";
import path from "path";
import os from "os";

export interface JobState {
  id: string;
  videoId: string;
  status: "pending" | "downloading" | "uploading" | "completed" | "failed";
  progress: number;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

const globalForJobs = globalThis as unknown as {
  jobQueue: Map<string, JobState> | undefined;
  isProcessing: boolean | undefined;
};

const jobQueue: Map<string, JobState> = globalForJobs.jobQueue ?? new Map();
let isProcessing = globalForJobs.isProcessing ?? false;

if (process.env.NODE_ENV !== "production") {
  globalForJobs.jobQueue = jobQueue;
}

let jobCounter = 0;

export function enqueue(videoId: string): string {
  const id = `job_${Date.now()}_${++jobCounter}`;
  const job: JobState = {
    id,
    videoId,
    status: "pending",
    progress: 0,
  };
  jobQueue.set(id, job);
  processNext();
  return id;
}

export function getJobStatus(jobId: string): JobState | undefined {
  return jobQueue.get(jobId);
}

export function getJobByVideoId(videoId: string): JobState | undefined {
  for (const job of jobQueue.values()) {
    if (job.videoId === videoId && (job.status === "pending" || job.status === "downloading" || job.status === "uploading")) {
      return job;
    }
  }
  return undefined;
}

async function processNext(): Promise<void> {
  if (isProcessing) return;

  const pendingJob = Array.from(jobQueue.values()).find((j) => j.status === "pending");
  if (!pendingJob) return;

  isProcessing = true;
  if (process.env.NODE_ENV !== "production") {
    globalForJobs.isProcessing = true;
  }

  try {
    await processJob(pendingJob);
  } finally {
    isProcessing = false;
    if (process.env.NODE_ENV !== "production") {
      globalForJobs.isProcessing = false;
    }
    // Process next job in queue
    processNext();
  }
}

async function processJob(job: JobState): Promise<void> {
  const video = await prisma.video.findUnique({ where: { id: job.videoId } });
  if (!video) {
    job.status = "failed";
    job.error = "Video not found";
    return;
  }

  if (!isS3Configured()) {
    job.status = "failed";
    job.error = "S3 is not configured";
    await prisma.video.update({
      where: { id: video.id },
      data: { downloadStatus: "failed" },
    });
    return;
  }

  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, `ytdl-${video.youtubeId}.mp4`);

  try {
    // Phase 1: Download video
    job.status = "downloading";
    job.startedAt = new Date();
    await prisma.video.update({
      where: { id: video.id },
      data: { downloadStatus: "downloading", downloadProgress: 0 },
    });

    await downloadVideo(video.url, tmpFile, async (percent) => {
      job.progress = percent;
      // Update DB periodically (every 5%)
      if (Math.floor(percent) % 5 === 0) {
        await prisma.video.update({
          where: { id: video.id },
          data: { downloadProgress: percent },
        }).catch(() => {}); // Ignore DB update errors
      }
    });

    // Phase 2: Upload to S3
    job.status = "uploading";
    job.progress = 100;

    const stat = fs.statSync(tmpFile);
    const s3Key = `videos/${video.youtubeId}/${video.youtubeId}.mp4`;
    const readStream = fs.createReadStream(tmpFile);

    await uploadFile(s3Key, readStream, "video/mp4");

    // Update DB
    await prisma.video.update({
      where: { id: video.id },
      data: {
        downloadStatus: "completed",
        downloadProgress: 100,
        s3Key,
        s3Bucket: getBucket(),
        fileSize: stat.size,
        fileMimeType: "video/mp4",
      },
    });

    job.status = "completed";
    job.completedAt = new Date();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    job.status = "failed";
    job.error = errorMessage;

    await prisma.video.update({
      where: { id: video.id },
      data: { downloadStatus: "failed", downloadProgress: null },
    }).catch(() => {});
  } finally {
    // Clean up temp file
    try {
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
    } catch {}
  }
}

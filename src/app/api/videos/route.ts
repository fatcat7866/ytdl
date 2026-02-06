import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchMetadata } from "@/lib/ytdlp";
import { extractYouTubeId } from "@/lib/utils";
import { enqueue } from "@/lib/jobs";
import { Prisma } from "@prisma/client";

// GET /api/videos - List videos with search, filter, sort, pagination
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const tagIds = searchParams.get("tags")?.split(",").filter(Boolean) || [];
  const sort = searchParams.get("sort") || "createdAt";
  const order = searchParams.get("order") || "desc";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));

  const where: Prisma.VideoWhereInput = {};

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { channelName: { contains: search } },
    ];
  }

  if (tagIds.length > 0) {
    where.tags = {
      some: {
        tagId: { in: tagIds },
      },
    };
  }

  const orderBy: Prisma.VideoOrderByWithRelationInput = {};
  if (sort === "title") {
    orderBy.title = order as Prisma.SortOrder;
  } else if (sort === "uploadDate") {
    orderBy.uploadDate = order as Prisma.SortOrder;
  } else {
    orderBy.createdAt = order as Prisma.SortOrder;
  }

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        tags: {
          include: { tag: true },
        },
        comments: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
    }),
    prisma.video.count({ where }),
  ]);

  const formatted = videos.map((v) => ({
    ...v,
    tags: v.tags.map((vt) => vt.tag),
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
    comments: v.comments.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
  }));

  return NextResponse.json({
    videos: formatted,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

// POST /api/videos - Create a new video from YouTube URL
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { url, tagIds, downloadVideo } = body as {
    url: string;
    tagIds?: string[];
    downloadVideo?: boolean;
  };

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  const youtubeId = extractYouTubeId(url);
  if (!youtubeId) {
    return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
  }

  // Check for duplicates
  const existing = await prisma.video.findUnique({
    where: { youtubeId },
    include: { tags: { include: { tag: true } } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "This video is already saved", video: { ...existing, tags: existing.tags.map((vt) => vt.tag) } },
      { status: 409 }
    );
  }

  // Fetch metadata from yt-dlp
  let metadata;
  try {
    metadata = await fetchMetadata(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch metadata";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Create video record
  const video = await prisma.video.create({
    data: {
      youtubeId: metadata.id,
      url,
      title: metadata.title,
      description: metadata.description || null,
      channelName: metadata.channel || null,
      channelId: metadata.channel_id || null,
      thumbnailUrl: metadata.thumbnail || null,
      duration: metadata.duration ? Math.round(metadata.duration) : null,
      uploadDate: metadata.upload_date || null,
      viewCount: metadata.view_count || null,
      rawMetadata: JSON.stringify(metadata),
      downloadStatus: downloadVideo ? "pending" : "none",
      tags: tagIds?.length
        ? {
            create: tagIds.map((tagId) => ({
              tag: { connect: { id: tagId } },
            })),
          }
        : undefined,
    },
    include: {
      tags: { include: { tag: true } },
      comments: true,
    },
  });

  let jobId: string | undefined;
  if (downloadVideo) {
    jobId = enqueue(video.id);
  }

  return NextResponse.json({
    video: {
      ...video,
      tags: video.tags.map((vt) => vt.tag),
      createdAt: video.createdAt.toISOString(),
      updatedAt: video.updatedAt.toISOString(),
    },
    jobId,
  }, { status: 201 });
}

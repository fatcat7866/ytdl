import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFile, isS3Configured } from "@/lib/s3";

// 動画数が0件のタグを自動削除
async function cleanupEmptyTags(tagIds: string[]) {
  if (tagIds.length === 0) return;
  const tags = await prisma.tag.findMany({
    where: { id: { in: tagIds } },
    include: { _count: { select: { videos: true } } },
  });
  const emptyTagIds = tags.filter((t) => t._count.videos === 0).map((t) => t.id);
  if (emptyTagIds.length > 0) {
    await prisma.tag.deleteMany({ where: { id: { in: emptyTagIds } } });
  }
}

// GET /api/videos/[id] - Get single video with tags and comments
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const video = await prisma.video.findUnique({
    where: { id },
    include: {
      tags: { include: { tag: true } },
      comments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...video,
    tags: video.tags.map((vt) => vt.tag),
    createdAt: video.createdAt.toISOString(),
    updatedAt: video.updatedAt.toISOString(),
    comments: video.comments.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
  });
}

// PATCH /api/videos/[id] - Update video (title, description, tags)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { title, description, tagIds } = body as {
    title?: string;
    description?: string;
    tagIds?: string[];
  };

  const video = await prisma.video.findUnique({ where: { id } });
  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  // Update basic fields
  const updateData: Record<string, unknown> = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;

  // Update tags if provided
  if (tagIds !== undefined) {
    // 既存タグIDを取得（後でクリーンアップ用）
    const oldVideoTags = await prisma.videoTag.findMany({ where: { videoId: id } });
    const oldTagIds = oldVideoTags.map((vt) => vt.tagId);

    // Remove existing tags and re-create
    await prisma.videoTag.deleteMany({ where: { videoId: id } });
    if (tagIds.length > 0) {
      await prisma.videoTag.createMany({
        data: tagIds.map((tagId) => ({
          videoId: id,
          tagId,
        })),
      });
    }

    // 外されたタグが0件なら自動削除
    const removedTagIds = oldTagIds.filter((id) => !tagIds.includes(id));
    await cleanupEmptyTags(removedTagIds);
  }

  const updated = await prisma.video.update({
    where: { id },
    data: updateData,
    include: {
      tags: { include: { tag: true } },
      comments: { orderBy: { createdAt: "desc" } },
    },
  });

  return NextResponse.json({
    ...updated,
    tags: updated.tags.map((vt) => vt.tag),
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    comments: updated.comments.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
  });
}

// DELETE /api/videos/[id] - Delete video and S3 files
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const video = await prisma.video.findUnique({ where: { id } });
  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  // Delete S3 files if they exist
  if (isS3Configured()) {
    try {
      if (video.s3Key) await deleteFile(video.s3Key);
      if (video.thumbnailS3Key) await deleteFile(video.thumbnailS3Key);
    } catch {
      // Log but don't fail the delete operation
    }
  }

  // 削除前にタグIDを取得
  const videoTags = await prisma.videoTag.findMany({ where: { videoId: id } });
  const tagIds = videoTags.map((vt) => vt.tagId);

  await prisma.video.delete({ where: { id } });

  // 0件になったタグを自動削除
  await cleanupEmptyTags(tagIds);

  return NextResponse.json({ success: true });
}

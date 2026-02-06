"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VideoPlayer } from "@/components/video-player";
import { TagSelector } from "@/components/tag-selector";
import { CommentList } from "@/components/comment-list";
import { DownloadStatusPanel } from "@/components/download-status";
import { useVideo } from "@/hooks/use-video";
import { formatDuration, formatUploadDate, formatFileSize } from "@/lib/utils";
import { toast } from "sonner";
import {
  ArrowLeft,
  ExternalLink,
  Trash2,
  Calendar,
  Eye,
  Clock,
  User,
} from "lucide-react";
import type { TagInfo } from "@/types";

export default function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { video, isLoading, mutate } = useVideo(id);
  const [deleting, setDeleting] = useState(false);

  // Poll for download progress
  useEffect(() => {
    if (
      video?.downloadStatus === "pending" ||
      video?.downloadStatus === "downloading"
    ) {
      const interval = setInterval(() => mutate(), 2000);
      return () => clearInterval(interval);
    }
  }, [video?.downloadStatus, mutate]);

  const handleDelete = async () => {
    if (!confirm("この動画を削除しますか?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/videos/${id}`, { method: "DELETE" });
      if (res.ok) {
        await mutate(null, false);
        toast.success("動画を削除しました");
        router.push("/");
      } else {
        toast.error("削除に失敗しました");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/videos/${id}/download`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "ダウンロードの開始に失敗しました");
        return;
      }
      toast.success("ダウンロードを開始しました");
      mutate();
    } catch {
      toast.error("エラーが発生しました");
    }
  };

  const handleTagsChange = async (tags: TagInfo[]) => {
    try {
      await fetch(`/api/videos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagIds: tags.map((t) => t.id) }),
      });
      mutate();
    } catch {
      toast.error("タグの更新に失敗しました");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">読み込み中...</div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p>動画が見つかりません</p>
        <Link href="/">
          <Button>ホームに戻る</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              戻る
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4" />
            削除
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: Player + Metadata */}
          <div className="lg:col-span-2 space-y-6">
            <VideoPlayer
              youtubeId={video.youtubeId}
              s3Key={video.s3Key}
              downloadStatus={video.downloadStatus}
            />

            <div className="space-y-3">
              <h1 className="text-xl font-bold">{video.title}</h1>

              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {video.channelName && (
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {video.channelName}
                  </span>
                )}
                {video.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDuration(video.duration)}
                  </span>
                )}
                {video.uploadDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatUploadDate(video.uploadDate)}
                  </span>
                )}
                {video.viewCount && (
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {video.viewCount.toLocaleString()} 回視聴
                  </span>
                )}
              </div>

              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-500 hover:underline"
              >
                YouTubeで見る
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {video.description && (
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-sm mb-2">説明</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
                  {video.description}
                </p>
              </div>
            )}
          </div>

          {/* Right column: Tags + Download + Comments */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-medium text-sm">タグ</h3>
              <TagSelector
                selectedTags={video.tags}
                onTagsChange={handleTagsChange}
              />
            </div>

            <DownloadStatusPanel
              status={video.downloadStatus}
              progress={video.downloadProgress}
              fileSize={video.fileSize}
              onDownload={handleDownload}
            />

            <CommentList
              comments={video.comments}
              videoId={video.id}
              onCommentAdded={() => mutate()}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

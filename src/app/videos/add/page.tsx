"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TagSelector } from "@/components/tag-selector";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Video, Download, FileText } from "lucide-react";
import type { TagInfo } from "@/types";

export default function AddVideoPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedTags, setSelectedTags] = useState<TagInfo[]>([]);
  const [downloadVideo, setDownloadVideo] = useState(false);

  const saveVideo = async () => {
    if (!url.trim() || saving) return;
    setSaving(true);

    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          tagIds: selectedTags.map((t) => t.id),
          downloadVideo,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        toast.error("この動画は既に保存されています");
        if (data.video?.id) {
          router.push(`/videos/${data.video.id}`);
        }
        return;
      }

      if (!res.ok) {
        toast.error(data.error || "保存に失敗しました");
        return;
      }

      toast.success("動画を保存しました");
      router.push(`/videos/${data.video.id}`);
    } catch {
      toast.error("エラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              戻る
            </Button>
          </Link>
          <h1 className="font-semibold flex items-center gap-2">
            <Video className="h-5 w-5" />
            動画を追加
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium">YouTube URL</label>
          <div className="flex gap-2">
            <Input
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveVideo();
              }}
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">タグ</label>
          <TagSelector selectedTags={selectedTags} onTagsChange={setSelectedTags} />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">オプション</label>
          <div className="flex gap-3">
            <Button
              variant={!downloadVideo ? "default" : "outline"}
              size="sm"
              onClick={() => setDownloadVideo(false)}
              className="gap-1"
            >
              <FileText className="h-4 w-4" />
              メタデータのみ
            </Button>
            <Button
              variant={downloadVideo ? "default" : "outline"}
              size="sm"
              onClick={() => setDownloadVideo(true)}
              className="gap-1"
            >
              <Download className="h-4 w-4" />
              動画もダウンロード
            </Button>
          </div>
        </div>

        <Button
          onClick={saveVideo}
          disabled={!url.trim() || saving}
          className="w-full gap-2"
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              保存中...
            </>
          ) : (
            "保存する"
          )}
        </Button>
      </main>
    </div>
  );
}

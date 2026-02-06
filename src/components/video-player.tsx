"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MonitorPlay, Youtube } from "lucide-react";

export function VideoPlayer({
  youtubeId,
  s3Key,
  downloadStatus,
}: {
  youtubeId: string;
  s3Key?: string | null;
  downloadStatus: string;
}) {
  const hasLocalFile = s3Key && downloadStatus === "completed";
  const [useLocal, setUseLocal] = useState(false);

  return (
    <div className="space-y-2">
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {useLocal && hasLocalFile ? (
          <video
            controls
            className="w-full h-full"
            src={`/api/videos/stream?key=${encodeURIComponent(s3Key!)}`}
          />
        ) : (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
      {hasLocalFile && (
        <div className="flex gap-2">
          <Button
            variant={useLocal ? "outline" : "default"}
            size="sm"
            onClick={() => setUseLocal(false)}
            className="gap-1"
          >
            <Youtube className="h-4 w-4" />
            YouTube
          </Button>
          <Button
            variant={useLocal ? "default" : "outline"}
            size="sm"
            onClick={() => setUseLocal(true)}
            className="gap-1"
          >
            <MonitorPlay className="h-4 w-4" />
            ローカル再生
          </Button>
        </div>
      )}
    </div>
  );
}

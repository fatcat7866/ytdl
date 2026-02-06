"use client";

import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";
import { Download, CheckCircle, Clock, AlertCircle } from "lucide-react";
import type { VideoWithRelations } from "@/types";

function DownloadIcon({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return <Clock className="h-3 w-3 text-yellow-500" />;
    case "downloading":
      return <Download className="h-3 w-3 text-blue-500 animate-pulse" />;
    case "completed":
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    case "failed":
      return <AlertCircle className="h-3 w-3 text-red-500" />;
    default:
      return null;
  }
}

export function VideoCard({ video }: { video: VideoWithRelations }) {
  return (
    <Link href={`/videos/${video.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
        <div className="relative aspect-video bg-muted">
          {video.thumbnailUrl ? (
            <Image
              src={video.thumbnailUrl}
              alt={video.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No Thumbnail
            </div>
          )}
          {video.duration && (
            <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
              {formatDuration(video.duration)}
            </span>
          )}
          {video.downloadStatus !== "none" && (
            <span className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded">
              <DownloadIcon status={video.downloadStatus} />
            </span>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-medium text-sm line-clamp-2 mb-1">{video.title}</h3>
          {video.channelName && (
            <p className="text-xs text-muted-foreground mb-2">{video.channelName}</p>
          )}
          {video.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {video.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-xs"
                  style={tag.color ? { backgroundColor: tag.color + "20", color: tag.color, borderColor: tag.color + "40" } : undefined}
                >
                  {tag.name}
                </Badge>
              ))}
              {video.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{video.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}

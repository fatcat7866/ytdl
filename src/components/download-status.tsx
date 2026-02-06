"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatFileSize } from "@/lib/utils";
import { Download, CheckCircle, Clock, AlertCircle, CloudDownload } from "lucide-react";

export function DownloadStatusPanel({
  status,
  progress,
  fileSize,
  onDownload,
  s3Configured,
}: {
  status: string;
  progress?: number | null;
  fileSize?: number | null;
  onDownload: () => void;
  s3Configured?: boolean;
}) {
  if (status === "none") {
    return (
      <div className="border rounded-lg p-4 space-y-2">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <CloudDownload className="h-4 w-4" />
          動画ダウンロード
        </h4>
        {s3Configured === false ? (
          <p className="text-xs text-muted-foreground">
            S3ストレージが未設定です。.envファイルでS3の設定を行ってください。
          </p>
        ) : (
          <Button size="sm" onClick={onDownload} className="gap-1">
            <Download className="h-3 w-3" />
            動画をダウンロード
          </Button>
        )}
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="border rounded-lg p-4 space-y-2">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-yellow-500" />
          ダウンロード待ち
        </h4>
        <p className="text-xs text-muted-foreground">キューに入っています...</p>
      </div>
    );
  }

  if (status === "downloading") {
    return (
      <div className="border rounded-lg p-4 space-y-2">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Download className="h-4 w-4 text-blue-500 animate-pulse" />
          ダウンロード中
        </h4>
        <Progress value={progress || 0} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {(progress || 0).toFixed(1)}%
        </p>
      </div>
    );
  }

  if (status === "completed") {
    return (
      <div className="border rounded-lg p-4 space-y-2">
        <h4 className="text-sm font-medium flex items-center gap-2 text-green-600">
          <CheckCircle className="h-4 w-4" />
          ダウンロード完了
        </h4>
        {fileSize && (
          <p className="text-xs text-muted-foreground">
            ファイルサイズ: {formatFileSize(fileSize)}
          </p>
        )}
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="border rounded-lg p-4 space-y-2">
        <h4 className="text-sm font-medium flex items-center gap-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
          ダウンロード失敗
        </h4>
        <Button size="sm" variant="outline" onClick={onDownload} className="gap-1">
          <Download className="h-3 w-3" />
          再試行
        </Button>
      </div>
    );
  }

  return null;
}

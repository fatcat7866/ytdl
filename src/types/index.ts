export type DownloadStatus = "none" | "pending" | "downloading" | "completed" | "failed";

export interface VideoWithRelations {
  id: string;
  youtubeId: string;
  url: string;
  title: string;
  description: string | null;
  channelName: string | null;
  channelId: string | null;
  thumbnailUrl: string | null;
  thumbnailS3Key: string | null;
  duration: number | null;
  uploadDate: string | null;
  viewCount: number | null;
  downloadStatus: DownloadStatus;
  downloadProgress: number | null;
  s3Key: string | null;
  s3Bucket: string | null;
  fileSize: number | null;
  fileMimeType: string | null;
  createdAt: string;
  updatedAt: string;
  tags: TagInfo[];
  comments: CommentInfo[];
}

export interface TagInfo {
  id: string;
  name: string;
  color: string | null;
}

export interface TagWithCount extends TagInfo {
  _count: { videos: number };
}

export interface CommentInfo {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVideoRequest {
  url: string;
  tagIds?: string[];
  downloadVideo?: boolean;
}

export interface VideoListParams {
  search?: string;
  tags?: string[];
  sort?: "createdAt" | "title" | "uploadDate";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface VideoListResponse {
  videos: VideoWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface JobStatus {
  id: string;
  videoId: string;
  status: "pending" | "downloading" | "uploading" | "completed" | "failed";
  progress: number;
  error?: string;
}

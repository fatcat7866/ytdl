"use client";

import useSWR from "swr";
import type { VideoWithRelations } from "@/types";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export function useVideo(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<VideoWithRelations>(
    id ? `/api/videos/${id}` : null,
    fetcher
  );

  return {
    video: data,
    error,
    isLoading,
    mutate,
  };
}

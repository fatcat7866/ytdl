"use client";

import useSWR from "swr";
import type { VideoListResponse } from "@/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useVideos(params: {
  search?: string;
  tags?: string[];
  sort?: string;
  order?: string;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.tags?.length) searchParams.set("tags", params.tags.join(","));
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.order) searchParams.set("order", params.order);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const query = searchParams.toString();
  const url = `/api/videos${query ? `?${query}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR<VideoListResponse>(url, fetcher);

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}

"use client";

import useSWR from "swr";
import type { TagWithCount } from "@/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useTags() {
  const { data, error, isLoading, mutate } = useSWR<TagWithCount[]>(
    "/api/tags",
    fetcher
  );

  return {
    tags: data || [],
    error,
    isLoading,
    mutate,
  };
}

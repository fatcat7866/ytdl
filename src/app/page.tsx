"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/search-bar";
import { VideoGrid } from "@/components/video-grid";
import { useVideos } from "@/hooks/use-videos";
import { useTags } from "@/hooks/use-tags";
import { useDebounce } from "@/hooks/use-debounce";
import { Plus, Video } from "lucide-react";

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useVideos({
    search: debouncedSearch,
    tags: selectedTags,
    page,
    limit: 20,
  });

  const { tags } = useTags();

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
            <Video className="h-5 w-5" />
            YTDL
          </Link>

          <div className="flex-1 max-w-md">
            <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
          </div>

          <Link href="/videos/add">
            <Button className="gap-1 shrink-0">
              <Plus className="h-4 w-4" />
              追加
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            <Badge
              variant={selectedTags.length === 0 ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => { setSelectedTags([]); setPage(1); }}
            >
              すべて
            </Badge>
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                className="cursor-pointer gap-1"
                style={
                  tag.color
                    ? selectedTags.includes(tag.id)
                      ? { backgroundColor: tag.color, borderColor: tag.color }
                      : { color: tag.color, borderColor: tag.color + "60" }
                    : undefined
                }
                onClick={() => toggleTag(tag.id)}
              >
                {tag.name}
                <span className="text-xs opacity-60">{tag._count?.videos || 0}</span>
              </Badge>
            ))}
          </div>
        )}

        <VideoGrid
          videos={data?.videos || []}
          isLoading={isLoading}
        />

        {data && data.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              前へ
            </Button>
            <span className="flex items-center text-sm text-muted-foreground">
              {page} / {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage(page + 1)}
            >
              次へ
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

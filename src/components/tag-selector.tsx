"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTags } from "@/hooks/use-tags";
import { Plus, Tags, X } from "lucide-react";
import type { TagInfo } from "@/types";

const TAG_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

export function TagSelector({
  selectedTags,
  onTagsChange,
}: {
  selectedTags: TagInfo[];
  onTagsChange: (tags: TagInfo[]) => void;
}) {
  const { tags, mutate: mutateTags } = useTags();
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [creating, setCreating] = useState(false);

  const selectedIds = new Set(selectedTags.map((t) => t.id));

  const toggleTag = (tag: TagInfo) => {
    if (selectedIds.has(tag.id)) {
      onTagsChange(selectedTags.filter((t) => t.id !== tag.id));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const removeTag = (tagId: string) => {
    onTagsChange(selectedTags.filter((t) => t.id !== tagId));
  };

  const createTag = async () => {
    if (!newTagName.trim() || creating) return;
    setCreating(true);
    try {
      const color = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim(), color }),
      });
      if (res.ok) {
        const tag = await res.json();
        mutateTags();
        onTagsChange([...selectedTags, tag]);
        setNewTagName("");
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="gap-1"
            style={tag.color ? { backgroundColor: tag.color + "20", color: tag.color } : undefined}
          >
            {tag.name}
            <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag.id)} />
          </Badge>
        ))}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-6 gap-1 text-xs">
              <Tags className="h-3 w-3" />
              タグ追加
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="space-y-2">
              <div className="flex gap-1">
                <Input
                  placeholder="新しいタグ..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") createTag();
                  }}
                  className="h-7 text-xs"
                />
                <Button
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={createTag}
                  disabled={!newTagName.trim() || creating}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-0.5">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    className={`w-full text-left px-2 py-1 rounded text-xs hover:bg-accent flex items-center gap-2 ${
                      selectedIds.has(tag.id) ? "bg-accent" : ""
                    }`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag.color && (
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                    )}
                    {tag.name}
                    <span className="text-muted-foreground ml-auto">
                      {tag._count?.videos || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

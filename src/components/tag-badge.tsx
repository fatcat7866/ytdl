"use client";

import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { TagInfo } from "@/types";

export function TagBadge({
  tag,
  selected,
  onToggle,
  onRemove,
}: {
  tag: TagInfo;
  selected?: boolean;
  onToggle?: () => void;
  onRemove?: () => void;
}) {
  const style = tag.color
    ? {
        backgroundColor: selected ? tag.color + "30" : tag.color + "15",
        color: tag.color,
        borderColor: tag.color + "50",
      }
    : undefined;

  return (
    <Badge
      variant={selected ? "default" : "outline"}
      className="cursor-pointer text-xs gap-1"
      style={style}
      onClick={onToggle}
    >
      {tag.name}
      {onRemove && (
        <X
          className="h-3 w-3 hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        />
      )}
    </Badge>
  );
}

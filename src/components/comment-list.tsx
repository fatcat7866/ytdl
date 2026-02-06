"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import { Trash2, Edit2, Check, X } from "lucide-react";
import type { CommentInfo } from "@/types";

export function CommentList({
  comments,
  videoId,
  onCommentAdded,
}: {
  comments: CommentInfo[];
  videoId: string;
  onCommentAdded: () => void;
}) {
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const addComment = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/videos/${videoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (res.ok) {
        setNewComment("");
        onCommentAdded();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    const res = await fetch(`/api/videos/${videoId}/comments?commentId=${commentId}`, {
      method: "DELETE",
    });
    if (res.ok) onCommentAdded();
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">メモ / コメント</h3>

      <div className="space-y-2">
        <Textarea
          placeholder="メモを追加..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
          className="text-sm"
        />
        <Button
          size="sm"
          onClick={addComment}
          disabled={!newComment.trim() || submitting}
        >
          追加
        </Button>
      </div>

      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="border rounded-lg p-3 text-sm space-y-1">
            {editingId === comment.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={async () => {
                      // TODO: implement update API
                      setEditingId(null);
                    }}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="whitespace-pre-wrap">{comment.content}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(comment.createdAt)}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditContent(comment.content);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      onClick={() => deleteComment(comment.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

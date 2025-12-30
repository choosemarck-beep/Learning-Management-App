"use client";

import React, { useState, useEffect } from "react";
import { X, Send } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";
import styles from "./ReelCommentsModal.module.css";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

interface ReelCommentsModalProps {
  videoId: string;
  videoTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded?: () => void;
}

export const ReelCommentsModal: React.FC<ReelCommentsModalProps> = ({
  videoId,
  videoTitle,
  isOpen,
  onClose,
  onCommentAdded,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (isOpen && videoId) {
      fetchComments();
    }
  }, [isOpen, videoId, page]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/reels/${videoId}/comments?page=${page}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          if (page === 1) {
            setComments(data.data.comments);
          } else {
            setComments((prev) => [...prev, ...data.data.comments]);
          }
          setHasMore(data.data.pagination.page < data.data.pagination.totalPages);
        }
      }
    } catch (error) {
      console.error("[ReelCommentsModal] Error fetching comments:", error);
      toast.error("Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/reels/${videoId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Add new comment to the top of the list
          setComments((prev) => [data.data, ...prev]);
          setNewComment("");
          toast.success("Comment added");
          onCommentAdded?.();
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to add comment");
      }
    } catch (error) {
      console.error("[ReelCommentsModal] Error submitting comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={styles.modal}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Comments</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        {/* Video Title */}
        <div className={styles.videoTitle}>{videoTitle}</div>

        {/* Comments List */}
        <div className={styles.commentsList}>
          {isLoading && comments.length === 0 ? (
            <div className={styles.loading}>Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className={styles.emptyState}>No comments yet. Be the first to comment!</div>
          ) : (
            <>
              {comments.map((comment) => (
                <div key={comment.id} className={styles.comment}>
                  <div className={styles.commentAvatar}>
                    {comment.user.avatar ? (
                      <img src={comment.user.avatar} alt={comment.user.name} />
                    ) : (
                      <span>{comment.user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className={styles.commentContent}>
                    <div className={styles.commentHeader}>
                      <span className={styles.commentAuthor}>{comment.user.name}</span>
                      <span className={styles.commentDate}>{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className={styles.commentText}>{comment.content}</p>
                  </div>
                </div>
              ))}
              {hasMore && (
                <button
                  className={styles.loadMore}
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Load more"}
                </button>
              )}
            </>
          )}
        </div>

        {/* Comment Input */}
        <form onSubmit={handleSubmitComment} className={styles.commentForm}>
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className={styles.commentInput}
            maxLength={500}
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!newComment.trim() || isSubmitting}
            className={styles.submitButton}
          >
            <Send size={18} />
          </Button>
        </form>
      </div>
    </Modal>
  );
};


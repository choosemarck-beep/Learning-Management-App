"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import styles from "./AnnouncementManagement.module.css";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "GENERAL" | "QUIZ" | "NEW_TRAINING" | "IMPORTANT";
  trainerId: string | null;
  trainer?: { id: string; name: string; email: string } | null;
  isActive: boolean;
  priority: number;
  expiresAt: string | null;
  createdAt: string;
}

export interface Trainer {
  id: string;
  name: string;
  email: string;
}

export const AnnouncementManagement: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "GENERAL" as Announcement["type"],
    trainerId: "",
    priority: 0,
    expiresAt: "",
    isActive: true,
  });

  useEffect(() => {
    fetchAnnouncements();
    fetchTrainers();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/announcements");
      const data = await response.json();

      if (data.success) {
        setAnnouncements(data.data);
      } else {
        toast.error(data.error || "Failed to load announcements");
      }
    } catch (error) {
      toast.error("Failed to load announcements");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTrainers = async () => {
    try {
      const response = await fetch("/api/admin/users?role=TRAINER");
      const data = await response.json();

      if (data.success) {
        setTrainers(data.data);
      }
    } catch (error) {
      console.error("Failed to load trainers:", error);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({
      title: "",
      content: "",
      type: "GENERAL",
      trainerId: "",
      priority: 0,
      expiresAt: "",
      isActive: true,
    });
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      trainerId: announcement.trainerId || "",
      priority: announcement.priority,
      expiresAt: announcement.expiresAt
        ? new Date(announcement.expiresAt).toISOString().split("T")[0]
        : "",
      isActive: announcement.isActive,
    });
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      toast.error("Title and content are required");
      return;
    }

    try {
      const url = editingId
        ? `/api/admin/announcements/${editingId}`
        : "/api/admin/announcements";
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          trainerId: formData.trainerId || null,
          expiresAt: formData.expiresAt || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          editingId
            ? "Announcement updated successfully"
            : "Announcement created successfully"
        );
        setIsCreating(false);
        setEditingId(null);
        fetchAnnouncements();
      } else {
        toast.error(data.error || "Failed to save announcement");
      }
    } catch (error) {
      toast.error("Failed to save announcement");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?"))
      return;

    try {
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Announcement deleted successfully");
        fetchAnnouncements();
      } else {
        toast.error(data.error || "Failed to delete announcement");
      }
    } catch (error) {
      toast.error("Failed to delete announcement");
    }
  };

  if (isLoading) {
    return <p>Loading announcements...</p>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button onClick={handleCreate} variant="primary">
          <Plus size={18} />
          Create Announcement
        </Button>
      </div>

      {(isCreating || editingId) && (
        <Card className={styles.formCard}>
          <CardHeader>
            <h2>{editingId ? "Edit Announcement" : "Create Announcement"}</h2>
            <button
              onClick={() => {
                setIsCreating(false);
                setEditingId(null);
              }}
              className={styles.closeButton}
            >
              <X size={20} />
            </button>
          </CardHeader>
          <CardBody>
            <div className={styles.form}>
              <Input
                label="Title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Announcement title"
                required
              />
              <Textarea
                label="Content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Announcement content"
                rows={4}
                required
              />
              <Select
                label="Type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as Announcement["type"],
                  })
                }
              >
                <option value="GENERAL">General</option>
                <option value="QUIZ">Quiz</option>
                <option value="NEW_TRAINING">New Training</option>
                <option value="IMPORTANT">Important</option>
              </Select>
              <Select
                label="Trainer (Optional)"
                value={formData.trainerId}
                onChange={(e) =>
                  setFormData({ ...formData, trainerId: e.target.value })
                }
              >
                <option value="">None</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.email})
                  </option>
                ))}
              </Select>
              <Input
                label="Priority (0-100)"
                type="number"
                min="0"
                max="100"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: parseInt(e.target.value) || 0,
                  })
                }
              />
              <Input
                label="Expires At (Optional)"
                type="date"
                value={formData.expiresAt}
                onChange={(e) =>
                  setFormData({ ...formData, expiresAt: e.target.value })
                }
              />
              <div className={styles.formActions}>
                <Button onClick={handleSubmit} variant="primary">
                  {editingId ? "Update" : "Create"}
                </Button>
                <Button
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <div className={styles.announcementsList}>
        {announcements.map((announcement) => (
          <Card key={announcement.id} className={styles.announcementCard}>
            <CardHeader>
              <div className={styles.announcementHeader}>
                <div>
                  <h3>{announcement.title}</h3>
                  <span className={styles.announcementType}>
                    {announcement.type.replace("_", " ")}
                  </span>
                </div>
                <div className={styles.announcementActions}>
                  <button
                    onClick={() => handleEdit(announcement)}
                    className={styles.actionButton}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className={styles.actionButton}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <p>{announcement.content}</p>
              <div className={styles.announcementMeta}>
                {announcement.trainer && (
                  <span>From: {announcement.trainer.name}</span>
                )}
                <span>Priority: {announcement.priority}</span>
                <span>
                  {announcement.isActive ? "Active" : "Inactive"}
                </span>
                {announcement.expiresAt && (
                  <span>
                    Expires: {new Date(announcement.expiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};


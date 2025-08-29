"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/authContext";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CreatePostDialog({
  onClose,
  authorId,
  onPostCreated,
}: {
  onClose: () => void;
  authorId: string;
  onPostCreated: () => void;
}) {
  const { authFetch } = useAuth();
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [category, setCategory] = useState<"GENERAL" | "ANNOUNCEMENT" | "QUESTION">("GENERAL");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const handleFileChange = (f?: File | null) => {
    setError(null);
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (!f.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setError("Image is too large. Max 5MB.");
      return;
    }
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  async function uploadToSupabase(fileToUpload: File, userId: string) {
    const supabase = createSupabaseClient();
    const ext = fileToUpload.name.split(".").pop() ?? "bin";
    const filePath = `${userId}/${Date.now()}.${ext}`;

    setUploading(true);
    try {
      const { error: uploadErr } = await supabase.storage
        .from("posts")
        .upload(filePath, fileToUpload, { upsert: false });

      if (uploadErr) throw uploadErr;

      const { data: publicData } = supabase.storage
        .from("posts")
        .getPublicUrl(filePath);
      return publicData?.publicUrl ?? null;
    } finally {
      setUploading(false);
    }
  }

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (!content.trim()) {
      setError("Post content can't be empty.");
      return;
    }
    if (content.trim().length > 280) {
      setError("Post content can't exceed 280 characters.");
      return;
    }

    setSubmitting(true);

    try {
      let imageUrl: string | null = null;
      if (file) {
        imageUrl = await uploadToSupabase(file, authorId);
      }

      const payload = {
        content: content.trim(),
        imageUrl,
        category,
        authorId,
      } as const;

      const res = authFetch
        ? await authFetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body?.message || `Failed to create post (status ${res.status})`
        );
      }

      setContent("");
      setFile(null);
      setPreview(null);
      setCategory("GENERAL");
      onPostCreated();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create post</DialogTitle>
          <DialogDescription>
            Be kind — posts are limited to 280 characters.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={280}
            rows={5}
            placeholder="What's on your mind?"
          />

          <div>
            <label className="block text-sm mb-2">Category</label>
            <Select value={category} onValueChange={(val: any) => setCategory(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GENERAL">General</SelectItem>
                <SelectItem value="ANNOUNCEMENT">Announcement</SelectItem>
                <SelectItem value="QUESTION">Question</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm mb-2">Optional image</label>
            <Input
              id="post-image"
              type="file"
              accept="image/*"
              onChange={(ev) => handleFileChange(ev.target.files?.[0] ?? null)}
            />
            {uploading && (
              <p className="mt-1 text-sm text-muted-foreground">Uploading...</p>
            )}
            {preview && (
              <div className="mt-3 border rounded-md overflow-hidden max-h-60">
                <img
                  src={preview}
                  alt="preview"
                  className="w-full object-cover"
                />
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive mt-2">{error}</p>
          )}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={onClose}
              type="button"
              disabled={submitting || uploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || uploading}>
              {submitting ? "Posting..." : "Post"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";
import { Button } from "@/components/ui/button";
import CreatePostDialog from "@/components/post/createPostDialog";
import PostFeed from "@/components/feeds/PostFeed";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function RootPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-col gap-4  mx-auto ">
      <div className="flex items-center justify-between px-2 ">
        <div>
          <h1 className="text-2xl font-bold"> Welcome back</h1>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setOpen(true)}>Add Post</Button>
        </div>
      </div>

      <ScrollArea className="w-full h-[80vh]">
        <PostFeed />
      </ScrollArea>
      {open && (
        <CreatePostDialog
          onClose={() => setOpen(false)}
          authorId={user.id}
          onPostCreated={() => {
            setOpen(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/context/authContext";
import { Send, Heart, MessageCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {PostSkeleton} from "@/app/loaders/skeletonLoaders";

type User = {
  id: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: User;
};

type Post = {
  id: string;
  content: string;
  imageUrl?: string | null;
  category: "GENERAL" | "ANNOUNCEMENT" | "QUESTION";
  likeCount: number;
  commentCount: number;
  createdAt: string;
  author: User;
  likedByMe?: boolean;
  comments?: Comment[]; // loaded on demand
};

export default function PostFeed() {
  const { authFetch, user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // per-post UI state
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});
  const [commentsLoadingMap, setCommentsLoadingMap] = useState<
    Record<string, boolean>
  >({});
  const [inputMap, setInputMap] = useState<Record<string, string>>({});

  // fetch posts (paginated) with dedupe
  const fetchPosts = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await (authFetch
        ? authFetch(`/api/posts?page=${page}&limit=6`)
        : fetch(`/api/posts?page=${page}&limit=6`));
      if (!res.ok) throw new Error("Failed to load posts");
      const data = await res.json();

      setPosts((prev) => {
        const existing = new Set(prev.map((p) => p.id));
        const incoming: Post[] = data.posts ?? [];
        const newOnes = incoming.filter((p) => !existing.has(p.id));
        return [...prev, ...newOnes];
      });

      setHasMore(Boolean(data.hasMore));
      setPage((p) => p + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, hasMore, loading, authFetch]);

  // infinite scroll observer
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchPosts();
      },
      { threshold: 1 }
    );
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [fetchPosts]);

  useEffect(() => {
    // initial load
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // toggle like (optimistic)
  const toggleLike = async (postId: string) => {
    setPosts((p) =>
      p.map((post) =>
        post.id === postId
          ? {
              ...post,
              likedByMe: !post.likedByMe,
              likeCount: post.likeCount + (post.likedByMe ? -1 : 1),
            }
          : post
      )
    );
    try {
      const res = await (authFetch
        ? authFetch(`/api/posts/${postId}/like`, { method: "POST" })
        : fetch(`/api/posts/${postId}/like`, { method: "POST" }));
      if (!res.ok) throw new Error("Like failed");
      const body = await res.json();
      setPosts((p) =>
        p.map((post) =>
          post.id === postId
            ? { ...post, likedByMe: body.liked, likeCount: body.likeCount }
            : post
        )
      );
    } catch (err) {
      console.error(err);
      // revert by refetching post (light approach) or toggle back
      setPosts((p) =>
        p.map((post) =>
          post.id === postId
            ? {
                ...post,
                likedByMe: !post.likedByMe,
                likeCount: post.likeCount + (post.likedByMe ? -1 : 1),
              }
            : post
        )
      );
    }
  };

  // open comments (accordion) - loads comments on first open
  const openComments = async (postId: string) => {
    setOpenMap((s) => ({ ...s, [postId]: true }));
    if (commentsMap[postId]) return; // already have them
    setCommentsLoadingMap((s) => ({ ...s, [postId]: true }));
    try {
      const res = await (authFetch
        ? authFetch(`/api/posts/${postId}/comments`)
        : fetch(`/api/posts/${postId}/comments`));
      if (!res.ok) throw new Error("Failed to fetch comments");
      const body = await res.json();
      setCommentsMap((s) => ({ ...s, [postId]: body.comments ?? [] }));
    } catch (err) {
      console.error(err);
      setCommentsMap((s) => ({ ...s, [postId]: [] }));
    } finally {
      setCommentsLoadingMap((s) => ({ ...s, [postId]: false }));
    }
  };

  // close comments accordion
  const closeComments = (postId: string) => {
    setOpenMap((s) => ({ ...s, [postId]: false }));
  };

  // add comment (optimistic)
  const addComment = async (postId: string) => {
    const text = (inputMap[postId] || "").trim();
    if (!text) return;

    // optimistic temp comment
    const temp: Comment = {
      id: `temp-${Date.now()}`,
      content: text,
      createdAt: new Date().toISOString(),
      author: {
        id: user!.id,
        username: user!.user_metadata?.username ?? user!.id.slice(0, 6),
        avatarUrl: (user!.user_metadata?.avatarUrl as string) ?? null,
      },
    };

    // show comments accordion if closed
    if (!openMap[postId]) setOpenMap((s) => ({ ...s, [postId]: true }));

    setCommentsMap((s) => ({ ...s, [postId]: [...(s[postId] ?? []), temp] }));
    setInputMap((s) => ({ ...s, [postId]: "" }));
    // increment commentCount locally
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p
      )
    );

    try {
      const res = await (authFetch
        ? authFetch(`/api/posts/${postId}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: text }),
          })
        : fetch(`/api/posts/${postId}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: text }),
          }));
      if (!res.ok) throw new Error("Comment failed");
      const body = await res.json();
      // replace temp comment with server comment (match by content + temp id)
      setCommentsMap((s) => {
        const list = s[postId] ?? [];
        const replaced = list.map((c) => (c.id === temp.id ? body.comment : c));
        // if not replaced (server returned new item), append at end
        if (!replaced.find((c) => c.id === body.comment.id))
          replaced.push(body.comment);
        return { ...s, [postId]: replaced };
      });
    } catch (err) {
      console.error(err);
      // remove temp and decrement count
      setCommentsMap((s) => ({
        ...s,
        [postId]: (s[postId] ?? []).filter((c) => c.id !== temp.id),
      }));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, commentCount: Math.max(0, p.commentCount - 1) }
            : p
        )
      );
    }
  };

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-6">
        {posts.map((post) => {
          const open = Boolean(openMap[post.id]);
          const comments = commentsMap[post.id] ?? [];
          return (
            <article
              key={`${post.id}`}
              className="rounded-2xl border bg-card p-4 shadow-sm"
            >
              {/* header */}
              <div className="flex items-center gap-3 mb-3">
                <Avatar>
                  {post.author.avatarUrl ? (
                    <AvatarImage src={post.author.avatarUrl} />
                  ) : (
                    <AvatarFallback>
                      {post.author.username?.[0] ?? "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        {post.author.username ??
                          post.author.firstName ??
                          "User"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(post.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {post.category}
                    </div>
                  </div>
                </div>
              </div>

              {/* content */}
              <p className="whitespace-pre-wrap mb-3 text-sm">{post.content}</p>

              {post.imageUrl && (
                <div className="mb-3 rounded-lg overflow-hidden bg-black/5">
                  <img
                    src={post.imageUrl}
                    alt="post"
                    className="w-full h-auto max-h-[480px] object-cover"
                  />
                </div>
              )}

              {/* actions */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleLike(post.id)}
                    aria-label="Like"
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        post.likedByMe
                          ? "text-red-500"
                          : "text-muted-foreground"
                      }`}
                    />
                  </Button>
                  <div className="text-sm">{post.likeCount}</div>

                  <Collapsible
                    open={open}
                    onOpenChange={(isOpen) => {
                      if (isOpen) openComments(post.id);
                      else closeComments(post.id);
                    }}
                  >
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Comments">
                        <MessageCircle className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {/* empty — comments section rendered below */}
                    </CollapsibleContent>
                  </Collapsible>

                  <div className="text-sm">{post.commentCount}</div>
                </div>

                <div className="text-xs text-muted-foreground">
                  {new Date(post.createdAt).toLocaleString()}
                </div>
              </div>

              {/* comments accordion (instagram-like) */}
              <div
                className={`overflow-hidden transition-[max-height,opacity] duration-300 ${
                  open ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="border-t pt-3 space-y-3">
                  {/* show a ScrollArea for long comment lists */}
                  <ScrollArea className="max-h-48">
                    <div className="space-y-3 p-1">
                      {commentsLoadingMap[post.id] ? (
                        <div className="text-sm text-muted-foreground">
                          Loading comments...
                        </div>
                      ) : comments.length ? (
                        comments.map((c) => (
                          <div key={c.id} className="flex gap-3 items-start">
                            <Avatar className="h-8 w-8">
                              {c.author.avatarUrl ? (
                                <AvatarImage src={c.author.avatarUrl} />
                              ) : (
                                <AvatarFallback>
                                  {c.author.username?.[0] ?? "U"}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex-1">
                              <div className="bg-muted rounded-lg px-3 py-2">
                                <p className="text-sm">
                                  <span className="font-medium mr-2">
                                    {c.author.username}
                                  </span>
                                  {c.content}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(c.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground px-2">
                          No comments yet — be the first to comment.
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* comment input (send icon) */}
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                    <Avatar className="h-8 w-8">
                      {user?.user_metadata?.avatarUrl ? (
                        <AvatarImage
                          src={user.user_metadata.avatarUrl as string}
                        />
                      ) : (
                        <AvatarFallback>
                          {user?.user_metadata?.username?.[0] ??
                            user?.id?.slice(0, 1) ??
                            "U"}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    <Input
                      placeholder="Add a comment..."
                      value={inputMap[post.id] ?? ""}
                      onChange={(e) =>
                        setInputMap((s) => ({
                          ...s,
                          [post.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          addComment(post.id);
                        }
                      }}
                    />

                    <Button
                      variant="ghost"
                      onClick={() => addComment(post.id)}
                      aria-label="Send comment"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
        <div ref={loaderRef} className="py-6 space-y-6">
          {loading ? (
            <>
              <PostSkeleton />
              <PostSkeleton />
            </>
          ) : hasMore ? (
            <p className="text-center text-sm text-muted-foreground">
              Scroll for more
            </p>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              No more posts
            </p>
          )}
        </div>
      </div>
    </>
  );
}

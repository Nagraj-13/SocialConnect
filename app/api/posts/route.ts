// app/api/posts/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/supabase/server";
import { createPostNotification } from "@/lib/notifications";

const DEFAULT_LIMIT = 10;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = Math.max(0, Number(url.searchParams.get("page") ?? 0));
    const limit = Math.min(50, Number(url.searchParams.get("limit") ?? DEFAULT_LIMIT));
    const skip = page * limit;

    // try to read current user to build likedByMe
    const currentUserId = await getCurrentUserId();

    const posts = await prisma.post.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit + 1, // fetch one extra to detect hasMore
      include: {
        author: { select: { id: true, username: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    const hasMore = posts.length > limit;
    if (hasMore) posts.pop(); // drop the extra

    // For each post, determine likedByMe if user exists
    let likedMap: Record<string, boolean> = {};
    if (currentUserId) {
      const likes = await prisma.like.findMany({
        where: { userId: currentUserId, postId: { in: posts.map((p) => p.id) } },
        select: { postId: true },
      });
      likedMap = Object.fromEntries(likes.map((l) => [l.postId, true]));
    }

    const serialized = posts.map((p) => ({
      id: p.id,
      content: p.content,
      imageUrl: p.imageUrl,
      category: p.category,
      likeCount: p.likeCount,
      commentCount: p.commentCount,
      createdAt: p.createdAt,
      author: p.author,
      likedByMe: !!likedMap[p.id],
    }));

    return NextResponse.json({ posts: serialized, hasMore });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const content: string = body.content;
    const imageUrl: string | null = body.imageUrl ?? null;
    const category: string = body.category ?? "GENERAL";

    if (!content || !content.trim()) {
      return NextResponse.json({ message: "Content required" }, { status: 400 });
    }
    if (content.length > 280) {
      return NextResponse.json({ message: "Content too long" }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        imageUrl,
        category: category as any,
        author: { connect: { id: userId } },
      },
      include: {
        author: { select: { id: true, username: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
    await createPostNotification(userId, post.id);
    const serialized = {
      id: post.id,
      content: post.content,
      imageUrl: post.imageUrl,
      category: post.category,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      createdAt: post.createdAt,
      author: post.author,
      likedByMe: false,
    };

    return NextResponse.json({ post: serialized }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Failed to create post" }, { status: 500 });
  }
}

// app/api/posts/[id]/like/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } 
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id: postId } = await context.params;

    // fetch post (to know the owner for notifications)
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });
    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      // remove like
      await prisma.$transaction([
        prisma.like.delete({ where: { id: existing.id } }),
        prisma.post.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } },
        }),
      ]);

      const updated = await prisma.post.findUnique({
        where: { id: postId },
        select: { likeCount: true },
      });

      return NextResponse.json({
        liked: false,
        likeCount: updated?.likeCount ?? 0,
      });
    } else {
      // add like
      await prisma.$transaction([
        prisma.like.create({
          data: {
            user: { connect: { id: userId } },
            post: { connect: { id: postId } },
          },
        }),
        prisma.post.update({
          where: { id: postId },
          data: { likeCount: { increment: 1 } },
        }),
      ]);

      // 🔔 Create notification if liker is not the post owner
      if (post.authorId !== userId) {
        await prisma.notification.create({
          data: {
            type: "LIKE",
            message: "liked your post",
            recipient: { connect: { id: post.authorId } },
            sender: { connect: { id: userId } },
            post: { connect: { id: postId } },
          },
        });
      }

      const updated = await prisma.post.findUnique({
        where: { id: postId },
        select: { likeCount: true },
      });

      return NextResponse.json({
        liked: true,
        likeCount: updated?.likeCount ?? 0,
      });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Failed to toggle like" },
      { status: 500 }
    );
  }
}

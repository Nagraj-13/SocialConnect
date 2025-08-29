// app/api/posts/[id]/comments/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/supabase/server";
import { createCommentNotification } from "@/lib/notifications";

/**
 * Note: `context.params` is async in App Router handlers.
 * Await it before reading `id`.
 */

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> } // params is a Promise
) {
    try {
        const { id: postId } = await context.params; // <- await here
        const comments = await prisma.comment.findMany({
            where: { postId, isActive: true },
            orderBy: { createdAt: "asc" },
            include: { author: { select: { id: true, username: true, avatarUrl: true } } },
        });

        return NextResponse.json({ comments });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ message: "Failed to fetch comments" }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { id: postId } = await context.params;
        const body = await req.json();
        const content: string = body.content;

        if (!content || !content.trim() || content.trim().length > 200) {
            return NextResponse.json({ message: "Invalid comment" }, { status: 400 });
        }

        // Get post author so we know who to notify
        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { authorId: true },
        });
        if (!post) {
            return NextResponse.json({ message: "Post not found" }, { status: 404 });
        }

        const [comment] = await prisma.$transaction([
            prisma.comment.create({
                data: {
                    content: content.trim(),
                    author: { connect: { id: userId } },
                    post: { connect: { id: postId } },
                },
                include: { author: { select: { id: true, username: true, avatarUrl: true } } },
            }),
            prisma.post.update({
                where: { id: postId },
                data: { commentCount: { increment: 1 } },
            }),
        ]);
        if (post.authorId !== userId) {
            await prisma.notification.create({
                data: {
                    type: "COMMENT",
                    message: "commented on your post",
                    recipient: { connect: { id: post.authorId } },
                    sender: { connect: { id: userId } },
                    post: { connect: { id: postId } },
                },
            });
        }


        return NextResponse.json({ comment }, { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ message: "Failed to create comment" }, { status: 500 });
    }
}
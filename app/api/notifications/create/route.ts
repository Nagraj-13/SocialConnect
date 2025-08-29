// app/api/notifications/create/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const senderId = await getCurrentUserId();
    if (!senderId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { recipientId, type, postId } = await req.json();

    const notification = await prisma.notification.create({
      data: {
        type,
        recipientId,
        senderId,
        postId: postId ?? null,
        message:
          type === "FOLLOW"
            ? "started following you"
            : type === "COMMENT"
            ? "commented on your post"
            : type === "LIKE"
            ? "liked your post"
            : "new activity",
      },
      include: { sender: true, post: true },
    });

    return NextResponse.json({ notification });
  } catch (error) {
    console.error("Create notification error:", error);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}

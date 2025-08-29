// app/api/admin/users/[id]/posts/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const currentUser = await prisma.user.findUnique({ where: { id: currentUserId }, select: { role: true }});
    if (!currentUser || currentUser.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { id } = await context.params;

    const posts = await prisma.post.findMany({
      where: { authorId: id },
      orderBy: { createdAt: "desc" },
      select: { id: true, content: true, imageUrl: true, createdAt: true, authorId: true },
    });

    return NextResponse.json({ posts });
  } catch (err) {
    console.error("GET admin user posts error", err);
    return NextResponse.json({ message: "Failed to fetch posts" }, { status: 500 });
  }
}

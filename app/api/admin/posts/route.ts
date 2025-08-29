// app/api/admin/posts/[id]/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const currentUser = await prisma.user.findUnique({ where: { id: currentUserId }, select: { role: true }});
    if (!currentUser || currentUser.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { id } = await context.params;

    await prisma.post.delete({ where: { id } });

    return NextResponse.json({ message: "Post deleted" });
  } catch (err) {
    console.error("DELETE /api/admin/posts/[id] error", err);
    return NextResponse.json({ message: "Failed to delete post" }, { status: 500 });
  }
}

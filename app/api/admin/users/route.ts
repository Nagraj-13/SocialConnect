// app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const currentUser = await prisma.user.findUnique({ where: { id: currentUserId }, select: { role: true }});
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Fetch users with counts
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { posts: true, followers: true, following: true }
        }
      },
    });

    return NextResponse.json({ users });
  } catch (err) {
    console.error("GET /api/admin/users error", err);
    return NextResponse.json({ message: "Failed to fetch users" }, { status: 500 });
  }
}

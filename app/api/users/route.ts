// app/api/users/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/supabase/server";

/**
 * GET /api/users?page=&limit=&q=
 * - returns paginated users (excluding the current user)
 * - includes followerCount and whether current user is following each (if authenticated)
 */

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = Math.max(0, Number(url.searchParams.get("page") ?? 0));
    const limit = Math.min(50, Number(url.searchParams.get("limit") ?? 12));
    const q = (url.searchParams.get("q") ?? "").trim();
    const skip = page * limit;

    const currentUserId = await getCurrentUserId();

    // build where
    const where: any = { isActive: true };
    if (q) {
      where.OR = [
        { username: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
      ];
    }
    if (currentUserId) {
      // exclude yourself
      where.id = { not: currentUserId };
    }

    // fetch limit+1 for hasMore
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit + 1,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    const hasMore = users.length > limit;
    if (hasMore) users.pop();

    // follower counts
    const userIds = users.map((u) => u.id);
    const followerCounts = await prisma.follow.groupBy({
      by: ["followingId"],
      where: { followingId: { in: userIds } },
      _count: { followingId: true },
    });

    const followerCountMap = Object.fromEntries(followerCounts.map((r) => [r.followingId, r._count.followingId]));

    // who the current user follows (to mark isFollowing)
    let followingMap: Record<string, boolean> = {};
    if (currentUserId && userIds.length) {
      const follows = await prisma.follow.findMany({
        where: { followerId: currentUserId, followingId: { in: userIds } },
        select: { followingId: true },
      });
      followingMap = Object.fromEntries(follows.map((f) => [f.followingId, true]));
    }

    const serialized = users.map((u) => ({
      id: u.id,
      username: u.username,
      firstName: u.firstName,
      lastName: u.lastName,
      bio: u.bio,
      avatarUrl: u.avatarUrl,
      followerCount: followerCountMap[u.id] ?? 0,
      isFollowing: followingMap[u.id] ?? false,
      createdAt: u.createdAt,
    }));

    return NextResponse.json({ users: serialized, hasMore });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Failed to fetch users" }, { status: 500 });
  }
}

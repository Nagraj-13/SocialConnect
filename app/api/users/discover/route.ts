import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId();
    
    if (!currentUserId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get users excluding the current user
    const users = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        bio: true,
        avatarUrl: true,
        website: true,
        location: true,
        isVerified: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: {
              where: { isActive: true }
            }
          }
        }
      },
      orderBy: [
        { isVerified: 'desc' }, // Verified users first
        { createdAt: 'desc' }   // Then by newest
      ],
      take: 50 // Limit results
    });

    // Get the IDs of users that the current user is following
    const followingRelations = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true }
    });

    const followingIds = followingRelations.map(f => f.followingId);

    return NextResponse.json({
      users,
      followingIds
    });

  } catch (error) {
    console.error("Error fetching users for discovery:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

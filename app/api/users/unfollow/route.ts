import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId();
    
    if (!currentUserId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    // Check if currently following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userId
        }
      }
    });

    if (!existingFollow) {
      return NextResponse.json({ message: "Not following this user" }, { status: 400 });
    }

    // Remove follow relationship
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userId
        }
      }
    });

    return NextResponse.json({ message: "Successfully unfollowed user" });

  } catch (error) {
    console.error("Error unfollowing user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
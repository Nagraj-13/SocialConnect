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

    if (userId === currentUserId) {
      return NextResponse.json({ message: "Cannot follow yourself" }, { status: 400 });
    }

    // Check if user exists and is active
    const userToFollow = await prisma.user.findFirst({
      where: { id: userId, isActive: true }
    });

    if (!userToFollow) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userId
        }
      }
    });

    if (existingFollow) {
      return NextResponse.json({ message: "Already following this user" }, { status: 400 });
    }

    // Create follow relationship
    await prisma.follow.create({
      data: {
        followerId: currentUserId,
        followingId: userId
      }
    });

    // Create notification for the followed user
    await prisma.notification.create({
      data: {
        type: "FOLLOW",
        message: "started following you",
        recipientId: userId,
        senderId: currentUserId
      }
    });

    return NextResponse.json({ message: "Successfully followed user" });

  } catch (error) {
    console.error("Error following user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}


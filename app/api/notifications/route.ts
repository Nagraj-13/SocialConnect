import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId();
    
    if (!currentUserId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: currentUserId,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          }
        },
        post: {
          select: {
            id: true,
            content: true,
            imageUrl: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to recent 50 notifications
    });

    return NextResponse.json({ notifications });

  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

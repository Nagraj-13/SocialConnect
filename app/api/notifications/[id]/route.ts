import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUserId = await getCurrentUserId();
    
    if (!currentUserId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id: params.id,
        recipientId: currentUserId,
      },
    });

    if (!notification) {
      return NextResponse.json({ message: "Notification not found" }, { status: 404 });
    }

    await prisma.notification.update({
      where: { id: params.id },
      data: { isRead: true },
    });

    return NextResponse.json({ message: "Notification marked as read" });

  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
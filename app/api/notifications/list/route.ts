// app/api/notifications/list/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/supabase/server";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ notifications: [] });

  const notifications = await prisma.notification.findMany({
    where: { recipientId: userId },
    include: { sender: true, post: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ notifications });
}

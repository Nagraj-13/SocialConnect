// app/api/admin/users/[id]/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const currentUser = await prisma.user.findUnique({ where: { id: currentUserId }, select: { role: true }});
    if (!currentUser || currentUser.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { id } = await context.params;
    const body = await req.json();

    // Accept only specific updatable fields
    const allowed: Record<string, any> = {};
    const fields = ["username", "firstName", "lastName", "bio", "website", "location", "avatarUrl", "role", "isActive", "isVerified"];
    fields.forEach((f) => { if (body[f] !== undefined) allowed[f] = body[f]; });

    // Map to DB column names if necessary (firstName -> first_name etc.)
    const dataToUpdate: any = {};
    if (allowed.username !== undefined) dataToUpdate.username = allowed.username;
    if (allowed.firstName !== undefined) dataToUpdate.firstName = allowed.firstName;
    if (allowed.lastName !== undefined) dataToUpdate.lastName = allowed.lastName;
    if (allowed.bio !== undefined) dataToUpdate.bio = allowed.bio;
    if (allowed.avatarUrl !== undefined) dataToUpdate.avatarUrl = allowed.avatarUrl;
    if (allowed.website !== undefined) dataToUpdate.website = allowed.website;
    if (allowed.location !== undefined) dataToUpdate.location = allowed.location;
    if (allowed.role !== undefined) dataToUpdate.role = allowed.role;
    if (allowed.isActive !== undefined) dataToUpdate.isActive = allowed.isActive;
    if (allowed.isVerified !== undefined) dataToUpdate.isVerified = allowed.isVerified;

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error("PATCH /api/admin/users/[id] error", err);
    return NextResponse.json({ message: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const currentUser = await prisma.user.findUnique({ where: { id: currentUserId }, select: { role: true }});
    if (!currentUser || currentUser.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { id } = await context.params;

    // Prevent admin from deleting themselves accidentally
    if (id === currentUserId) {
      return NextResponse.json({ message: "Cannot delete yourself" }, { status: 400 });
    }

    // Delete user (cascades as configured)
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: "User deleted" });
  } catch (err) {
    console.error("DELETE /api/admin/users/[id] error", err);
    return NextResponse.json({ message: "Failed to delete user" }, { status: 500 });
  }
}

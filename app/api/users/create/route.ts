import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { id, email, username, firstName, lastName } = await req.json();

    const user = await prisma.user.create({
      data: {
        id, // same UUID from Supabase Auth
        email,
        username,
        firstName,
        lastName,
      },
    });

    return NextResponse.json(user);
  } catch (err: any) {
    console.error("Error creating user", err);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

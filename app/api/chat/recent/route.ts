import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Get recent messages across all rooms a user is part of
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  const limit = searchParams.get("limit")
    ? parseInt(searchParams.get("limit")!)
    : 20;

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    // Get all rooms the user is a member of
    const userWithRooms = await prisma.user.findUnique({
      where: { id: userId },
      include: { rooms: true },
    });

    if (!userWithRooms) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the most recent messages from each room
    const roomIds = userWithRooms.rooms.map((room) => room.id);

    // For each room, get the most recent message
    const recentMessages = await Promise.all(
      roomIds.map(async (roomId) => {
        const message = await prisma.message.findFirst({
          where: { roomId },
          orderBy: { createdAt: "desc" },
          include: {
            user: true,
            room: true,
          },
        });
        return message;
      })
    );

    // Filter out nulls and sort by creation date (newest first)
    const validMessages = recentMessages
      .filter((message) => message !== null)
      .sort(
        (a, b) =>
          new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime()
      )
      .slice(0, limit);

    return NextResponse.json(validMessages);
  } catch (error) {
    console.error("GET recent messages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent messages" },
      { status: 500 }
    );
  }
}

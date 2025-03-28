import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
// GET: Get all members of a room
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const roomId = searchParams.get("roomId");

  if (!roomId) {
    return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
  }

  try {
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: { members: true },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json(room.members);
  } catch (error) {
    console.error("GET room members error:", error);
    return NextResponse.json(
      { error: "Failed to fetch room members" },
      { status: 500 }
    );
  }
}

// POST: Add members to a room
export async function POST(req: NextRequest) {
  try {
    const { roomId, userIds } = await req.json();

    if (
      !roomId ||
      !userIds ||
      !Array.isArray(userIds) ||
      userIds.length === 0
    ) {
      return NextResponse.json(
        {
          error: "Room ID and at least one user ID are required",
        },
        { status: 400 }
      );
    }

    // Check if room exists
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Add users to the room
    const updatedRoom = await prisma.chatRoom.update({
      where: { id: roomId },
      data: {
        members: {
          connect: userIds.map((id) => ({ id })),
        },
      },
      include: { members: true },
    });

    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error("POST room members error:", error);
    return NextResponse.json(
      { error: "Failed to add members to room" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a member from a room
export async function DELETE(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const roomId = searchParams.get("roomId");
  const userId = searchParams.get("userId");

  if (!roomId || !userId) {
    return NextResponse.json(
      {
        error: "Room ID and user ID are required",
      },
      { status: 400 }
    );
  }

  try {
    // Check if user is the creator of the room
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Don't allow removing the creator
    if (room.createdBy === userId) {
      return NextResponse.json(
        {
          error: "Cannot remove the creator from the room",
        },
        { status: 400 }
      );
    }

    // Remove user from the room
    const updatedRoom = await prisma.chatRoom.update({
      where: { id: roomId },
      data: {
        members: {
          disconnect: { id: userId },
        },
      },
      include: { members: true },
    });

    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error("DELETE room member error:", error);
    return NextResponse.json(
      { error: "Failed to remove member from room" },
      { status: 500 }
    );
  }
}

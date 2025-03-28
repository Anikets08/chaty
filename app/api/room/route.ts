import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
// GET: Get all rooms or a specific room
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const roomId = searchParams.get("id");
  const userId = searchParams.get("userId");

  try {
    if (roomId) {
      // Get a specific room
      const room = await prisma.chatRoom.findUnique({
        where: { id: roomId },
        include: { members: true },
      });

      if (!room) {
        return NextResponse.json({ error: "Room not found" }, { status: 404 });
      }

      return NextResponse.json(room);
    } else if (userId) {
      // Get all rooms where the user is a member
      const rooms = await prisma.chatRoom.findMany({
        where: {
          members: {
            some: {
              id: userId,
            },
          },
        },
        include: { members: true },
      });
      return NextResponse.json(rooms);
    } else {
      return NextResponse.json(
        { error: "UserId is required" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("GET room error:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}

// POST: Create a new room
export async function POST(req: NextRequest) {
  try {
    const { name, description, createdBy, memberIds = [] } = await req.json();

    if (!name || !createdBy) {
      return NextResponse.json(
        { error: "Name and createdBy are required" },
        { status: 400 }
      );
    }

    // Ensure creator is also a member
    const uniqueMemberIds = [...new Set([createdBy, ...memberIds])];

    const newRoom = await prisma.chatRoom.create({
      data: {
        name,
        description,
        createdBy,
        members: {
          connect: uniqueMemberIds.map((id) => ({ id })),
        },
      },
      include: {
        members: true,
      },
    });

    return NextResponse.json(newRoom, { status: 201 });
  } catch (error) {
    console.error("POST room error:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
}

// PUT: Update a room
export async function PUT(req: NextRequest) {
  try {
    const { id, name, description, memberIds } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Room ID is required" },
        { status: 400 }
      );
    }

    // Check if room exists
    const existingRoom = await prisma.chatRoom.findUnique({
      where: { id },
    });

    if (!existingRoom) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    // Update members if provided
    if (memberIds && Array.isArray(memberIds)) {
      updateData.members = {
        set: [],
        connect: memberIds.map((id) => ({ id })),
      };
    }

    const updatedRoom = await prisma.chatRoom.update({
      where: { id },
      data: updateData,
      include: { members: true },
    });

    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error("PUT room error:", error);
    return NextResponse.json(
      { error: "Failed to update room" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a room
export async function DELETE(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
  }

  try {
    // First delete all messages in the room
    await prisma.message.deleteMany({
      where: { roomId: id },
    });

    // Then delete the room itself
    const deletedRoom = await prisma.chatRoom.delete({
      where: { id },
    });

    return NextResponse.json(deletedRoom);
  } catch (error) {
    console.error("DELETE room error:", error);
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 }
    );
  }
}

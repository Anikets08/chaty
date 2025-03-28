import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
// GET: Get messages for a room
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const roomId = searchParams.get("roomId");
  const messageId = searchParams.get("id");
  const limit = searchParams.get("limit")
    ? parseInt(searchParams.get("limit")!)
    : 50;
  const cursor = searchParams.get("cursor");

  if (!roomId && !messageId) {
    return NextResponse.json(
      { error: "RoomId or message ID is required" },
      { status: 400 }
    );
  }

  try {
    if (messageId) {
      // Get a specific message
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: { user: true },
      });

      if (!message) {
        return NextResponse.json(
          { error: "Message not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(message);
    } else {
      if (!roomId) {
        return NextResponse.json(
          { error: "RoomId is required" },
          { status: 400 }
        );
      }
      // Get messages for a room with pagination
      const messages = await prisma.message.findMany({
        where: { roomId },
        take: limit,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
        include: { user: true },
      });

      const nextCursor =
        messages.length === limit ? messages[messages.length - 1].id : null;

      return NextResponse.json({
        messages,
        nextCursor,
      });
    }
  } catch (error) {
    console.error("GET message error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST: Create a new message
export async function POST(req: NextRequest) {
  try {
    const { content, userId, roomId } = await req.json();

    if (!content || !userId || !roomId) {
      return NextResponse.json(
        {
          error: "Content, userId, and roomId are required",
        },
        { status: 400 }
      );
    }

    // Check if user exists and is a member of the room
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: { members: true },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const isMember = room.members.some((member) => member.id === userId);
    if (!isMember) {
      return NextResponse.json(
        {
          error: "User is not a member of this room",
        },
        { status: 403 }
      );
    }

    const newMessage = await prisma.message.create({
      data: {
        content,
        userId,
        roomId,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error("POST message error:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}

// PUT: Update a message
export async function PUT(req: NextRequest) {
  try {
    const { id, content } = await req.json();

    if (!id || !content) {
      return NextResponse.json(
        {
          error: "Message ID and content are required",
        },
        { status: 400 }
      );
    }

    // Check if message exists
    const existingMessage = await prisma.message.findUnique({
      where: { id },
    });

    if (!existingMessage) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: { content },
      include: { user: true },
    });

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error("PUT message error:", error);
    return NextResponse.json(
      { error: "Failed to update message" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a message
export async function DELETE(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Message ID is required" },
      { status: 400 }
    );
  }

  try {
    const deletedMessage = await prisma.message.delete({
      where: { id },
    });

    return NextResponse.json(deletedMessage);
  } catch (error) {
    console.error("DELETE message error:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}

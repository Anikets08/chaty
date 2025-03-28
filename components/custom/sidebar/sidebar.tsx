"use client";
import { LogOut, Plus, UserPlus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import logoutService from "@/services/auth/logout.auth";
import RoomButton from "./roomButton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import useRoomStore from "@/store/roomStore";
import useUserStore from "@/store/userStore";

interface Room {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  members: any[];
}

function Sidebar() {
  const { selectedRoomId, setSelectedRoomId } = useRoomStore();
  const { userId, setUserId, setUserName } = useUserStore();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [roomIdToJoin, setRoomIdToJoin] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    fetchRooms();
  }, [userId]);

  const fetchRooms = async () => {
    try {
      if (!userId) return;
      setLoading(true);
      const response = await fetch(`/api/room?userId=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch rooms");

      const data = await response.json();
      setRooms(data);

      // If we have rooms and no selected room, select the first one
      if (data.length > 0 && !selectedRoomId) {
        setSelectedRoomId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim() || !userId) return;
    try {
      setIsCreatingRoom(true);
      const response = await fetch("/api/room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newRoomName,
          description: newRoomDescription,
          createdBy: userId,
        }),
      });

      if (!response.ok) throw new Error("Failed to create room");

      const newRoom = await response.json();
      setRooms([...rooms, newRoom]);
      setSelectedRoomId(newRoom.id);
      setNewRoomName("");
      setNewRoomDescription("");
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Error creating room:", error);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const joinRoom = async () => {
    if (!roomIdToJoin.trim() || !userId) return;

    setJoinError("");
    setIsJoiningRoom(true);

    try {
      // First, check if the room exists
      const checkResponse = await fetch(`/api/room?id=${roomIdToJoin}`);
      if (!checkResponse.ok) {
        setJoinError("Room not found");
        return;
      }

      // Add user to the room
      const response = await fetch("/api/room/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: roomIdToJoin,
          userIds: [userId],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setJoinError(errorData.error || "Failed to join room");
        return;
      }

      // Get the updated room
      const updatedRoom = await response.json();

      // Check if the room is already in the list
      const roomExists = rooms.some((room) => room.id === updatedRoom.id);

      if (!roomExists) {
        setRooms([...rooms, updatedRoom]);
      }

      setSelectedRoomId(updatedRoom.id);
      setRoomIdToJoin("");
      setIsJoinDialogOpen(false);

      // Refresh rooms list
      fetchRooms();
    } catch (error) {
      console.error("Error joining room:", error);
      setJoinError("Failed to join room. Please try again.");
    } finally {
      setIsJoiningRoom(false);
    }
  };

  const handleLogout = () => {
    // Reset Zustand state
    setUserId("");
    setSelectedRoomId("");
    setUserName("");
    logoutService();
  };

  return (
    <div className="sidebar h-full w-[200px] bg-gray-100 p-4 flex flex-col gap-4">
      <div className="sidebar-header">
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-4xl font-black leading-tight tracking-tighter flex items-center">
            Chaty
          </h1>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex-1 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Room</DialogTitle>
              <DialogDescription>
                Create a new chat room to start conversations with others.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="col-span-3"
                  placeholder="Enter room name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  className="col-span-3"
                  placeholder="Enter room description (optional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                disabled={isCreatingRoom || !newRoomName.trim() || !userId}
                onClick={createRoom}
              >
                {isCreatingRoom ? "Creating..." : "Create Room"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="flex-1 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Join
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Join a Room</DialogTitle>
              <DialogDescription>
                Enter the room ID to join an existing chat room.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="roomId" className="text-right">
                  Room ID
                </Label>
                <Input
                  id="roomId"
                  value={roomIdToJoin}
                  onChange={(e) => {
                    setRoomIdToJoin(e.target.value);
                    setJoinError("");
                  }}
                  className="col-span-3"
                  placeholder="Enter the room ID"
                />
              </div>
              {joinError && (
                <p className="text-red-500 text-sm text-center">{joinError}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                disabled={isJoiningRoom || !roomIdToJoin.trim() || !userId}
                onClick={joinRoom}
              >
                {isJoiningRoom ? "Joining..." : "Join Room"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* divider */}
      <div className="h-[1px] bg-gray-200 w-full"></div>

      <ScrollArea className="flex flex-col flex-1 mt-2 overflow-y-auto">
        {loading ? (
          <div className="text-center py-4 text-sm text-gray-500">
            Loading rooms...
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-4 text-sm text-gray-500">
            No rooms available
          </div>
        ) : (
          rooms.map((room) => (
            <RoomButton
              key={room.id}
              roomId={room.id}
              roomName={room.name}
              selectedRoomId={selectedRoomId}
              setSelectedRoomId={setSelectedRoomId}
            />
          ))
        )}
      </ScrollArea>

      <div className="h-[1px] bg-gray-200 w-full"></div>
      <div className="flex flex-col gap-2 ">
        <Button
          className="w-full flex items-center gap-4 text-xs"
          onClick={handleLogout}
          variant="outline"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}

export default Sidebar;

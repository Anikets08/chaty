"use client";
import { Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import useRoomStore from "@/store/roomStore";
import useWebSocketStore from "@/store/websocketStore";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  userName: string;
  email: string;
}

function RoomSidebar() {
  const { selectedRoomId } = useRoomStore();
  const { roomMembers } = useWebSocketStore();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (selectedRoomId) {
      fetchRoomMembers();
    } else {
      setMembers([]);
    }
  }, [selectedRoomId]);

  const fetchRoomMembers = async () => {
    if (!selectedRoomId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/room/members?roomId=${selectedRoomId}`
      );
      if (!response.ok) throw new Error("Failed to fetch room members");

      const data = await response.json();
      setMembers(data);
    } catch (error) {
      console.error("Error fetching room members:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get active members from WebSocket store
  const activeUserIds = selectedRoomId ? roomMembers[selectedRoomId] || [] : [];

  const filteredMembers = members.filter(
    (member) =>
      member.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!selectedRoomId) {
    return (
      <div className="sidebar h-full w-[200px] bg-gray-100 p-4 flex flex-col gap-4 items-center justify-center">
        <p className="text-sm text-gray-500">Select a room to see members</p>
      </div>
    );
  }

  return (
    <div className="sidebar h-full w-[200px] bg-gray-100 p-4 flex flex-col gap-4">
      <div className="sidebar-header">
        <div className="flex flex-col">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Users className="w-4 h-4" /> Members ({members.length})
          </h1>
          <div className="text-xs text-green-600 font-medium mt-1">
            {activeUserIds.length} online
          </div>
        </div>
      </div>

      <Input
        placeholder="Search members..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="text-sm"
      />

      <div className="h-[1px] bg-gray-200 w-full"></div>

      <ScrollArea className="flex-1 mt-2 overflow-y-auto">
        {loading ? (
          <div className="text-center py-4 text-sm text-gray-500">
            Loading members...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-4 text-sm text-gray-500">
            {searchQuery
              ? "No members matching your search"
              : "No members in this room yet"}
          </div>
        ) : (
          filteredMembers.map((member) => {
            const isActive = activeUserIds.includes(member.id);
            return (
              <div
                key={member.id}
                className="flex items-center py-2 px-2 hover:bg-gray-200 rounded-md mb-1"
              >
                <div className="relative">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2">
                    {member.userName.charAt(0).toUpperCase()}
                  </div>
                  {isActive && (
                    <div className="absolute bottom-0 right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-gray-100"></div>
                  )}
                </div>
                <div className="overflow-hidden flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">
                      {member.userName}
                    </p>
                    {isActive && (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-4 bg-green-50 text-green-700 border-green-200"
                      >
                        online
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {member.email}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </ScrollArea>
    </div>
  );
}

export default RoomSidebar;

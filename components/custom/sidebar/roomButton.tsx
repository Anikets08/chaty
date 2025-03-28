import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React from "react";

function RoomButton({
  roomId,
  roomName,
  selectedRoomId,
  setSelectedRoomId,
}: {
  roomId: string;
  roomName: string;
  selectedRoomId: string | null;
  setSelectedRoomId: (roomId: string) => void;
}) {
  return (
    <Button
      onClick={() => setSelectedRoomId(roomId)}
      className={cn("w-full flex items-center justify-start gap-2 mb-1")}
      variant={selectedRoomId === roomId ? "default" : "ghost"}
    >
      {selectedRoomId === roomId && (
        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
      )}
      <p className="text-sm font-medium truncate">{roomName}</p>
    </Button>
  );
}

export default RoomButton;

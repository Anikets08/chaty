import { useEffect, useRef } from "react";
import io from "socket.io-client";
import useRoomStore from "@/store/roomStore";

export const useSocket = () => {
  const socketRef = useRef<any | null>(null);
  const { selectedRoomId } = useRoomStore();

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000"
    );

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (!socketRef.current || !selectedRoomId) return;

    // Join the room
    socketRef.current.emit("join-room", selectedRoomId);

    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leave-room", selectedRoomId);
      }
    };
  }, [selectedRoomId]);

  return socketRef.current;
};

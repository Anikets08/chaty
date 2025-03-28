import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Copy, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import useRoomStore from "@/store/roomStore";
import useUserStore from "@/store/userStore";
import useWebSocketStore from "@/store/websocketStore";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Message {
  id?: string;
  type?: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
  roomId: string;
  userId: string;
  timestamp?: string;
  userName?: string;
  user?: {
    id: string;
    userName: string;
    email: string;
  };
}

interface Room {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

function Room() {
  const { selectedRoomId } = useRoomStore();
  const { userId, userName } = useUserStore();
  const {
    joinRoom,
    leaveRoom,
    sendMessage: sendWebSocketMessage,
    messages: wsMessages,
    isConnected,
  } = useWebSocketStore();

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedRoomId && userId && isConnected) {
      joinRoom(selectedRoomId, userId);
      fetchRoomDetails();
      fetchMessages();

      return () => {
        leaveRoom(selectedRoomId);
      };
    } else {
      setSelectedRoom(null);
      setMessages([]);
    }
  }, [selectedRoomId, userId, isConnected]);

  // Update messages when WebSocket messages arrive
  useEffect(() => {
    if (selectedRoomId && wsMessages[selectedRoomId]) {
      const allMessages = [...messages];

      // Add new WebSocket messages
      wsMessages[selectedRoomId].forEach((wsMessage) => {
        const messageExists = allMessages.some((m) => {
          // Check if both messages have IDs and they match
          if (m.id && wsMessage.id) {
            return m.id === wsMessage.id;
          }
          // Fallback to timestamp and userId comparison if no IDs
          return (
            m.timestamp === wsMessage.timestamp && m.userId === wsMessage.userId
          );
        });

        if (!messageExists) {
          allMessages.push({
            id: wsMessage.id,
            type: wsMessage.type,
            content: wsMessage.content || "",
            roomId: wsMessage.roomId,
            userName: wsMessage.userName,
            userId: wsMessage.userId,
            timestamp: wsMessage.timestamp,
            createdAt: wsMessage.timestamp || new Date().toISOString(),
          });
        }
      });

      // Sort messages by timestamp
      allMessages.sort((a, b) => {
        const timeA = a.timestamp || a.createdAt || "";
        const timeB = b.timestamp || b.createdAt || "";
        return new Date(timeA).getTime() - new Date(timeB).getTime();
      });

      setMessages(allMessages);
    }
  }, [selectedRoomId, wsMessages]);

  // Debug WebSocket connection status
  useEffect(() => {
    console.log(
      `Room component WebSocket connection status: ${
        isConnected ? "Connected" : "Disconnected"
      }`
    );
    return () => {
      console.log("Room component unmounting");
    };
  }, [isConnected]);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchRoomDetails = async () => {
    if (!selectedRoomId) return;

    try {
      const response = await fetch(`/api/room?id=${selectedRoomId}`);
      if (!response.ok) throw new Error("Failed to fetch room details");

      const data = await response.json();
      setSelectedRoom(data);
    } catch (error) {
      console.error("Error fetching room details:", error);
    }
  };

  const fetchMessages = async () => {
    if (!selectedRoomId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/chat?roomId=${selectedRoomId}`);
      if (!response.ok) throw new Error("Failed to fetch messages");

      const data = await response.json();
      setMessages(data.messages?.reverse() || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedRoomId || !userId) return;

    try {
      setSendingMessage(true);

      // Send via WebSocket for real-time delivery
      sendWebSocketMessage(
        selectedRoomId,
        userId,
        messageInput,
        userName || "Anonymous"
      );

      // Also send via REST API for persistence
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: messageInput,
          roomId: selectedRoomId,
          userId: userId,
          userName: userName || "Anonymous",
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");
      setMessageInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyRoomId = () => {
    if (selectedRoomId) {
      navigator.clipboard.writeText(selectedRoomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!selectedRoomId || !selectedRoom) {
    return (
      <div className="flex flex-col flex-1 p-4 items-center justify-center">
        <p className="text-gray-500">Select a room to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 p-4 h-full">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">{selectedRoom.name}</h1>
          {selectedRoom.description && (
            <p className="text-sm text-gray-500">{selectedRoom.description}</p>
          )}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <div className="text-xs px-2 py-1 bg-gray-100 rounded-md">
                  ID: {selectedRoomId.substring(0, 8)}...
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyRoomId}
                  className="h-8 w-8"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{copied ? "Copied!" : "Copy room ID to invite others"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <ScrollArea className="flex-1 my-4 pr-4 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              // console.log("FUCK message", message);
              const isCurrentUser = message.userId === userId;
              return (
                <div
                  key={
                    message.id ||
                    `${message.userId}-${message.timestamp}-${index}`
                  }
                  className={`flex ${
                    isCurrentUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      isCurrentUser
                        ? "bg-blue-500 text-white rounded-br-none"
                        : "bg-gray-200 text-gray-800 rounded-bl-none"
                    }`}
                  >
                    {!isCurrentUser && (
                      <p className="text-xs font-semibold mb-1">
                        {message.user?.userName ||
                          message.userName ||
                          message.userId}
                      </p>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 text-right mt-1">
                      {new Date(
                        message.timestamp || message.createdAt || ""
                      ).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      <div className="flex mt-2">
        <Input
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="mr-2"
        />
        <Button
          onClick={sendMessage}
          disabled={
            sendingMessage || !messageInput.trim() || !userId || !isConnected
          }
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default Room;

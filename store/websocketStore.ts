import { create } from "zustand";

interface Message {
  id?: string;
  type: string;
  roomId: string;
  userId: string;
  content?: string;
  timestamp?: string;
  userName?: string;
}

interface WebSocketStore {
  socket: WebSocket | null;
  messages: { [roomId: string]: Message[] };
  roomMembers: { [roomId: string]: string[] };
  currentRoomId: string | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  joinRoom: (roomId: string, userId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (
    roomId: string,
    userId: string,
    content: string,
    userName?: string
  ) => void;
  setCurrentRoom: (roomId: string) => void;
}

// Keep a single websocket instance outside the store
let globalSocket: WebSocket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let isConnecting = false;
let connectionAttempts = 0;

// Track rooms user has joined to rejoin after reconnection
const joinedRooms = new Map<string, string>(); // roomId -> userId

// Create a stable connect function that won't change between renders
const stableConnect = (() => {
  let connectFn: (() => void) | null = null;

  return (setState: any, getState: any) => {
    if (!connectFn) {
      connectFn = () => {
        // If already connecting or connected, don't create a new connection
        if (isConnecting || globalSocket?.readyState === WebSocket.OPEN) {
          setState({
            socket: globalSocket,
            isConnected: globalSocket?.readyState === WebSocket.OPEN,
          });
          return;
        }

        isConnecting = true;
        connectionAttempts++;

        // Close existing socket if it exists and not already closed
        if (globalSocket && globalSocket.readyState !== WebSocket.CLOSED) {
          globalSocket.close();
        }

        const PORT = process.env.PORT || 2134;
        const provider =
          process.env.NODE_ENV === "development"
            ? `ws://localhost:${PORT}`
            : `wss://chaty-ay2m.onrender.com:${PORT}`;
        console.log("provider", provider);
        globalSocket = new WebSocket(provider);

        globalSocket.onopen = () => {
          isConnecting = false;
          connectionAttempts = 0;
          setState({ socket: globalSocket, isConnected: true });

          // Rejoin all rooms after reconnection
          joinedRooms.forEach((userId, roomId) => {
            if (globalSocket?.readyState === WebSocket.OPEN) {
              globalSocket.send(
                JSON.stringify({
                  type: "JOIN_ROOM",
                  roomId,
                  userId,
                })
              );
            }
          });

          // Clear any pending reconnect timers
          if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
          }
        };

        globalSocket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);

            switch (message.type) {
              case "CHAT_MESSAGE":
                setState((state: WebSocketStore) => ({
                  messages: {
                    ...state.messages,
                    [message.roomId]: [
                      ...(state.messages[message.roomId] || []),
                      message,
                    ],
                  },
                }));
                break;

              case "ROOM_MEMBERS_UPDATE":
                setState((state: WebSocketStore) => ({
                  roomMembers: {
                    ...state.roomMembers,
                    [message.roomId]: message.members,
                  },
                }));
                break;

              case "USER_JOINED":
              case "USER_LEFT":
                // These events will trigger a ROOM_MEMBERS_UPDATE, so we don't need to handle them separately
                break;
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        globalSocket.onclose = (event) => {
          isConnecting = false;
          setState({ isConnected: false });

          // Don't attempt to reconnect if this was an intentional close
          // or if we've exceeded max attempts
          if (
            !event.wasClean &&
            event.code !== 1000 &&
            connectionAttempts < 5
          ) {
            // Attempt to reconnect after a delay, with increasing backoff
            if (!reconnectTimer) {
              const delay = Math.min(2000 * connectionAttempts, 10000);
              reconnectTimer = setTimeout(() => {
                reconnectTimer = null;
                connectFn?.();
              }, delay);
            }
          }
        };

        globalSocket.onerror = (error) => {};

        setState({ socket: globalSocket });
      };
    }

    return connectFn;
  };
})();

// Create a stable joinRoom function that won't change between renders
const stableJoinRoom = (() => {
  let joinRoomFn: ((roomId: string, userId: string) => void) | null = null;

  return (getState: any) => {
    if (!joinRoomFn) {
      joinRoomFn = (roomId: string, userId: string) => {
        // Don't join if already joined
        if (joinedRooms.has(roomId) && joinedRooms.get(roomId) === userId) {
          return;
        }

        // Track the room for reconnection purposes
        joinedRooms.set(roomId, userId);

        if (globalSocket?.readyState === WebSocket.OPEN) {
          globalSocket.send(
            JSON.stringify({
              type: "JOIN_ROOM",
              roomId,
              userId,
            })
          );
        } else {
          // If socket isn't connected, connect first then the room will be joined automatically
          getState().connect();
        }
      };
    }

    return joinRoomFn;
  };
})();

// Create a stable leaveRoom function that won't change between renders
const stableLeaveRoom = (() => {
  let leaveRoomFn: ((roomId: string) => void) | null = null;

  return (getState: any) => {
    if (!leaveRoomFn) {
      leaveRoomFn = (roomId: string) => {
        // Don't leave if not joined
        if (!joinedRooms.has(roomId)) {
          return;
        }

        // Remove from tracked rooms
        joinedRooms.delete(roomId);

        if (globalSocket?.readyState === WebSocket.OPEN) {
          globalSocket.send(
            JSON.stringify({
              type: "LEAVE_ROOM",
              roomId,
            })
          );
        }
      };
    }

    return leaveRoomFn;
  };
})();

const useWebSocketStore = create<WebSocketStore>((set, get) => ({
  socket: null,
  messages: {},
  roomMembers: {},
  currentRoomId: null,
  isConnected: false,

  connect: stableConnect(set, get),

  disconnect: () => {
    // Clear reconnect timer
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    // Only close if we are really disconnecting the app, not during hot reloads
    if (globalSocket && !isConnecting) {
      const socket = globalSocket;
      globalSocket = null;
      socket.close(1000, "User disconnected");
      set({ socket: null, isConnected: false });
      joinedRooms.clear();
    }
  },

  joinRoom: stableJoinRoom(get),
  leaveRoom: stableLeaveRoom(get),

  sendMessage: (
    roomId: string,
    userId: string,
    content: string,
    userName?: string
  ) => {
    if (globalSocket?.readyState === WebSocket.OPEN) {
      globalSocket.send(
        JSON.stringify({
          type: "CHAT_MESSAGE",
          roomId,
          userId,
          userName,
          content,
        })
      );
    } else {
      console.warn("Cannot send message: WebSocket not connected");
      // Attempt to reconnect
      get().connect();
    }
  },

  setCurrentRoom: (roomId: string) => {
    set({ currentRoomId: roomId });
  },
}));

// Ensure clean disconnection when the client is about to unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (globalSocket && globalSocket.readyState === WebSocket.OPEN) {
      globalSocket.close(1000, "Page unloaded");
    }
  });
}

export default useWebSocketStore;

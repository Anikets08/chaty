# Chaty - Real-time Chat Application

Chaty is a modern real-time chat application built with Next.js, WebSockets, and a robust backend architecture. It enables users to communicate in real-time within chat rooms, with features like user presence detection and instant messaging.

## Features

- **Real-time Communication**: Messages are delivered instantly via WebSockets
- **User Presence**: See which users are currently online in a room
- **Room Management**: Create, join, and leave chat rooms
- **Authentication**: Secure user authentication and authorization
- **Persistent Messages**: Chat history is stored and can be retrieved even after disconnection
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## Architecture

### Frontend

- **Next.js**: React framework for server-rendered applications
- **Tailwind CSS**: For styling and responsive design
- **Zustand**: State management library for global state
- **WebSocket Client**: Real-time communication with the server

### Backend

- **Express.js**: Lightweight web server for WebSockets
- **WebSocket Server**: Handles real-time messaging and user presence
- **Next.js API Routes**: RESTful API for authentication and data persistence

## WebSocket Protocol

The application uses a custom WebSocket protocol for real-time features:

### Message Types

#### Client to Server

1. **JOIN_ROOM**

   ```javascript
   {
     type: "JOIN_ROOM",
     roomId: "room-id",
     userId: "user-id"
   }
   ```

2. **LEAVE_ROOM**

   ```javascript
   {
     type: "LEAVE_ROOM",
     roomId: "room-id"
   }
   ```

3. **CHAT_MESSAGE**
   ```javascript
   {
     type: "CHAT_MESSAGE",
     roomId: "room-id",
     userId: "user-id",
     userName: "User Name",
     content: "Message content"
   }
   ```

#### Server to Client

1. **WELCOME**

   ```javascript
   {
     type: "WELCOME",
     message: "Connected to WebSocket server with ID: <connectionId>"
   }
   ```

2. **CHAT_MESSAGE**

   ```javascript
   {
     type: "CHAT_MESSAGE",
     id: "unique-message-id",
     roomId: "room-id",
     userId: "sender-id",
     userName: "User Name",
     content: "Message content",
     timestamp: "2024-03-28T12:00:00.000Z"
   }
   ```

3. **USER_JOINED**

   ```javascript
   {
     type: "USER_JOINED",
     roomId: "room-id",
     userId: "user-id"
   }
   ```

4. **USER_LEFT**

   ```javascript
   {
     type: "USER_LEFT",
     roomId: "room-id",
     userId: "user-id"
   }
   ```

5. **ROOM_MEMBERS_UPDATE**
   ```javascript
   {
     type: "ROOM_MEMBERS_UPDATE",
     roomId: "room-id",
     members: ["user-id-1", "user-id-2", ...]
   }
   ```

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/chaty.git
   cd chaty
   ```

2. Install dependencies

   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the WebSocket server

   ```bash
   cd websockets
   npm install
   npm start
   ```

4. In a new terminal, start the Next.js app

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open your browser and navigate to http://localhost:3000

## Project Structure

```
chaty/
├── app/                      # Next.js application
│   ├── api/                  # API routes
│   │   ├── auth/             # Authentication endpoints
│   │   ├── chat/             # Chat message endpoints
│   │   ├── room/             # Room management endpoints
│   │   └── user/             # User management endpoints
│   └── ...                   # Pages and components
├── components/               # React components
│   ├── custom/               # Custom components
│   │   ├── chat/             # Chat-related components
│   │   └── ...
│   └── ui/                   # UI components
├── lib/                      # Utility functions
├── store/                    # Zustand stores
│   ├── userStore.ts          # User state management
│   ├── roomStore.ts          # Room state management
│   └── websocketStore.ts     # WebSocket state management
└── websockets/               # WebSocket server
    ├── index.js              # WebSocket server implementation
    └── package.json          # WebSocket server dependencies
```

## WebSocket Store

The application uses a custom WebSocket store built with Zustand to manage the WebSocket connection and state:

```typescript
import { create } from "zustand";

// Define interfaces for messages and store state
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

// Create the store with state and actions
const useWebSocketStore = create<WebSocketStore>((set, get) => ({
  // State and actions implementation
}));

export default useWebSocketStore;
```

## Room Component

The Room component renders the chat interface and handles real-time messages:

```tsx
function Room() {
  const { selectedRoomId } = useRoomStore();
  const { userId } = useUserStore();
  const {
    joinRoom,
    leaveRoom,
    sendMessage: sendWebSocketMessage,
    messages: wsMessages,
    roomMembers,
    isConnected,
  } = useWebSocketStore();

  // Join room when selectedRoomId changes
  useEffect(() => {
    if (selectedRoomId && userId && isConnected) {
      joinRoom(selectedRoomId, userId);
      // ...
    }
  }, [selectedRoomId, userId, isConnected]);

  // Send message function
  const sendMessage = async () => {
    // Send message via WebSocket for real-time delivery
    sendWebSocketMessage(selectedRoomId, userId, messageInput);

    // Also store in database via API
    // ...
  };

  // Render chat interface
  // ...
}
```

## WebSocket Server

The WebSocket server handles real-time communication:

```javascript
const wss = new WebSocket.Server({ port: 8181 });

// Store active rooms and their members
const rooms = new Map(); // roomId -> Map of ws -> userId
const userConnections = new Map(); // userId -> Set of ws connections

wss.on("connection", function connection(ws) {
  // Handle incoming messages
  ws.on("message", function incoming(data) {
    const message = JSON.parse(data);

    switch (message.type) {
      case "JOIN_ROOM":
        // Handle room join
        break;
      case "LEAVE_ROOM":
        // Handle room leave
        break;
      case "CHAT_MESSAGE":
        // Handle and broadcast message
        break;
    }
  });

  // Handle disconnection
  ws.on("close", function () {
    // Cleanup
  });
});
```

## License

MIT License

## Contributors

- Your Name (@yourusername)

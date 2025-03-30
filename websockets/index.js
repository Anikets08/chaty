const WebSocket = require("ws");

// Enable WebSocket server debugging
const DEBUG = true;
const PORT = process.env.PORT || 2134;

// Create a WebSocket server completely detached from the HTTP server.
const wss = new WebSocket.Server({
  port: PORT,
});

// Store active rooms and their members with user IDs
const rooms = new Map(); // roomId -> Map of ws -> userId
const userConnections = new Map(); // userId -> Set of ws connections (for multiple tabs/reconnects)

// Heartbeat mechanism to detect dead connections
function heartbeat() {
  this.isAlive = true;
  if (DEBUG)
    console.log(`Heartbeat received from client ${this.userId || "unknown"}`);
}

function logStats() {
  console.log(`--- WebSocket Server Stats ---`);
  console.log(`Total clients: ${wss.clients.size}`);
  console.log(`Active rooms: ${rooms.size}`);
  console.log(`Active users: ${userConnections.size}`);

  // Log room details
  rooms.forEach((members, roomId) => {
    console.log(`Room ${roomId}: ${members.size} connections`);
  });
}

function broadcastToRoom(roomId, message, excludeWs = null) {
  if (rooms.has(roomId)) {
    let sentCount = 0;
    for (const [client, _] of rooms.get(roomId).entries()) {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
        sentCount++;
      }
    }
    if (DEBUG)
      console.log(
        `Broadcast message to ${sentCount} clients in room ${roomId}`
      );
  }
}

function updateRoomMembers(roomId) {
  if (!rooms.has(roomId)) return;

  const roomMembers = Array.from(
    new Set(Array.from(rooms.get(roomId).values()))
  );

  if (DEBUG)
    console.log(
      `Updating room members for ${roomId}: ${roomMembers.length} unique members`
    );

  broadcastToRoom(roomId, {
    type: "ROOM_MEMBERS_UPDATE",
    roomId,
    members: roomMembers,
  });
}

function addToRoom(ws, roomId, userId) {
  // Create room if it doesn't exist
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Map());
    if (DEBUG) console.log(`Created new room: ${roomId}`);
  }

  // Check if this connection is already in this room
  if (ws.rooms && ws.rooms.has(roomId)) {
    if (DEBUG) console.log(`Client already in room ${roomId}, skipping join`);
    return;
  }

  // Add user to room
  rooms.get(roomId).set(ws, userId);

  // Track connection by userId
  if (!userConnections.has(userId)) {
    userConnections.set(userId, new Set());
    if (DEBUG) console.log(`Tracking new user: ${userId}`);
  }
  userConnections.get(userId).add(ws);

  // Store userId for member list
  ws.userId = userId;

  // Add to user's rooms
  if (!ws.rooms) {
    ws.rooms = new Set();
  }
  ws.rooms.add(roomId);

  if (DEBUG) console.log(`User ${userId} joined room ${roomId}`);

  // Notify room members
  broadcastToRoom(roomId, {
    type: "USER_JOINED",
    roomId: roomId,
    userId: userId,
  });

  // Send updated member list
  updateRoomMembers(roomId);

  if (DEBUG) logStats();
}

function removeFromRoom(ws, roomId) {
  if (rooms.has(roomId)) {
    // Check if this connection is actually in this room
    if (!ws.rooms || !ws.rooms.has(roomId)) {
      if (DEBUG) console.log(`Client not in room ${roomId}, skipping leave`);
      return;
    }

    // Remove from room
    rooms.get(roomId).delete(ws);
    if (DEBUG) console.log(`Removed client from room ${roomId}`);

    // Clean up empty rooms
    if (rooms.get(roomId).size === 0) {
      rooms.delete(roomId);
      if (DEBUG) console.log(`Deleted empty room ${roomId}`);
    } else {
      // Notify room of user leaving
      broadcastToRoom(roomId, {
        type: "USER_LEFT",
        roomId: roomId,
        userId: ws.userId,
      });

      // Update member list
      updateRoomMembers(roomId);
    }
  }

  // Remove from user's rooms
  if (ws.rooms) {
    ws.rooms.delete(roomId);
  }

  if (DEBUG) logStats();
}

// Track connection IDs for debugging
let connectionCounter = 0;

wss.on("connection", function connection(ws) {
  console.log("Connection received at PORT", PORT);
  const connectionId = ++connectionCounter;
  ws.connectionId = connectionId;
  console.log(
    `New client connected (ID: ${connectionId}), total clients: ${wss.clients.size}`
  );

  // Setup heartbeat
  ws.isAlive = true;
  ws.on("pong", heartbeat);

  ws.rooms = new Set(); // track which rooms this connection is in

  ws.on("message", function incoming(data) {
    try {
      const message = JSON.parse(data);
      if (DEBUG)
        console.log(
          `Received message from client ${connectionId}: ${message.type}`
        );

      switch (message.type) {
        case "JOIN_ROOM":
          addToRoom(ws, message.roomId, message.userId);
          break;

        case "LEAVE_ROOM":
          removeFromRoom(ws, message.roomId);
          break;

        case "CHAT_MESSAGE":
          // Create message with timestamp and unique ID
          const chatMessage = {
            id: `${message.userId}-${Date.now()}-${Math.random()
              .toString(36)
              .substring(2, 15)}`,
            type: "CHAT_MESSAGE",
            roomId: message.roomId,
            userId: message.userId,
            userName: message.userName || "Anonymous",
            content: message.content,
            timestamp: new Date().toISOString(),
          };

          if (DEBUG)
            console.log(`Broadcasting chat message to room ${message.roomId}`);
          // Send to all users in room including sender (for consistency)
          broadcastToRoom(message.roomId, chatMessage);
          break;
      }
    } catch (error) {
      console.error(
        `Error processing message from client ${connectionId}:`,
        error
      );
    }
  });

  // Handle client disconnection
  ws.on("close", function (code, reason) {
    console.log(
      `Client ${connectionId} disconnected (code: ${code}, reason: ${
        reason || "none"
      })`
    );

    // Clean up all rooms this client was in
    if (ws.rooms) {
      for (const roomId of ws.rooms) {
        removeFromRoom(ws, roomId);
      }
    }

    // Remove from user connections
    if (ws.userId && userConnections.has(ws.userId)) {
      userConnections.get(ws.userId).delete(ws);
      if (userConnections.get(ws.userId).size === 0) {
        userConnections.delete(ws.userId);
        if (DEBUG)
          console.log(
            `User ${ws.userId} has no more connections, removing tracking`
          );
      }
    }

    if (DEBUG) logStats();
  });

  // Send a welcome message to the client for confirmation
  ws.send(
    JSON.stringify({
      type: "WELCOME",
      message: `Connected to WebSocket server with ID: ${connectionId}`,
    })
  );
});

// Implement periodic ping to detect dead connections
const interval = setInterval(function ping() {
  if (DEBUG)
    console.log(`Checking connections (${wss.clients.size} total clients)...`);

  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) {
      if (DEBUG)
        console.log(
          `Terminating inactive client ${ws.connectionId || "unknown"}`
        );
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping();
  });

  if (DEBUG) logStats();
}, 30000); // Check every 30 seconds

wss.on("close", function close() {
  console.log("WebSocket server closing");
  clearInterval(interval);
});

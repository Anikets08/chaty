import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextApiResponse } from "next";

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

export const initSocket = (res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    const io = new SocketIOServer(res.socket.server);
    res.socket.server.io = io;

    io.on("connection", (socket) => {
      console.log("Client connected");

      socket.on("join-room", (roomId: string) => {
        socket.join(roomId);
      });

      socket.on("leave-room", (roomId: string) => {
        socket.leave(roomId);
      });

      socket.on("send-message", (message) => {
        io.to(message.roomId).emit("new-message", message);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected");
      });
    });
  }
  return res.socket.server.io;
};

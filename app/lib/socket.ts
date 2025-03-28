import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextApiResponse } from "next";

export type NextApiResponseServerIO = NextApiResponse & {
  socket: any & {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export const initSocket = (res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    const io = new SocketIOServer(res.socket.server);
    res.socket.server.io = io;

    io.on("connection", (socket) => {
      socket.on("join-room", (roomId: string) => {
        socket.join(roomId);
      });

      socket.on("leave-room", (roomId: string) => {
        socket.leave(roomId);
      });

      socket.on("send-message", ({ roomId, message, userId }) => {
        io.to(roomId).emit("new-message", {
          message,
          userId,
          timestamp: new Date(),
        });
      });

      socket.on("disconnect", () => {});
    });
  }
  return res.socket.server.io;
};

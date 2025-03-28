"use client";
import Room from "@/components/custom/chat/room";
import RoomSidebar from "@/components/custom/chat/roomSidebar";
import Sidebar from "@/components/custom/sidebar/sidebar";
import getUserName from "@/services/user/getUserName.user";
import useUserStore from "@/store/userStore";
import useWebSocketStore from "@/store/websocketStore";
import { decode, JwtPayload } from "jsonwebtoken";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const { userId, setUserId, userName, setUserName } = useUserStore();
  const { connect, disconnect, isConnected } = useWebSocketStore();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token === null || token === undefined) {
      router.push("/login");
      return;
    }

    try {
      const decodedToken = decode(token) as JwtPayload;
      const getUserId = decodedToken?.userId;
      if (getUserId && !userId) {
        setUserId(getUserId);
      }
      if (!userName) {
        fetchUserName();
      }
      setLoading(false);
    } catch (error) {
      console.error("Error decoding token:", error);
      router.push("/login");
    }
  }, []);

  const fetchUserName = async () => {
    const token = localStorage.getItem("token");
    if (token === null || token === undefined) {
      return;
    }
    const userName = await getUserName(token);
    if (userName) {
      setUserName(userName);
    }
  };

  // websocket connection
  useEffect(() => {
    if (userId && !isConnected) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, []);

  return (
    <>
      {loading && (
        <div className="flex h-screen">
          <div className="m-auto">
            <Loader2 className="animate-spin" />
          </div>
        </div>
      )}
      {!loading && (
        <div className="flex h-screen">
          <Sidebar />
          <Room />
          <RoomSidebar />
        </div>
      )}
    </>
  );
}

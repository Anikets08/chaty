import { create } from "zustand";

interface RoomStore {
  selectedRoomId: string | null;
  setSelectedRoomId: (roomId: string) => void;
}

const useRoomStore = create<RoomStore>((set) => ({
  selectedRoomId:
    typeof window !== "undefined"
      ? localStorage.getItem("selectedRoomId")
      : null,
  setSelectedRoomId: (roomId) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedRoomId", roomId);
    }
    set({ selectedRoomId: roomId });
  },
}));

export default useRoomStore;

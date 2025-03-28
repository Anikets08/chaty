import { create } from "zustand";

interface UserStore {
  userId: string | null;
  setUserId: (userId: string) => void;
  userName: string | null;
  setUserName: (userName: string) => void;
}

const useUserStore = create<UserStore>((set) => ({
  userId: typeof window !== "undefined" ? localStorage.getItem("userId") : null,
  setUserId: (userId) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("userId", userId);
    }
    set({ userId: userId });
  },
  userName:
    typeof window !== "undefined" ? localStorage.getItem("userName") : null,
  setUserName: (userName) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("userName", userName);
    }
  },
}));

export default useUserStore;

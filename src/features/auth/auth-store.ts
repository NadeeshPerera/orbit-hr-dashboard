import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { User } from "@/lib/api/types";

interface AuthState {
  token: string | null;
  user: User | null;
  /** True once the persisted session has been read from storage. */
  hydrated: boolean;
  signIn(token: string, user: User): void;
  signOut(): void;
}

/**
 * Client session. Persisted to localStorage so a refresh keeps you signed in.
 * A real backend should use an httpOnly refresh cookie instead (see docs/ROADMAP.md).
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hydrated: false,
      signIn: (token, user) => set({ token, user }),
      signOut: () => set({ token: null, user: null }),
    }),
    {
      name: "orbit-session",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ token, user }) => ({ token, user }),
      onRehydrateStorage: () => () => useAuthStore.setState({ hydrated: true }),
    },
  ),
);

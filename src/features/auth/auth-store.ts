import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { User } from "@/lib/api/types";

interface AuthState {
  token: string | null;
  user: User | null;
  signIn(token: string, user: User): void;
  signOut(): void;
}

/**
 * Client session. Persisted to localStorage so a refresh keeps you signed in.
 * A real backend should use an httpOnly refresh cookie instead (see docs/PLAN.md).
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      signIn: (token, user) => set({ token, user }),
      signOut: () => set({ token: null, user: null }),
    }),
    {
      name: "orbit-session",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ token, user }) => ({ token, user }),
    },
  ),
);

/**
 * True once the saved session has been read from storage (always false on the server).
 * Reads Zustand's own hydration status instead of mirroring it in state, which avoids a
 * race: hydration from localStorage happens synchronously while the store is created.
 */
export function useAuthHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useAuthStore.persist.onFinishHydration(onChange),
    () => useAuthStore.persist.hasHydrated(),
    () => false,
  );
}

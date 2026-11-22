"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { ThemeProvider } from "next-themes";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/overlays";
import { useAuthStore } from "@/features/auth/auth-store";
import { isApiError } from "@/lib/api/client";

function makeQueryClient() {
  // Any 401 anywhere means the session is gone: sign out (the guard redirects to /login).
  const onError = (error: unknown) => {
    if (isApiError(error) && error.status === 401) useAuthStore.getState().signOut();
  };
  return new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (count, error) => !(isApiError(error) && error.status < 500) && count < 2,
      },
    },
  });
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <MotionConfig reducedMotion="user" transition={{ type: "spring", bounce: 0.15, duration: 0.45 }}>
          <TooltipProvider delayDuration={300}>
            {children}
            <Toaster richColors closeButton position="top-center" toastOptions={{ className: "font-sans" }} />
          </TooltipProvider>
        </MotionConfig>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { useAuthStore } from "@/features/auth/auth-store";

/** Renders with a fresh QueryClient and a signed-in demo session. */
export function renderWithProviders(ui: ReactElement, { signedIn = true } = {}) {
  if (signedIn) {
    useAuthStore.setState({
      token: "demo-token",
      user: { id: "EMP-1008", name: "Ava Chen", email: "ava.chen@orbit-demo.com", role: "admin", title: "Head of People" }
    });
  } else {
    useAuthStore.setState({ token: null, user: null });
  }
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return {
    user: userEvent.setup(),
    client,
    ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>),
  };
}

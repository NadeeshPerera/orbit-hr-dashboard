import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/features/auth/auth-store";
import { LoginForm } from "@/features/auth/login-form";
import { EmployeesTable } from "@/features/employees/employees-table";
import { RequestLeaveDialog } from "@/features/time-off/request-dialog";
import { TimeOffView } from "@/features/time-off/time-off-view";
import type { Employee } from "@/lib/api/types";
import { renderWithProviders } from "@/test/render";
import { useMockApi } from "@/test/server";

const router = { replace: vi.fn(), push: vi.fn() };
let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/time-off",
  useSearchParams: () => searchParams,
}));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));

beforeEach(() => {
  router.replace.mockReset();
  router.push.mockReset();
  searchParams = new URLSearchParams();
});

describe("<LoginForm />", () => {
  it("validates before calling the API", async () => {
    useMockApi();
    const { user } = renderWithProviders(<LoginForm />, { signedIn: false });
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Enter your work email")).toBeInTheDocument();
    expect(screen.getByText("Enter your password")).toBeInTheDocument();
    expect(screen.getByLabelText("Work email")).toHaveAttribute("aria-invalid", "true");
  });

  it("shows the server's error for a wrong password", async () => {
    useMockApi();
    const { user } = renderWithProviders(<LoginForm />, { signedIn: false });
    await user.type(screen.getByLabelText("Work email"), "ava.chen@orbit-demo.com");
    await user.type(screen.getByLabelText("Password"), "nope");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("don't match our records");
    expect(useAuthStore.getState().token).toBeNull();
  });

  it("signs in with the demo account and goes to the dashboard", async () => {
    useMockApi();
    const { user } = renderWithProviders(<LoginForm />, { signedIn: false });
    await user.click(screen.getByRole("button", { name: /Use the demo account/ }));
    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/dashboard"));
    expect(useAuthStore.getState()).toMatchObject({ token: "demo-token", user: { name: "Ava Chen" } });
  });
});

describe("<EmployeesTable />", () => {
  const rows = (["Ada", "Ben", "Cy"] as const).map(
    (firstName, i): Employee => ({
      id: `EMP-${i}`, firstName, lastName: "Test", email: `${firstName.toLowerCase()}@x.com`, phone: "", jobTitle: "Engineer",
      department: "Engineering", location: "Berlin", employmentType: "full_time", status: "active",
      startDate: "2024-01-01", endDate: null, birthDate: "1990-01-01", managerId: null,
    }),
  );

  it("sorts on the server via callbacks and exposes aria-sort", async () => {
    const onSortChange = vi.fn();
    const { user } = renderWithProviders(
      <EmployeesTable rows={rows} sort="name" dir="asc" onSortChange={onSortChange} selection={{}} onSelectionChange={vi.fn()} onOpen={vi.fn()} busy={false} />,
    );
    expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute("aria-sort", "ascending");

    await user.click(screen.getByRole("button", { name: /^Name/ }));
    expect(onSortChange).toHaveBeenCalledWith("name", "desc");

    await user.click(screen.getByRole("button", { name: /^Department/ }));
    expect(onSortChange).toHaveBeenLastCalledWith("department", "asc");
  });

  it("selects all rows on the page and opens a profile", async () => {
    const onSelectionChange = vi.fn();
    const onOpen = vi.fn();
    const { user } = renderWithProviders(
      <EmployeesTable rows={rows} sort="name" dir="asc" onSortChange={vi.fn()} selection={{}} onSelectionChange={onSelectionChange} onOpen={onOpen} busy={false} />,
    );
    await user.click(screen.getByRole("checkbox", { name: "Select all on this page" }));
    expect(onSelectionChange).toHaveBeenCalledWith({ "EMP-0": true, "EMP-1": true, "EMP-2": true });

    await user.click(screen.getByRole("button", { name: /Ben Test/ }));
    expect(onOpen).toHaveBeenCalledWith("EMP-1");
  });
});

describe("<TimeOffView /> approvals", () => {
  it("approves a request optimistically and persists it on the server", async () => {
    const db = useMockApi();
    const pendingBefore = db.listLeave({ status: "pending" });
    const target = pendingBefore[0];
    const name = `${target.employee.firstName} ${target.employee.lastName}`;

    const { user } = renderWithProviders(<TimeOffView />);
    const tab = await screen.findByRole("tab", { name: new RegExp(`Approvals\\s*${pendingBefore.length}`) });
    expect(tab).toHaveAttribute("aria-selected", "true");

    await user.click(await screen.findByRole("button", { name: `Approve ${name}'s request` }));

    await waitFor(() => expect(screen.queryByRole("button", { name: `Approve ${name}'s request` })).not.toBeInTheDocument());
    await waitFor(() => expect(db.listLeave({ status: "pending" })).toHaveLength(pendingBefore.length - 1));
    expect(db.listLeave({ status: "approved" }).some((r) => r.id === target.id)).toBe(true);
  });

  it("switches to my requests", async () => {
    useMockApi();
    const { user } = renderWithProviders(<TimeOffView />);
    await user.click(await screen.findByRole("tab", { name: "My requests" }));
    const panel = screen.getByRole("tabpanel");
    expect(await within(panel).findAllByText("Annual leave")).not.toHaveLength(0);
  });
});

describe("<RequestLeaveDialog />", () => {
  it("validates the date range and shows the working-day count live", async () => {
    useMockApi();
    const { user } = renderWithProviders(<RequestLeaveDialog open onOpenChange={vi.fn()} />);
    const dialog = await screen.findByRole("dialog", { name: "Request time off" });

    await user.type(within(dialog).getByLabelText("From"), "2026-11-30");
    await user.type(within(dialog).getByLabelText("To"), "2026-12-04");
    expect(await within(dialog).findByText("5 working days")).toBeInTheDocument();

    await user.clear(within(dialog).getByLabelText("To"));
    await user.type(within(dialog).getByLabelText("To"), "2026-11-27");
    await user.click(within(dialog).getByRole("button", { name: "Submit request" }));
    expect(await within(dialog).findByText("End date must be on or after the start date")).toBeInTheDocument();
  });

  it("submits a valid request and closes", async () => {
    const db = useMockApi();
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(<RequestLeaveDialog open onOpenChange={onOpenChange} />);
    const dialog = await screen.findByRole("dialog", { name: "Request time off" });

    await user.selectOptions(within(dialog).getByLabelText("Type"), "sick");
    await user.type(within(dialog).getByLabelText("From"), "2026-11-23");
    await user.type(within(dialog).getByLabelText("To"), "2026-11-24");
    await user.type(within(dialog).getByLabelText(/Note/), "Dentist");
    await user.click(within(dialog).getByRole("button", { name: "Submit request" }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(db.listLeave({ scope: "mine", status: "pending" }).some((r) => r.type === "sick" && r.days === 2 && r.reason === "Dentist")).toBe(true);
  });
});

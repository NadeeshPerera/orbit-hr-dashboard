"use client";

import type { RowSelectionState } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Download, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Avatar, Card, Input, NativeSelect, Skeleton } from "@/components/ui/primitives";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useEmployeeFacets, useEmployees } from "@/lib/api/queries";
import { EMPLOYEE_STATUSES, type Employee } from "@/lib/api/types";
import { fullName, STATUS_LABEL } from "@/lib/utils";
import { downloadCsv, employeesToCsv } from "./csv";
import { EmployeeDrawer } from "./employee-drawer";
import { EmployeesTable } from "./employees-table";
import { StatusBadge } from "./status-badge";
import { useEmployeeParams } from "./use-employee-params";

function MobileList({ rows, onOpen }: { rows: Employee[]; onOpen: (id: string) => void }) {
  return (
    <ul className="divide-y">
      {rows.map((e, i) => (
        <motion.li key={e.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}>
          <button type="button" onClick={() => onOpen(e.id)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-muted">
            <Avatar person={e} size="lg" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{fullName(e)}</span>
              <span className="block truncate text-sm text-muted-foreground">{e.jobTitle}</span>
              <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" /> {e.location} · {e.department}
              </span>
            </span>
            <StatusBadge status={e.status} />
          </button>
        </motion.li>
      ))}
    </ul>
  );
}

export function EmployeesView() {
  const { query, selectedId, update } = useEmployeeParams();
  const { data, isPending, isFetching, isError, refetch } = useEmployees(query);
  const facets = useEmployeeFacets();
  const [selection, setSelection] = useState<RowSelectionState>({});
  const [showFilters, setShowFilters] = useState(false);

  // Search box: instant typing, debounced URL update.
  const [search, setSearch] = useState(query.q ?? "");
  const debounced = useDebouncedValue(search.trim(), 300);
  useEffect(() => {
    if (debounced !== (query.q ?? "")) update({ q: debounced || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- react only to the debounced value
  }, [debounced]);

  const activeFilters = [query.department, query.status, query.location].filter(Boolean).length;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const selectedRows = data?.items.filter((e) => selection[e.id]) ?? [];

  const clearAll = () => {
    setSearch("");
    update({ q: undefined, department: undefined, status: undefined, location: undefined });
  };

  const filters = (
    <>
      <NativeSelect aria-label="Department" value={query.department ?? ""} onChange={(e) => update({ department: e.target.value })} className="xl:w-48">
        <option value="">All departments</option>
        {facets.data?.departments.map((d) => (
          <option key={d.value} value={d.value}>
            {d.value} ({d.count})
          </option>
        ))}
      </NativeSelect>
      <NativeSelect aria-label="Location" value={query.location ?? ""} onChange={(e) => update({ location: e.target.value })} className="xl:w-40">
        <option value="">All locations</option>
        {facets.data?.locations.map((l) => (
          <option key={l.value} value={l.value}>
            {l.value} ({l.count})
          </option>
        ))}
      </NativeSelect>
      <NativeSelect aria-label="Status" value={query.status ?? ""} onChange={(e) => update({ status: e.target.value })} className="xl:w-40">
        <option value="">Current employees</option>
        {EMPLOYEE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </NativeSelect>
    </>
  );

  return (
    <>
      <PageHeader
        title="Employees"
        description={data ? `${data.total} ${data.total === 1 ? "person" : "people"} ${activeFilters || query.q ? "match your filters" : "in your organisation"}` : "Your people directory"}
        actions={
          <Button variant="outline" disabled={!data?.items.length} onClick={() => downloadCsv("employees.csv", employeesToCsv(selectedRows.length ? selectedRows : (data?.items ?? [])))}>
            <Download /> Export {selectedRows.length ? `${selectedRows.length} selected` : "page"}
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="space-y-3 border-b p-3 sm:p-4">
          <div className="flex flex-col gap-2 xl:flex-row">
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, role or ID" aria-label="Search employees" className="pl-9" />
            </div>
            <Button variant="outline" size="icon" className="relative sm:hidden" aria-label="Filters" aria-expanded={showFilters} onClick={() => setShowFilters((v) => !v)}>
              <SlidersHorizontal />
              {activeFilters > 0 && <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">{activeFilters}</span>}
            </Button>
          </div>
            <div className="hidden gap-2 sm:grid sm:grid-cols-3 xl:flex">{filters}</div>
          </div>
          <AnimatePresence initial={false}>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="grid gap-2 overflow-hidden sm:hidden">
                {filters}
              </motion.div>
            )}
          </AnimatePresence>
          {(activeFilters > 0 || query.q) && (
            <button type="button" onClick={clearAll} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              <X className="size-3" /> Clear filters
            </button>
          )}
        </div>

        {isError ? (
          <div role="alert" className="p-8 text-center text-sm">
            Couldn&apos;t load employees.{" "}
            <button className="font-semibold text-danger underline" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        ) : isPending ? (
          <div className="space-y-3 p-4" aria-busy="true">
            {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : data.items.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-medium">No one matches those filters</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a different search or clear the filters.</p>
            <Button variant="outline" className="mt-4" onClick={clearAll}>
              Clear filters
            </Button>
          </div>
        ) : (
          <>
            <div className="hidden lg:block">
              <EmployeesTable
                rows={data.items}
                sort={query.sort ?? "name"}
                dir={query.dir ?? "asc"}
                onSortChange={(sort, dir) => update({ sort, dir })}
                selection={selection}
                onSelectionChange={setSelection}
                onOpen={(id) => update({ employee: id }, { resetPage: false })}
                busy={isFetching}
              />
            </div>
            <div className="lg:hidden">
              <MobileList rows={data.items} onOpen={(id) => update({ employee: id }, { resetPage: false })} />
            </div>
          </>
        )}

        {data && data.total > 0 && (
          <nav aria-label="Pagination" className="flex items-center justify-between gap-3 border-t px-4 py-3 text-sm">
            <p className="text-muted-foreground" aria-live="polite">
              {(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.total)} of {data.total}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon-sm" aria-label="Previous page" disabled={data.page <= 1} onClick={() => update({ page: data.page - 1 }, { resetPage: false })}>
                <ChevronLeft />
              </Button>
              <span className="tabular-nums">
                {data.page} / {totalPages}
              </span>
              <Button variant="outline" size="icon-sm" aria-label="Next page" disabled={data.page >= totalPages} onClick={() => update({ page: data.page + 1 }, { resetPage: false })}>
                <ChevronRight />
              </Button>
            </div>
          </nav>
        )}
      </Card>

      <EmployeeDrawer id={selectedId} onClose={() => update({ employee: undefined }, { resetPage: false })} onOpen={(id) => update({ employee: id }, { resetPage: false })} />
    </>
  );
}

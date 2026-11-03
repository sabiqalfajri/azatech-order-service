"use client";

import { Loader2, Plus, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { DataPagination } from "@/src/components/shared/data-pagination";
import { Button, buttonVariants } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { ApiError } from "@/src/lib/api-client";
import { formatNumber } from "@/src/lib/format";
import { useOrders } from "../hooks";
import { ORDER_STATUSES, ORDER_STATUS_META } from "../status";
import type { OrderStatus } from "../types";
import { OrdersTable } from "./orders-table";

const PER_PAGE = 10;

type StatusFilter = "all" | OrderStatus;

export function OrdersView() {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const rangeInvalid = !!dateFrom && !!dateTo && dateFrom > dateTo;
  const hasFilters = status !== "all" || !!dateFrom || !!dateTo;

  const { data, isPending, isFetching, isError, error, refetch } = useOrders(
    {
      page,
      per_page: PER_PAGE,
      status: status === "all" ? undefined : status,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    },
    { enabled: !rangeInvalid }
  );

  const orders = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  function changeStatus(value: StatusFilter | null) {
    setStatus(value ?? "all");
    setPage(1);
  }
  function changeDateFrom(value: string) {
    setDateFrom(value);
    setPage(1);
  }
  function changeDateTo(value: string) {
    setDateTo(value);
    setPage(1);
  }
  function resetFilters() {
    setStatus("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Daftar Order</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${formatNumber(total)} order${hasFilters ? " sesuai filter" : ""}` : "Memuat data…"}
          </p>
        </div>
        <Link href="/orders/new" className={buttonVariants()}>
          <Plus />
          Buat order
        </Link>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="status-filter">Status</Label>
          <Select value={status} onValueChange={changeStatus}>
            <SelectTrigger id="status-filter" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua status</SelectItem>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {ORDER_STATUS_META[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="date-from">Dari tanggal</Label>
          <Input
            id="date-from"
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            aria-invalid={rangeInvalid}
            onChange={(e) => changeDateFrom(e.target.value)}
            className="w-44"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="date-to">Sampai tanggal</Label>
          <Input
            id="date-to"
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            aria-invalid={rangeInvalid}
            onChange={(e) => changeDateTo(e.target.value)}
            className="w-44"
          />
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X />
            Hapus filter
          </Button>
        )}

        {isFetching && !isPending && (
          <Loader2 className="mb-2 size-4 animate-spin text-muted-foreground" aria-label="Memuat" />
        )}
      </div>

      {rangeInvalid && (
        <p role="alert" className="text-sm text-destructive">
          Tanggal awal tidak boleh setelah tanggal akhir.
        </p>
      )}

      <OrdersTable
        orders={orders}
        isLoading={isPending}
        isRefreshing={isFetching && !isPending}
        errorMessage={
          isError
            ? error instanceof ApiError
              ? error.message
              : "Terjadi kesalahan tak terduga"
            : undefined
        }
        hasFilters={hasFilters}
        skeletonRows={5}
        onRetry={() => refetch()}
        onResetFilters={resetFilters}
      />

      <DataPagination
        page={page}
        perPage={PER_PAGE}
        total={total}
        disabled={isFetching}
        onPageChange={setPage}
      />
    </div>
  );
}
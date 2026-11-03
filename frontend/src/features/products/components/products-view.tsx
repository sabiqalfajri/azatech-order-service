"use client";

import { ChevronLeft, ChevronRight, Loader2, Plus, Search } from "lucide-react";
import { useState } from "react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { useDebounce } from "@/src/hooks/use-debounce";
import { ApiError } from "@/src/lib/api-client";
import { formatNumber } from "@/src/lib/format";
import { useProducts } from "../hooks";
import type { Product } from "../types";
import { ProductFormDialog } from "./product-form-dialog";
import { ProductsTable } from "./products-table";

const PER_PAGE = 10;

export function ProductsView() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | undefined>();

  const searchTerm = useDebounce(search.trim(), 300);

  const { data, isPending, isFetching, isError, error, refetch } = useProducts({
    page,
    per_page: PER_PAGE,
    search: searchTerm || undefined,
  });

  const products = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const from = total === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const to = Math.min(page * PER_PAGE, total);

  function openCreate() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setDialogOpen(true);
  }

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Produk</h1>
          <p className="text-sm text-muted-foreground">
            {data
              ? searchTerm
                ? `${formatNumber(total)} hasil`
                : `${formatNumber(total)} produk`
              : "Memuat data…"}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          Tambah produk
        </Button>
      </div>

      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => updateSearch(e.target.value)}
          placeholder="Cari nama atau kode produk"
          aria-label="Cari produk"
          className="pl-8 pr-8"
        />
        {isFetching && !isPending && (
          <Loader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      <ProductsTable
        products={products}
        isLoading={isPending}
        isRefreshing={isFetching && !isPending}
        errorMessage={
          isError
            ? error instanceof ApiError
              ? error.message
              : "Terjadi kesalahan tak terduga"
            : undefined
        }
        searchTerm={searchTerm}
        skeletonRows={5}
        onRetry={() => refetch()}
        onClearSearch={() => updateSearch("")}
        onEdit={openEdit}
      />

      <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
        <p className="tabular-nums">
          {total > 0 ? `Menampilkan ${from}–${to} dari ${formatNumber(total)}` : "Tidak ada data"}
        </p>
        <div className="flex items-center gap-2">
          <span className="tabular-nums">
            Halaman {page} dari {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Halaman sebelumnya"
            disabled={page <= 1 || isFetching}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Halaman berikutnya"
            disabled={page >= totalPages || isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editing}
        onSuccess={() => !editing && setPage(1)} 
      />
    </div>
  );
}
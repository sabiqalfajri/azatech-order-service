"use client";

import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { ApiError } from "@/src/lib/api-client";
import { formatDateTime, formatNumber, formatRupiah } from "@/src/lib/format";
import { useCancelOrder, useOrder, usePayOrder } from "../hooks";
import { CancelOrderDialog } from "./cancel-order-dialog";
import { OrderStatusBadge } from "./order-status-badge";

const BackLink = () => (
  <Link
    href="/orders"
    className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2" })}
  >
    <ArrowLeft />
    Daftar order
  </Link>
);

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <BackLink />
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

const messageOf = (err: unknown) =>
  err instanceof ApiError ? err.message : "Terjadi kesalahan tak terduga";

export function OrderDetail({ id }: { id: string }) {
  const { data: order, isPending, isError, error, refetch } = useOrder(id);
  const pay = usePayOrder();
  const cancel = useCancelOrder();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  if (isPending) return <DetailSkeleton />;

  if (isError || !order) {
    // id yang bukan UUID ditolak backend dengan 422, id yang tidak ada dengan 404
    const notFound = error instanceof ApiError && (error.status === 404 || error.status === 422);
    return (
      <div className="space-y-6">
        <BackLink />
        <div className="flex flex-col items-start gap-2 rounded-md border p-6">
          <p className="text-sm font-medium">
            {notFound ? "Order tidak ditemukan" : "Order gagal dimuat"}
          </p>
          <p className="text-sm text-muted-foreground">
            {notFound
              ? "Order yang dicari tidak ada atau tautannya tidak valid."
              : messageOf(error)}
          </p>
          {!notFound && (
            <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
              Coba lagi
            </Button>
          )}
        </div>
      </div>
    );
  }

  const items = order.items ?? [];
  const canPay = order.status === "PENDING";
  const canCancel = order.status === "PENDING" || order.status === "PAID";
  const busy = pay.isPending || cancel.isPending;

  async function handlePay() {
    setActionError(null);
    try {
      await pay.mutateAsync(order!.id);
    } catch (err) {
      setActionError(messageOf(err));
    }
  }

  async function handleCancel() {
    setCancelError(null);
    try {
      await cancel.mutateAsync(order!.id);
      setCancelOpen(false);
    } catch (err) {
      setCancelError(messageOf(err));
    }
  }

  function openCancelDialog(open: boolean) {
    if (open) setCancelError(null);
    setCancelOpen(open);
  }

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-xl font-semibold tracking-tight">{order.order_number}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Dibuat {formatDateTime(order.created_at)}
          </p>
          {order.status === "CANCELLED" && (
            <p className="text-sm text-muted-foreground">
              Order dibatalkan dan stok produknya sudah dikembalikan.
            </p>
          )}
        </div>

        {(canPay || canCancel) && (
          <div className="flex gap-2">
            {canCancel && (
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                disabled={busy}
                onClick={() => openCancelDialog(true)}
              >
                Batalkan
              </Button>
            )}
            {canPay && (
              <Button disabled={busy} onClick={handlePay}>
                {pay.isPending && <Loader2 className="animate-spin" />}
                Bayar
              </Button>
            )}
          </div>
        )}
      </div>

      {actionError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {actionError}
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="rounded-lg border">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-medium">Item order</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead className="text-right">Harga satuan</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{item.product_code}</p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatRupiah(item.unit_price)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(item.quantity)}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatRupiah(item.subtotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="border-t px-4 py-2 text-xs text-muted-foreground">
            Nama dan harga satuan adalah data saat order dibuat, dan tidak berubah walau produknya
            diubah kemudian.
          </p>
        </section>

        <aside className="space-y-6 lg:sticky lg:top-6">
          <section className="space-y-4 rounded-lg border p-4">
            <h2 className="text-sm font-medium">Ringkasan</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{formatRupiah(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Diskon</dt>
                <dd className="tabular-nums">
                  {order.discount_amount > 0
                    ? `− ${formatRupiah(order.discount_amount)}`
                    : formatRupiah(0)}
                </dd>
              </div>
            </dl>
            <div className="flex items-baseline justify-between gap-4 border-t pt-4">
              <span className="text-sm font-medium">Total</span>
              <span className="text-xl font-semibold tabular-nums">
                {formatRupiah(order.grand_total)}
              </span>
            </div>
          </section>

          <section className="space-y-3 rounded-lg border p-4">
            <h2 className="text-sm font-medium">Informasi</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Pelanggan</dt>
                <dd>{order.customer?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Dibuat</dt>
                <dd>{formatDateTime(order.created_at)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Diperbarui</dt>
                <dd>{formatDateTime(order.updated_at)}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>

      <CancelOrderDialog
        open={cancelOpen}
        onOpenChange={openCancelDialog}
        orderNumber={order.order_number}
        isPaid={order.status === "PAID"}
        pending={cancel.isPending}
        error={cancelError}
        onConfirm={handleCancel}
      />
    </div>
  );
}
import { ChevronRight } from "lucide-react";
import Link from "next/link";

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
import { formatDateTime, formatRupiah } from "@/src/lib/format";
import type { Order } from "../types";
import { OrderStatusBadge } from "./order-status-badge";

const COLUMNS = 6;

type OrdersTableProps = {
  orders: Order[];
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage?: string;
  hasFilters: boolean;
  skeletonRows: number;
  onRetry: () => void;
  onResetFilters: () => void;
};

function MessageRow({ children }: { children: React.ReactNode }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={COLUMNS} className="h-48 text-center">
        <div className="mx-auto flex max-w-sm flex-col items-center gap-2">{children}</div>
      </TableCell>
    </TableRow>
  );
}

export function OrdersTable({
  orders,
  isLoading,
  isRefreshing,
  errorMessage,
  hasFilters,
  skeletonRows,
  onRetry,
  onResetFilters,
}: OrdersTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-48">No. order</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Pelanggan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Detail</span>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className={isRefreshing ? "opacity-60 transition-opacity" : undefined}>
          {isLoading ? (
            Array.from({ length: skeletonRows }, (_, i) => (
              <TableRow key={i} className="hover:bg-transparent">
                <TableCell>
                  <Skeleton className="h-4 w-36" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="ml-auto h-4 w-24" />
                </TableCell>
                <TableCell />
              </TableRow>
            ))
          ) : errorMessage ? (
            <MessageRow>
              <p className="text-sm font-medium">Order gagal dimuat</p>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
                Coba lagi
              </Button>
            </MessageRow>
          ) : orders.length === 0 ? (
            <MessageRow>
              {hasFilters ? (
                <>
                  <p className="text-sm font-medium">Tidak ada order yang cocok</p>
                  <p className="text-sm text-muted-foreground">
                    Ubah atau hapus filter untuk melihat order lain.
                  </p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={onResetFilters}>
                    Hapus filter
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">Belum ada order</p>
                  <p className="text-sm text-muted-foreground">
                    Order yang dibuat akan muncul di sini.
                  </p>
                  <Link
                    href="/orders/new"
                    className={buttonVariants({ variant: "outline", size: "sm", className: "mt-2" })}
                  >
                    Buat order
                  </Link>
                </>
              )}
            </MessageRow>
          ) : (
            orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell>
                  <Link
                    href={`/orders/${o.id}`}
                    className="font-mono text-xs font-medium hover:underline"
                  >
                    {o.order_number}
                  </Link>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDateTime(o.created_at)}
                </TableCell>
                <TableCell>{o.customer?.name ?? "—"}</TableCell>
                <TableCell>
                  <OrderStatusBadge status={o.status} />
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatRupiah(o.grand_total)}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/orders/${o.id}`}
                    aria-label={`Lihat ${o.order_number}`}
                    className={buttonVariants({ variant: "ghost", size: "icon", className: "size-8" })}
                  >
                    <ChevronRight className="size-4" />
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
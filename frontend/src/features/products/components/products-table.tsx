import { Pencil } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { formatNumber, formatRupiah } from "@/src/lib/format";
import type { Product } from "../types";

const COLUMNS = 5;

type ProductsTableProps = {
  products: Product[];
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage?: string;
  searchTerm?: string;
  skeletonRows: number;
  onRetry: () => void;
  onClearSearch: () => void;
  onEdit: (product: Product) => void;
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

export function ProductsTable({
  products,
  isLoading,
  isRefreshing,
  errorMessage,
  searchTerm,
  skeletonRows,
  onRetry,
  onClearSearch,
  onEdit,
}: ProductsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-44">Kode</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead className="text-right">Harga</TableHead>
            <TableHead className="text-right">Stok</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Aksi</span>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className={isRefreshing ? "opacity-60 transition-opacity" : undefined}>
          {isLoading ? (
            Array.from({ length: skeletonRows }, (_, i) => (
              <TableRow key={i} className="hover:bg-transparent">
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-48" />
                </TableCell>
                <TableCell>
                  <Skeleton className="ml-auto h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="ml-auto h-4 w-10" />
                </TableCell>
                <TableCell />
              </TableRow>
            ))
          ) : errorMessage ? (
            <MessageRow>
              <p className="text-sm font-medium">Produk gagal dimuat</p>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
                Coba lagi
              </Button>
            </MessageRow>
          ) : products.length === 0 ? (
            <MessageRow>
              {searchTerm ? (
                <>
                  <p className="text-sm font-medium">Tidak ada hasil</p>
                  <p className="text-sm text-muted-foreground">
                    Tidak ada produk yang cocok dengan “{searchTerm}”.
                  </p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={onClearSearch}>
                    Hapus pencarian
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">Belum ada produk</p>
                  <p className="text-sm text-muted-foreground">
                    Tambahkan produk pertama lewat tombol di kanan atas.
                  </p>
                </>
              )}
            </MessageRow>
          ) : (
            products.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {p.product_code}
                </TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-right tabular-nums">{formatRupiah(p.price)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {p.stock === 0 ? (
                    <span className="font-medium text-destructive">Habis</span>
                  ) : (
                    formatNumber(p.stock)
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={`Ubah ${p.name}`}
                    onClick={() => onEdit(p)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { formatNumber } from "@/src/lib/format";

type DataPaginationProps = {
  page: number;
  perPage: number;
  total: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
};

export function DataPagination({ page, perPage, total, disabled, onPageChange }: DataPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
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
          disabled={page <= 1 || disabled}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          aria-label="Halaman berikutnya"
          disabled={page >= totalPages || disabled}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
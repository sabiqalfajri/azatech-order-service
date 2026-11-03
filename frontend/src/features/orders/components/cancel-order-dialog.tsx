"use client";

import { AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";

type CancelOrderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderNumber: string;
  isPaid: boolean;
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
};

export function CancelOrderDialog({
  open,
  onOpenChange,
  orderNumber,
  isPaid,
  pending,
  error,
  onConfirm,
}: CancelOrderDialogProps) {
  return (
    // Dialog tidak boleh tertutup saat request berjalan
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Batalkan order?</DialogTitle>
          <DialogDescription>
            Order <span className="font-mono">{orderNumber}</span> akan berstatus Dibatalkan dan stok
            semua produknya dikembalikan. Tindakan ini tidak dapat diurungkan.
            {isPaid && " Order ini sudah dibayar, dan aplikasi ini tidak memproses pengembalian dana."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Kembali
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            Ya, batalkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
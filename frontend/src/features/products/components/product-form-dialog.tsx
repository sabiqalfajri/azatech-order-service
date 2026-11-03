"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { ApiError } from "@/src/lib/api-client";
import { useCreateProduct, useUpdateProduct } from "../hooks";
import { productFormSchema, type ProductFormValues } from "../schema";
import type { Product } from "../types";

const FIELDS: (keyof ProductFormValues)[] = ["product_code", "name", "price", "stock"];

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
};

function Field({ id, label, error, hint, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

function ProductForm({
  product,
  onCancel,
  onSuccess,
}: {
  product?: Product;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const create = useCreateProduct();
  const update = useUpdateProduct();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product
      ? {
          product_code: product.product_code,
          name: product.name,
          price: product.price,
          stock: product.stock,
        }
      : { product_code: "", name: "", stock: 0 },
  });

  async function onSubmit(values: ProductFormValues) {
    try {
      if (product) await update.mutateAsync({ id: product.id, input: values });
      else await create.mutateAsync(values);
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        // Error per field dari server (mis. 409 kode duplikat) ditempelkan ke input yang sesuai
        let mapped = false;
        for (const [field, messages] of Object.entries(err.errors ?? {})) {
          if ((FIELDS as string[]).includes(field)) {
            setError(field as keyof ProductFormValues, { message: messages[0] });
            mapped = true;
          }
        }
        if (!mapped) setError("root", { message: err.message });
        return;
      }
      setError("root", { message: "Terjadi kesalahan tak terduga" });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {errors.root && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {errors.root.message}
        </div>
      )}

      <Field id="product_code" label="Kode produk" error={errors.product_code?.message}>
        <Input
          id="product_code"
          autoComplete="off"
          className="font-mono"
          aria-invalid={!!errors.product_code}
          aria-describedby={errors.product_code ? "product_code-error" : undefined}
          {...register("product_code")}
        />
      </Field>

      <Field id="name" label="Nama produk" error={errors.name?.message}>
        <Input
          id="name"
          autoComplete="off"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
          {...register("name")}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field id="price" label="Harga" error={errors.price?.message}>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              Rp
            </span>
            <Input
              id="price"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              className="pl-9 tabular-nums"
              aria-invalid={!!errors.price}
              aria-describedby={errors.price ? "price-error" : undefined}
              {...register("price", { valueAsNumber: true })}
            />
          </div>
        </Field>

        <Field
          id="stock"
          label="Stok"
          error={errors.stock?.message}
          hint={product ? "Mengganti nilai stok saat ini." : undefined}
        >
          <Input
            id="stock"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            className="tabular-nums"
            aria-invalid={!!errors.stock}
            aria-describedby={errors.stock ? "stock-error" : undefined}
            {...register("stock", { valueAsNumber: true })}
          />
        </Field>
      </div>

      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {product ? "Simpan perubahan" : "Tambah produk"}
        </Button>
      </DialogFooter>
    </form>
  );
}

type ProductFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
  onSuccess?: () => void;
};

export function ProductFormDialog({ open, onOpenChange, product, onSuccess }: ProductFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{product ? "Ubah produk" : "Tambah produk"}</DialogTitle>
          <DialogDescription>
            {product
              ? "Perubahan harga tidak memengaruhi order yang sudah dibuat."
              : "Kode produk harus unik. Harga dalam Rupiah."}
          </DialogDescription>
        </DialogHeader>
        <ProductForm
          product={product}
          onCancel={() => onOpenChange(false)}
          onSuccess={() => {
            onOpenChange(false);
            onSuccess?.();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
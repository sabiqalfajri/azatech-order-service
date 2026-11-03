"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type FieldPath,
  type UseFormRegister,
  type UseFormSetError,
} from "react-hook-form";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useCustomers } from "@/src/features/customers/hooks";
import { useProducts } from "@/src/features/products/hooks";
import type { Product } from "@/src/features/products/types";
import { ApiError, type FieldErrors } from "@/src/lib/api-client";
import { formatRupiah } from "@/src/lib/format";
import { cn } from "@/src/lib/utils";
import { getDiscount } from "../calculate";
import { useCreateOrder } from "../hooks";
import { createOrderFormSchema, type CreateOrderFormValues } from "../schema";

const LIST_LIMIT = 100; 
const ROW_GRID = "md:grid-cols-[minmax(0,1fr)_7rem_8rem_8rem_2.25rem] md:gap-4";

function applyServerErrors(
  errors: FieldErrors | undefined,
  setError: UseFormSetError<CreateOrderFormValues>
) {
  let mapped = false;
  for (const [key, messages] of Object.entries(errors ?? {})) {
    if (key === "customer_id" || /^items\.\d+\.(product_id|quantity)$/.test(key)) {
      setError(key as FieldPath<CreateOrderFormValues>, { type: "server", message: messages[0] });
      mapped = true;
    }
  }
  return mapped;
}

type RowProps = {
  index: number;
  control: Control<CreateOrderFormValues>;
  register: UseFormRegister<CreateOrderFormValues>;
  errors?: { product_id?: { message?: string }; quantity?: { message?: string } };
  products: Product[];
  isLoadingProducts: boolean;
  takenIds: Set<string>;
  product?: Product;
  quantity: number;
  canRemove: boolean;
  onRemove: () => void;
};

function OrderItemRow({
  index,
  control,
  register,
  errors,
  products,
  isLoadingProducts,
  takenIds,
  product,
  quantity,
  canRemove,
  onRemove,
}: RowProps) {
  const validQty = Number.isInteger(quantity) && quantity > 0;
  const overStock = !!product && validQty && quantity > product.stock;
  const productId = `item-${index}-product`;
  const quantityId = `item-${index}-quantity`;

  return (
    <div className={cn("grid gap-3 border-b px-4 py-4 last:border-b-0 md:items-start", ROW_GRID)}>
      <div className="space-y-1.5">
        <Label htmlFor={productId} className="md:sr-only">
          Produk
        </Label>
        <Controller
          control={control}
          name={`items.${index}.product_id`}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={isLoadingProducts}
            >
              <SelectTrigger
                id={productId}
                className="w-full"
                aria-invalid={!!errors?.product_id}
                aria-describedby={errors?.product_id ? `${productId}-error` : undefined}
              >
                <SelectValue placeholder={isLoadingProducts ? "Memuat produk…" : "Pilih produk"} />
              </SelectTrigger>
              <SelectContent className="w-fit" side="bottom">
                {products.map((p) => (
                  <SelectItem
                    key={p.id}
                    value={p.id}
                    disabled={p.stock === 0 || takenIds.has(p.id)}
                  >
                    {p.product_code} · {p.name}
                    {p.stock === 0 ? " — habis" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors?.product_id && (
          <p id={`${productId}-error`} className="text-xs text-destructive">
            {errors.product_id.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={quantityId} className="md:sr-only">
          Jumlah
        </Label>
        <Input
          id={quantityId}
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          className="tabular-nums"
          aria-invalid={!!errors?.quantity}
          aria-describedby={errors?.quantity ? `${quantityId}-error` : undefined}
          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
        />
        {errors?.quantity ? (
          <p id={`${quantityId}-error`} className="text-xs text-destructive">
            {errors.quantity.message}
          </p>
        ) : (
          product && (
            <p
              className={cn(
                "text-xs",
                overStock ? "text-amber-600 dark:text-amber-500" : "text-muted-foreground"
              )}
            >
              {overStock ? `Melebihi stok (${product.stock})` : `Stok ${product.stock}`}
            </p>
          )
        )}
      </div>

      <div className="flex items-center justify-between text-sm md:h-9 md:justify-end">
        <span className="text-xs text-muted-foreground md:hidden">Harga satuan</span>
        <span className="tabular-nums">{product ? formatRupiah(product.price) : "–"}</span>
      </div>

      <div className="flex items-center justify-between text-sm md:h-9 md:justify-end">
        <span className="text-xs text-muted-foreground md:hidden">Subtotal</span>
        <span className="font-medium tabular-nums">
          {product && validQty ? formatRupiah(product.price * quantity) : "–"}
        </span>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 justify-self-end text-muted-foreground"
        aria-label={`Hapus baris ${index + 1}`}
        disabled={!canRemove}
        onClick={onRemove}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

export function CreateOrderForm() {
  const router = useRouter();
  const customersQuery = useCustomers({ page: 1, per_page: LIST_LIMIT });
  const productsQuery = useProducts({ page: 1, per_page: LIST_LIMIT });
  const createOrder = useCreateOrder();

  const customers = useMemo(() => customersQuery.data?.data ?? [], [customersQuery.data]);
  const products = useMemo(() => productsQuery.data?.data ?? [], [productsQuery.data]);
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const hasMoreProducts = (productsQuery.data?.meta?.total ?? 0) > LIST_LIMIT;

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrderFormValues>({
    resolver: zodResolver(createOrderFormSchema),
    defaultValues: { customer_id: "", items: [{ product_id: "", quantity: 1 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = useWatch({ control, name: "items" });
  const selectedIds = watchedItems.map((i) => i.product_id);

  const summary = useMemo(() => {
    let subtotal = 0;
    for (const item of watchedItems) {
      const product = productById.get(item.product_id);
      if (product && Number.isInteger(item.quantity) && item.quantity > 0) {
        subtotal += product.price * item.quantity;
      }
    }
    const discount = getDiscount(subtotal);
    return { subtotal, ...discount, grandTotal: subtotal - discount.amount };
  }, [watchedItems, productById]);

  const isLoadingData = customersQuery.isPending || productsQuery.isPending;
  const loadError = customersQuery.isError || productsQuery.isError;

  async function onSubmit(values: CreateOrderFormValues) {
    try {
      const { data: order } = await createOrder.mutateAsync(values);
      router.push(`/orders/${order.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        const mapped = applyServerErrors(err.errors, setError);
        setError("root", {
          message: mapped ? `${err.message}. Periksa item yang ditandai.` : err.message,
        });
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

      {loadError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
        >
          <span className="text-muted-foreground">Data pelanggan atau produk gagal dimuat.</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              customersQuery.refetch();
              productsQuery.refetch();
            }}
          >
            Coba lagi
          </Button>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <section className="space-y-2 rounded-lg border p-4">
            <Label htmlFor="customer_id">Pelanggan</Label>
            <Controller
              control={control}
              name="customer_id"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={customersQuery.isPending}
                >
                  <SelectTrigger
                    id="customer_id"
                    className="w-full sm:max-w-sm"
                    aria-invalid={!!errors.customer_id}
                    aria-describedby={errors.customer_id ? "customer_id-error" : undefined}
                  >
                    <SelectValue
                      placeholder={customersQuery.isPending ? "Memuat pelanggan…" : "Pilih pelanggan"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        {c.email ? ` · ${c.email}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.customer_id && (
              <p id="customer_id-error" className="text-sm text-destructive">
                {errors.customer_id.message}
              </p>
            )}
          </section>

          <section className="rounded-lg border">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-medium">Produk</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ product_id: "", quantity: 1 })}
              >
                <Plus />
                Tambah produk
              </Button>
            </div>

            <div
              className={cn(
                "hidden border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground md:grid",
                ROW_GRID
              )}
            >
              <span>Produk</span>
              <span>Jumlah</span>
              <span className="text-right">Harga</span>
              <span className="text-right">Subtotal</span>
              <span />
            </div>

            {fields.map((field, index) => {
              const current = watchedItems[index];
              return (
                <OrderItemRow
                  key={field.id}
                  index={index}
                  control={control}
                  register={register}
                  errors={errors.items?.[index]}
                  products={products}
                  isLoadingProducts={productsQuery.isPending}
                  takenIds={new Set(selectedIds.filter((id, j) => id && j !== index))}
                  product={productById.get(current?.product_id ?? "")}
                  quantity={current?.quantity ?? 0}
                  canRemove={fields.length > 1}
                  onRemove={() => remove(index)}
                />
              );
            })}

            {hasMoreProducts && (
              <p className="border-t px-4 py-2 text-xs text-muted-foreground">
                Menampilkan {LIST_LIMIT} produk pertama.
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-4 rounded-lg border p-4 lg:sticky lg:top-6">
          <h2 className="text-sm font-medium">Ringkasan</h2>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{formatRupiah(summary.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">
                Diskon{summary.percent > 0 ? ` ${summary.percent}%` : ""}
                {summary.capped && <span className="text-xs"> (maks.)</span>}
              </dt>
              <dd className="tabular-nums">
                {summary.amount > 0 ? `− ${formatRupiah(summary.amount)}` : formatRupiah(0)}
              </dd>
            </div>
          </dl>

          <div className="flex items-baseline justify-between gap-4 border-t pt-4">
            <span className="text-sm font-medium">Total</span>
            <span className="text-xl font-semibold tabular-nums">
              {formatRupiah(summary.grandTotal)}
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            Perkiraan. Harga dan diskon final dihitung server saat order dibuat.
          </p>

          <Button type="submit" className="w-full" disabled={isSubmitting || isLoadingData}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {isSubmitting ? "Membuat order…" : "Buat order"}
          </Button>
        </aside>
      </div>
    </form>
  );
}
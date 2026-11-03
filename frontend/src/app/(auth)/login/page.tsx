import type { Metadata } from "next";
import { Scale, ShieldCheck, ShoppingBag, Undo2 } from "lucide-react";
import { LoginForm } from "@/src/features/auth/components/login-form";

export const metadata: Metadata = { title: "Masuk" };

const HIGHLIGHTS = [
  { icon: Scale, text: "Harga, diskon, dan total dihitung di server" },
  { icon: ShieldCheck, text: "Stok aman walau banyak order masuk bersamaan" },
  { icon: Undo2, text: "Pembatalan order mengembalikan stok otomatis" },
];

function Brand({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 font-semibold ${className ?? ""}`}>
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <ShoppingBag className="size-4" />
      </div>
      Order Service
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex justify-center items-center min-h-svh">
      {/* <section className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2 font-semibold">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary-foreground/10">
            <ShoppingBag className="size-4" />
          </div>
          Order Service
        </div>

        <div className="space-y-6">
          <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight">
            Kelola produk, order, dan stok toko online dalam satu tempat.
          </h2>
          <ul className="space-y-3 text-sm text-primary-foreground/80">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <Icon className="size-4 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-primary-foreground/60">
          Technical Test Fullstack Developer · Azatech
        </p>
      </section> */}

      <div className="w-full max-w-sm space-y-6">
        <Brand className="lg:hidden" />
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Masuk</h1>
          <p className="text-sm text-muted-foreground">
            Masukkan email dan password akun admin.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
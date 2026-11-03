"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { ApiError } from "@/src/lib/api-client";
import { login } from "../api";
import { loginSchema, type LoginInput } from "../schema";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    try {
      await login(values);
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiError) {
        let mapped = false;
        for (const [field, messages] of Object.entries(err.errors ?? {})) {
          if (field === "email" || field === "password") {
            setError(field, { message: messages[0] });
            mapped = true;
          }
        }
        // 401 "Email atau password salah" tampil sebagai pesan form
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

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="admin@example.com"
          className="h-10"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="pr-10 h-10"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        </div>
        {errors.password && (
          <p id="password-error" className="text-sm text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full h-10 cursor-pointer" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? "Memproses..." : "Masuk"}
      </Button>
    </form>
  );
}
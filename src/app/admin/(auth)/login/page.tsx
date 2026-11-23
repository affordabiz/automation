import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAccess } from "@/lib/admin/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const access = await getAccess();
  if (access.state === "ready") redirect("/admin");

  return (
    <>
      {!isSupabaseConfigured() ? (
        <p role="status" className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Login isn&apos;t configured yet. Add the Supabase keys to the environment.
        </p>
      ) : null}
      <LoginForm initialError={error === "access" ? "This account doesn't have admin access." : undefined} />
    </>
  );
}

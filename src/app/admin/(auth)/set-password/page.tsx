import type { Metadata } from "next";
import Link from "next/link";
import { SetPasswordForm } from "./SetPasswordForm";

export const metadata: Metadata = { title: "Set password" };

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string }>;
}) {
  const { token_hash: tokenHash, type } = await searchParams;
  if (!tokenHash || (type !== "invite" && type !== "recovery")) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-bold">Link not valid</h1>
        <p className="text-sm text-slate-600">This link is incomplete. Ask an admin to send a new one.</p>
        <Link href="/admin/login" className="text-sm font-medium text-teal-800 hover:underline">Back to sign in</Link>
      </div>
    );
  }
  return <SetPasswordForm tokenHash={tokenHash} type={type} />;
}

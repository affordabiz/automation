import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicForm } from "@/components/forms/PublicForm";
import { getCachedPublicForm } from "@/lib/forms/store";
import { isValidSlugFormat } from "@/lib/slug";

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = { title: "Form", robots: { index: false, follow: false } };

export async function generateStaticParams() {
  return [{ slug: "__placeholder__" }];
}

export default async function EmbeddedFormPage({ params }: Props) {
  const { slug } = await params;
  const form = isValidSlugFormat(slug) ? await getCachedPublicForm(slug) : null;
  if (!form) notFound();
  return (
    <main className="bg-white p-4">
      <PublicForm slug={form.slug} schema={form.schema} mode="embed" />
    </main>
  );
}

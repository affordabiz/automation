import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicForm } from "@/components/forms/PublicForm";
import { getCachedPublicForm } from "@/lib/forms/store";
import { isValidSlugFormat } from "@/lib/slug";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return [{ slug: "__placeholder__" }];
}

const load = (slug: string) => (isValidSlugFormat(slug) ? getCachedPublicForm(slug) : null);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const form = await load((await params).slug);
  if (!form) return { title: "Form not found", robots: { index: false } };
  return {
    title: form.schema.settings.title || form.name,
    description: form.schema.settings.description || undefined,
    robots: { index: false, follow: false },
  };
}

export default async function PublicFormPage({ params }: Props) {
  const form = await load((await params).slug);
  if (!form) notFound();
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:py-14">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <PublicForm slug={form.slug} schema={form.schema} />
      </div>
    </main>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Affordabiz Admin", template: "%s | Affordabiz Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-50 text-slate-900">{children}</div>;
}

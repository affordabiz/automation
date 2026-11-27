import Link from "next/link";

/** The TaxPrep.me footer from the old site: beige, with the coin photo faded behind it. */
export function SiteFooter() {
  return (
    <footer className="relative isolate overflow-hidden bg-[#F5EFE4] px-4 py-10 text-center text-sm leading-relaxed text-slate-600">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[url('/site/footer-coins.jpg')] bg-cover bg-center opacity-15"
      />
      <p className="mx-auto max-w-4xl">
        © <Link href="/" className="font-medium text-[#1E73BE] hover:underline">TaxPrep.me</Link>. All rights reserved.
        This website and all contractor pages hosted under the TaxPrep.me domain are governed by our Privacy Policy and
        Terms and Conditions. By using this site, you agree to these policies.
      </p>
      <nav aria-label="Legal" className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2 font-medium">
        <Link href="/privacy-policy-2" className="text-[#1E73BE] hover:underline">Privacy Policy</Link>
        <Link href="/term-condition" className="text-[#1E73BE] hover:underline">Terms and Conditions</Link>
      </nav>
    </footer>
  );
}

/**
 * Addresses carried over from the old WordPress site (Redirection plugin, exported 2026-11-27).
 * Only rules whose destination still exists are kept. Old pages that were not migrated simply 404.
 */
export const WORDPRESS_REDIRECTS: readonly (readonly [source: string, destination: string])[] = [
  ["/rds", "/driastaxsolutions"],
  ["/synergy-2", "/synergy"],
  ["/dawn-2", "/dawn"],
  ["/crystalta", "/crystaltax"],
  ["/mwhealy-2", "/mwhealy"],
  ["/mwhealy1", "/mwhealy"],
  ["/reginawalker-2", "/reginawalker"],
  ["/template-5-copy", "/crystaltax"],
  ["/client-in-take-form", "/intake"],
  ["/leesh-2", "/leesh"],
  ["/kansas", "/erin"],
  ["/lydia-2", "/lydia"],
  ["/adiamondsreflection1-2", "/adiamondsreflection"],
  ["/template-1-copy", "/wcfs"],
  ["/freequote-2", "/freequote"],
  ["/client-in-take-forms-copy", "/intake"],
  ["/clarkassociatestaxcenter", "/clarkassociatestaxcenter01"],
  ["/sapphire-3", "/sapphire"],
  ["/qualitytaxsolutions-2", "/qualitytaxsolutions"],
  ["/kesher-daniel", "/sapphire"],
  ["/tamara-duren", "/durentaxservices"],
  ["/durenstaxsvc-1", "/durentaxservices"],
  ["/durenstaxsvc", "/durentaxservices"],
  ["/paidreturn", "https://form.jotform.com/62646999636174"],
  ["/payment", "/intake"],
  ["/taxsolutions", "/taxsolutions2024"],
  ["/clevermadam-2", "/clevermadam"],
  ["/irs", "https://sa.www4.irs.gov/secureaccess/ui/?TYPE=33554433&REALMOID=06-0005eaac-e22a-10b8-928e-7c2b0ad00000&GUID=&SMAUTHREASON=0&METHOD=GET&SMAGENTNAME=-SM-u0ktItgVFneUJDzkQ7tjvLYXyclDooCJJ7%2bjXGjg3YC5id2x9riHE98hoVgd1BBv&TARGET=-SM-http%3a%2f%2fsa%2ewww4%2eirs%2egov%2fctc%2f"],
  ["/state", "https://www.jotform.com/build/202538409288058"],
  ["/ctc", "https://sa.www4.irs.gov/secureaccess/ui/?TYPE=33554433&REALMOID=06-0005eaac-e22a-10b8-928e-7c2b0ad00000&GUID=&SMAUTHREASON=0&METHOD=GET&SMAGENTNAME=-SM-u0ktItgVFneUJDzkQ7tjvLYXyclDooCJJ7%2bjXGjg3YC5id2x9riHE98hoVgd1BBv&TARGET=-SM-http%3a%2f%2fsa%2ewww4%2eirs%2egov%2fctc%2f"],
  ["/christie-sabino-chaos-tax-solutions", "/cts"],
  ["/product/tax-prep-fee", "https://form.jotform.com/193524054259056"],
  ["/suspend", "https://form.jotform.com/202538409288058"],
  ["/3628-2", "https://form.jotform.com/202538409288058"],
  ["/nyastaxservices", "http://www.nyastaxservices.com"],
  ["/sipesconsultingtaxes", "https://www.sipesconsultingtaxesllc.com/"],
];

/** Old WordPress media links for files now served from /public/files. */
export const WORDPRESS_FILE_REDIRECTS: readonly (readonly [source: string, destination: string])[] = [
  ["/wp-content/uploads/2025/12/Tax-Preparation-Client-Checklist.pdf", "/files/Tax-Preparation-Client-Checklist.pdf"],
  ["/wp-content/uploads/2021/02/Rebate-Recovery-Cheat-Sheat-2.pdf", "/files/Rebate-Recovery-Cheat-Sheat-2.pdf"],
  ["/wp-content/uploads/2021/02/Contractor-Paid-Leave-Cheat-Sheat.pdf", "/files/Contractor-Paid-Leave-Cheat-Sheat.pdf"],
  ["/wp-content/uploads/2021/02/Look-Back-EITC-ACTC-Cheat-Sheat.pdf", "/files/Look-Back-EITC-ACTC-Cheat-Sheat.pdf"],
  ["/wp-content/uploads/2021/02/FACT-SHEET-EICT-ACTC-.pdf", "/files/FACT-SHEET-EICT-ACTC-.pdf"],
  ["/wp-content/uploads/2021/02/Freeze-Alerts-Wlll-Hold-Up-Refunds-1.pdf", "/files/Freeze-Alerts-Wlll-Hold-Up-Refunds-1.pdf"],
  ["/wp-content/uploads/2021/02/FACT-SHEET-Small-Business-Administration.pdf", "/files/FACT-SHEET-Small-Business-Administration.pdf"],
];

/** First path segment of every redirect source, so no client can claim one as their web address. */
export const REDIRECT_SLUGS: readonly string[] = WORDPRESS_REDIRECTS.map(([source]) => source.slice(1).split("/")[0]);

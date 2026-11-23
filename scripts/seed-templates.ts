import { createClient } from "next-sanity";
import { TEMPLATE_CATALOG } from "../src/templates/catalog";
import { getDefaultCopy } from "../src/templates/defaults";
import { withKeys } from "../src/lib/sanity/withKeys";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-10-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

async function main() {
  const tx = client.transaction();
  for (const t of TEMPLATE_CATALOG) {
    const copy = getDefaultCopy(t.number);
    tx.createOrReplace({
      _id: `template-${t.number}`,
      _type: "template",
      number: t.number,
      name: t.name,
      ...(copy ? { copy: withKeys(copy) } : {}),
    });
  }
  const res = await tx.commit();
  console.log(`Seeded ${res.results.length} template documents into "${client.config().dataset}".`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

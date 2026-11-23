/**
 * Creates the first Owner and prints a one-time link to set their password.
 * Refuses to run once any team member exists. Run it in your own terminal so the link stays private:
 *   pnpm admin:bootstrap you@example.com "Your Name"
 */
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const email = z.email().safeParse(process.argv[2]?.trim().toLowerCase());
const fullName = process.argv[3]?.trim() || "Owner";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email.success) throw new Error('Usage: pnpm admin:bootstrap you@example.com "Your Name"');
if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.");

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { count, error: countError } = await supabase.from("team_members").select("user_id", { count: "exact", head: true });
if (countError) throw new Error(`Could not read team_members. Has the migration been run? ${countError.message}`);
if (count) throw new Error("A team already exists. Invite new members from the dashboard.");

const { data: role, error: roleError } = await supabase.from("roles").select("id").eq("is_owner", true).single();
if (roleError) throw new Error(`Owner role not found: ${roleError.message}`);

let link = await supabase.auth.admin.generateLink({ type: "invite", email: email.data });
let kind: "invite" | "recovery" = "invite";
if (link.error?.code === "email_exists") {
  link = await supabase.auth.admin.generateLink({ type: "recovery", email: email.data });
  kind = "recovery";
}
if (link.error || !link.data.user) throw new Error(`Could not create login: ${link.error?.message}`);

const { error: insertError } = await supabase.from("team_members").insert({
  user_id: link.data.user.id,
  email: email.data,
  full_name: fullName,
  role_id: role.id,
});
if (insertError) throw new Error(`Could not add Owner: ${insertError.message}`);

await supabase.from("audit_log").insert({
  action: "team.owner_bootstrapped",
  target_type: "member",
  target_id: link.data.user.id,
  details: { email: email.data },
});

const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
const params = new URLSearchParams({ token_hash: link.data.properties.hashed_token, type: kind });
console.log(`\nOwner created: ${email.data}`);
console.log("Open this one-time link to set your password. Do not share it:\n");
console.log(`${base}/admin/set-password?${params}\n`);

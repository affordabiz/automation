import "server-only";
import { serviceClient } from "@/lib/supabase/service";
import type { LogicRule } from "@/lib/forms/types";
import type { AutomationStatus, AutomationStep, JobStatus } from "./types";

export interface AutomationRecord {
  id: string;
  form_id: string;
  name: string;
  status: AutomationStatus;
  match: "all" | "any";
  conditions: LogicRule[];
  steps: AutomationStep[];
  updated_at: string;
  forms: { name: string; slug: string; status: string };
}

export interface AutomationListItem extends AutomationRecord {
  sent: number;
  scheduled: number;
  failed: number;
}

export interface JobActivity {
  id: string;
  step_id: string;
  to_email: string;
  subject: string;
  status: JobStatus;
  error: string | null;
  scheduled_for: string;
  sent_at: string | null;
  created_at: string;
}

const COLUMNS = "id,form_id,name,status,match,conditions,steps,updated_at,forms!inner(name,slug,status)";

export async function listAutomations(): Promise<AutomationListItem[]> {
  const service = serviceClient();
  const [automations, jobs] = await Promise.all([
    service.from("automations").select(COLUMNS).order("updated_at", { ascending: false }).limit(200).returns<AutomationRecord[]>(),
    service
      .from("automation_jobs")
      .select("automation_id,status")
      .order("created_at", { ascending: false })
      .limit(5000)
      .returns<{ automation_id: string; status: JobStatus }[]>(),
  ]);
  if (automations.error) throw new Error(`Could not load automations: ${automations.error.message}`);
  if (jobs.error) throw new Error(`Could not load email activity: ${jobs.error.message}`);

  const totals = new Map<string, { sent: number; scheduled: number; failed: number }>();
  for (const job of jobs.data) {
    const row = totals.get(job.automation_id) ?? { sent: 0, scheduled: 0, failed: 0 };
    if (job.status === "sent") row.sent++;
    if (job.status === "pending" || job.status === "processing") row.scheduled++;
    if (job.status === "failed") row.failed++;
    totals.set(job.automation_id, row);
  }
  return automations.data.map((a) => ({ ...a, ...(totals.get(a.id) ?? { sent: 0, scheduled: 0, failed: 0 }) }));
}

export async function getAutomation(id: string): Promise<AutomationRecord | null> {
  const { data, error } = await serviceClient().from("automations").select(COLUMNS).eq("id", id).maybeSingle<AutomationRecord>();
  if (error) throw new Error(`Could not load automation: ${error.message}`);
  return data;
}

export async function listJobActivity(automationId: string, limit = 50): Promise<JobActivity[]> {
  const { data, error } = await serviceClient()
    .from("automation_jobs")
    .select("id,step_id,to_email,subject,status,error,scheduled_for,sent_at,created_at")
    .eq("automation_id", automationId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<JobActivity[]>();
  if (error) throw new Error(`Could not load email activity: ${error.message}`);
  return data;
}

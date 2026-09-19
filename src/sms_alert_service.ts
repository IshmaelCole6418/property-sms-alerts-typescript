import { z } from "zod";
import { infrai } from "./infrai_sms.js";

const phone = z.string().min(8).max(20);

export const propertyAlertSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("maintenance_request"),
    requestId: z.string().min(1),
    tenantPhone: phone,
    unit: z.string().min(1),
    issue: z.string().min(1),
    emergency: z.boolean(),
  }),
  z.object({
    kind: z.literal("tenant_document"),
    documentId: z.string().min(1),
    tenantPhone: phone,
    unit: z.string().min(1),
    documentName: z.string().min(1),
  }),
  z.object({
    kind: z.literal("inspection_reminder"),
    inspectionId: z.string().min(1),
    tenantPhone: phone,
    unit: z.string().min(1),
    scheduledFor: z.string().datetime(),
  }),
]);

export type PropertyAlert = z.infer<typeof propertyAlertSchema>;

export function decideSms(alert: PropertyAlert): { shouldSend: boolean; text?: string; reference: string } {
  switch (alert.kind) {
    case "maintenance_request":
      return alert.emergency
        ? { shouldSend: true, reference: alert.requestId, text: `Urgent maintenance at ${alert.unit}: ${alert.issue}. We are on it.` }
        : { shouldSend: false, reference: alert.requestId };
    case "tenant_document":
      return { shouldSend: true, reference: alert.documentId, text: `${alert.documentName} for ${alert.unit} is ready in your tenant portal.` };
    case "inspection_reminder":
      return { shouldSend: true, reference: alert.inspectionId, text: `Inspection reminder for ${alert.unit}: ${alert.scheduledFor}.` };
  }
  const unreachable: never = alert;
  return unreachable;
}

export async function sendPropertyAlert(input: unknown): Promise<{ status: "sent" | "recorded"; messageId?: string }> {
  const alert = propertyAlertSchema.parse(input);
  const decision = decideSms(alert);
  if (!decision.shouldSend || !decision.text) return { status: "recorded" };

  const result = await infrai.sms.batch.send(
    {
      messages: [{ to: alert.tenantPhone, body: decision.text }],
      idempotency_key: `property-alert-${decision.reference}`,
    },
    `property-alert-${decision.reference}`,
  );
  return { status: "sent", messageId: result.message_id };
}

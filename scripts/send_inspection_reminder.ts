import { sendPropertyAlert } from "../src/sms_alert_service.js";

const tenantPhone = process.env.DEMO_TENANT_PHONE;
if (!tenantPhone) throw new Error("DEMO_TENANT_PHONE is required");

const result = await sendPropertyAlert({
  kind: "inspection_reminder",
  inspectionId: `demo-inspection-${new Date().toISOString().slice(0, 10)}`,
  tenantPhone,
  unit: "12B",
  scheduledFor: "2026-10-04T09:30:00.000Z",
});
console.log(result);

import assert from "node:assert/strict";
import test from "node:test";
import { decideSms } from "../src/sms_alert_service.js";

test("emergency maintenance sends a tenant-facing alert while routine work stays recorded", () => {
  const urgent = decideSms({
    kind: "maintenance_request",
    requestId: "MR-42",
    tenantPhone: "+15551234567",
    unit: "12B",
    issue: "water leak",
    emergency: true,
  });
  const routine = decideSms({
    kind: "maintenance_request",
    requestId: "MR-43",
    tenantPhone: "+15551234567",
    unit: "12B",
    issue: "loose cabinet handle",
    emergency: false,
  });

  assert.deepEqual(urgent, {
    shouldSend: true,
    reference: "MR-42",
    text: "Urgent maintenance at 12B: water leak. We are on it.",
  });
  assert.deepEqual(routine, { shouldSend: false, reference: "MR-43" });
});

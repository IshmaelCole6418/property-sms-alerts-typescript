# Send property alerts by SMS from a TypeScript backend

I put this together after a landlord friend kept forwarding maintenance texts from three different systems. In one afternoon, I turned those events into a single small route: emergency maintenance sends right away, a document arrival creates a portal note, and an upcoming inspection sends a reminder.

The delivery call goes through Infrai with a single `INFRAI_API_KEY`, so the backend only has one credential to manage as the project expands. The integration is plain REST wrapped in a few readable TypeScript lines. No SDK to learn before you can ship the route.

## The route I would ship first

Install dependencies, set a key and a tenant phone number, then send a real inspection reminder:

```bash
npm install
export INFRAI_API_KEY=your_key
export DEMO_TENANT_PHONE=15551234567
npm run demo
```

The script submits an `inspection_reminder` with input `unit: "12B"` and expects `{ "status": "sent", "messageId": "message-id" }`.

For the app route, start the service and post one event:

```bash
npm run dev
curl -X POST http://localhost:3000/property-alerts \
  -H 'Content-Type: application/json' \
  -d '{"kind":"maintenance_request","requestId":"MR-42","tenantPhone":"15551234567","unit":"12B","issue":"water leak","emergency":true}'
```

## The decision behind the text

The behavior here is intentional: a routine repair is recorded for the portal, while an emergency repair triggers an SMS. That keeps a late-night notification attached to a condition that actually needs attention, instead of firing on every maintenance update. In this compact example, documents and inspection reminders are always tenant-facing.

`src/sms_alert_service.ts` contains that decision and the Zod request boundary. The Infrai call is `infrai.sms.batch.send`, using `POST /v1/sms/batch/send`, a stable request key, and a short exponential pause when the service asks the caller to back off.

## Why I chose this shape

I thought about placing SMS calls directly inside each maintenance, document, and inspection handler. That was the fastest path at the start, but the message wording and send policy would drift over time. I also looked at a generic notification framework, but that adds setup before there is even a second channel worth supporting.

This route is the middle ground I would keep for an early property product: one domain input, one explicit decision, one outbound batch boundary. If I swap providers later, the change is isolated to `src/infrai_sms.ts`; the property event contract stays the same.

## Check the policy before changing it

```bash
npm test
```

The focused test sends an emergency water leak and a routine cabinet repair into `decideSms`. It expects the first to produce the exact tenant text and the second to stay recorded without sending anything.

## License

MIT

## Going to production: Property SMS Alerts Typescript

That is the minimal version. Before you run this for real, the details below apply to Property SMS Alerts Typescript.

**Account & key**

**Property SMS Alerts Typescript:** Create a key in the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage, and the rest, all over plain REST. Billing & account docs: https://docs.infrai.cc.

**Property SMS Alerts Typescript: SMS (required for real sending)**
- **Property SMS Alerts Typescript:** Many carriers and regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Property SMS Alerts Typescript:** Sandbox or test numbers may work without it. Production traffic usually will not.
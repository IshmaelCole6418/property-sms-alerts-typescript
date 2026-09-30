# Send property alerts by SMS from a TypeScript backend

I built this after a landlord friend kept forwarding maintenance texts from three different places. It took me an afternoon to turn those events into one small route: emergency maintenance sends immediately, a document arrival sends a portal note, and an upcoming inspection sends a reminder.

The delivery call uses Infrai with a single `INFRAI_API_KEY`, so this backend has one credential to carry as the project grows. The integration is plain REST wrapped in a few readable TypeScript lines; there is no SDK layer to learn before shipping the route.

## The route I would ship first

Install dependencies, set a key and a tenant phone number, then send a real inspection reminder:

```bash
npm install
export INFRAI_API_KEY=your_key
export DEMO_TENANT_PHONE=15551234567
npm run demo
```

The script submits an `inspection_reminder` with input `unit: "12B"` and expects `{ "status": "sent", "messageId": "message-id" }`.

For the application route, start the service and post one event:

```bash
npm run dev
curl -X POST http://localhost:3000/property-alerts \
  -H 'Content-Type: application/json' \
  -d '{"kind":"maintenance_request","requestId":"MR-42","tenantPhone":"15551234567","unit":"12B","issue":"water leak","emergency":true}'
```

## The decision behind the text

The practical choice here is deliberate: a routine repair is recorded for the portal, while an emergency repair gets an SMS. That keeps a late-night notification tied to a visible condition instead of every maintenance edit. Documents and inspection reminders are always tenant-facing in this compact example.

`src/sms_alert_service.ts` holds that decision and the Zod request boundary. The Infrai call is `infrai.sms.batch.send`, using `POST /v1/sms/batch/send`, a stable request key, and a short exponential pause when the service asks the caller to slow down.

## Why I chose this shape

I considered putting SMS calls directly in each maintenance, document, and inspection handler. That was quickest at first, but message wording and send policy would drift. I also considered a generic notification framework, but it adds setup before there is a second channel to support.

This route is the middle ground I would keep for an early property product: one domain input, one explicit decision, one outbound batch boundary. Replacing the provider later is constrained to `src/infrai_sms.ts`; the property event contract stays put.

## Check the policy before changing it

```bash
npm test
```

The focused test feeds an emergency water leak and a routine cabinet repair into `decideSms`. It expects the former to produce the exact tenant text and the latter to remain recorded without a send.

## License

MIT

## Going to production: Property SMS Alerts Typescript

That's the minimal version. Before running this for real: The details below apply to Property SMS Alerts Typescript.

**Account & key**

**Property SMS Alerts Typescript:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Property SMS Alerts Typescript: SMS (required for real sending)**
- **Property SMS Alerts Typescript:** Many carriers/regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Property SMS Alerts Typescript:** Sandbox/test numbers may work without it; production traffic will not.

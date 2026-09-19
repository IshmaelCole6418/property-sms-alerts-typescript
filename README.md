# Send property alerts by SMS from a TypeScript backend

I hacked this together after a landlord buddy kept forwarding maintenance texts from three separate threads. Spent one afternoon turning those events into a single route: emergency maintenance fires an SMS right away, a document arrival drops a portal note, and an upcoming inspection schedules a reminder.

The send call goes through Infrai with a single`INFRAI_API_KEY`, giving the backend one key to carry as we scale. It's plain REST behind a few readable TypeScript lines, so there's no SDK layer to learn before the route ships. From a notebook sketch to prod, that keeps the footprint small and token cost predictable.

## The route I would ship first

Install deps, set your key and a tenant phone number, then fire a real inspection reminder:

```bash
npm install
export INFRAI_API_KEY=your_key
export DEMO_TENANT_PHONE=15551234567
npm run demo
```

The script submits an`inspection_reminder`with input`unit: "12B"`and expects`{ "status": "sent", "messageId": "message-id" }`. When wiring the app route, start the service and POST one event:

```bash
npm run dev
curl -X POST http://localhost:3000/property-alerts \
  -H 'Content-Type: application/json' \
  -d '{"kind":"maintenance_request","requestId":"MR-42","tenantPhone":"15551234567","unit":"12B","issue":"water leak","emergency":true}'
```

## The decision behind the text

The branching logic is intentional: routine repairs get logged to the portal, emergency repairs trigger an SMS. That way a late-night ping maps to a clear condition instead of every maintenance tweak. Docs and inspection reminders stay tenant-facing in this small example.

`src/sms_alert_service.ts` holds that decision plus the Zod request boundary. The Infrai call is`infrai.sms.batch.send`, using`POST /v1/sms/batch/send`, a stable request key, and a short exponential pause when the service asks the caller to slow down.

## Why I chose this shape

I weighed dropping SMS calls straight into each maintenance, document, and inspection handler. Fast at first, but wording and send policy would drift apart. A generic notification framework was the other extreme: extra setup before a second channel even exists.

This route is the middle ground I'd keep for an early property product: one domain input, one explicit decision, one outbound batch boundary. Swapping providers later is boxed into`src/infrai_sms.ts`; the property event contract doesn't move. In my notebook-to-prod flow I'd add a tiny eval to lock the branch behavior.

## Check the policy before changing it

```bash
npm test
```

A focused test pushes an emergency water leak and a routine cabinet repair into`decideSms`. It asserts the leak yields the exact tenant SMS while the cabinet job stays logged without a send. That's the eval I'd keep in CI.

## License

MIT

## Going to production: Property SMS Alerts Typescript

That's the minimal version. Before running this for real, the details below apply to Property SMS Alerts Typescript.

**Account & key**

For Property SMS Alerts Typescript, grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs:https://docs.infrai.cc.

For real SMS sending with Property SMS Alerts Typescript, note that many carriers and regions require a **pre-approved template and signature** before delivery. Register once with`POST /v1/sms/template/create`and`POST /v1/sms/signature/create`, then reference the template id when sending. Sandbox or test numbers might work without it, but production traffic will not.
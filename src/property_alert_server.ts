import { createServer } from "node:http";
import { ZodError } from "zod";
import { InfraiSmsError } from "./infrai_sms.js";
import { sendPropertyAlert } from "./sms_alert_service.js";

const port = Number(process.env.PORT ?? 3000);

const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/property-alerts") {
    response.writeHead(404).end();
    return;
  }
  let raw = "";
  for await (const chunk of request) raw += chunk;
  try {
    const result = await sendPropertyAlert(JSON.parse(raw));
    response.writeHead(202, { "Content-Type": "application/json" }).end(JSON.stringify(result));
  } catch (error) {
    const status = error instanceof ZodError ? 400 : error instanceof InfraiSmsError ? error.status : 500;
    response.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify({ error: error instanceof Error ? error.message : "Request failed" }));
  }
});

server.listen(port, () => console.log(`Property alert service listening on ${port}`));

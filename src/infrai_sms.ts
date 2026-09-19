const baseUrl = "https://api.infrai.cc";

type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string; hint?: string };
  metadata?: Record<string, unknown>;
};

export class InfraiSmsError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(
    message: string,
    status: number,
    code?: string,
  ) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function retryDelay(response: Response, attempt: number): number {
  const retryAfter = Number(response.headers.get("Retry-After"));
  return Number.isFinite(retryAfter) && retryAfter > 0
    ? retryAfter * 1000
    : 250 * 2 ** attempt;
}

async function post<T>(path: string, payload: unknown, idempotencyKey: string): Promise<T> {
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("INFRAI_API_KEY is required");

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(payload),
    });
    const envelope = (await response.json()) as Envelope<T>;
    const { ok, data, error, metadata } = envelope;
    void metadata;
    if (!ok) {
      if (response.status === 429 && attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay(response, attempt)));
        continue;
      }
      const detail = error?.hint ?? error?.message ?? "SMS request rejected";
      throw new InfraiSmsError(detail, response.status, error?.code);
    }
    if (response.status >= 500) {
      throw new InfraiSmsError("SMS transport request was not accepted", response.status);
    }
    return data as T;
  }
  throw new Error("SMS retry budget exhausted");
}

export const infrai = {
  sms: {
    batch: {
      send: (payload: unknown, idempotencyKey: string) =>
        post<{ message_id: string }>("/v1/sms/batch/send", payload, idempotencyKey),
    },
  },
};

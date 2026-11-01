import { createHmac, timingSafeEqual } from "node:crypto";
import type { APIRoute } from "astro";
import { invalidateByTag } from "@vercel/functions";
import { clearCache } from "@lib/notion/cache";
import { ALL_NOTION, CACHE_TAGS, databaseFromId } from "@lib/notion/databases";

/*
 * Notion → instant updates. Notion sends a webhook when a page changes; this
 * purges the CDN copies tagged with that page's collection (see
 * lib/cache-headers.ts), so the next visit renders fresh content.
 *
 * Two ways in:
 *  - Vercel Connect (recommended): Connect receives Notion's webhook and
 *    forwards it here with a Vercel OIDC token. No secret to manage.
 *  - Direct: point the Notion integration's webhook here and set
 *    NOTION_WEBHOOK_SECRET to the verification token Notion sends once.
 */

type NotionEvent = {
  type?: string;
  entity?: { id: string; type: string };
  data?: { parent?: { id: string; type: string } };
  verification_token?: string;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

async function verifyConnect(request: Request, body: string) {
  const { createConnectWebhookVerifier } = await import("@vercel/connect/chat");
  // Accepts tokens for this project and this deployment's environment only
  const verify = createConnectWebhookVerifier();
  if (!(await verify(request, body))) throw new Error("OIDC token rejected");
}

function verifyNotionSignature(request: Request, body: string) {
  const secret = process.env.NOTION_WEBHOOK_SECRET;
  const signature = request.headers.get("x-notion-signature");
  if (!secret || !signature) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Cache tags affected by an event; unknown parents purge everything */
function tagsFor(event: NotionEvent): string[] {
  const parent = databaseFromId(event.data?.parent?.id) ?? databaseFromId(event.entity?.id);
  if (!parent) return [ALL_NOTION];
  const tag = CACHE_TAGS[parent];
  return tag === ALL_NOTION ? [ALL_NOTION] : [tag];
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();

  let event: NotionEvent;
  try {
    event = JSON.parse(body);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  // Direct setup, first call: Notion sends the token to paste in NOTION_WEBHOOK_SECRET
  if (event.verification_token && !request.headers.has("authorization")) {
    console.log("[notion-webhook] verification token received, set NOTION_WEBHOOK_SECRET to it");
    return json({ ok: true });
  }

  let trusted = verifyNotionSignature(request, body);
  if (!trusted && request.headers.has("authorization")) {
    try {
      await verifyConnect(request, body);
      trusted = true;
    } catch (error) {
      console.warn("[notion-webhook] Connect verification failed", error);
    }
  }
  if (!trusted) return json({ error: "Unauthorized" }, 401);

  const tags = tagsFor(event);
  // This instance may re-render the purged pages: make sure it re-reads Notion
  clearCache();
  await invalidateByTag(tags);
  console.log(`[notion-webhook] ${event.type ?? "event"} → invalidated ${tags.join(", ")}`);
  return json({ ok: true, invalidated: tags });
};

export const dynamic = "force-dynamic";

// Visitor counter backed by Cloudflare Workers KV. The binding is
// optional: without it (local dev, or KV not configured) the counter
// honestly reports null and the footer prints "№ unknown".
export async function POST() {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    const kv = (env as { VISITORS?: KVNamespace }).VISITORS;
    if (!kv) return Response.json({ count: null });
    const raw = await kv.get("count");
    const next = (parseInt(raw ?? "0", 10) || 0) + 1;
    await kv.put("count", String(next));
    return Response.json({ count: next });
  } catch {
    return Response.json({ count: null });
  }
}

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

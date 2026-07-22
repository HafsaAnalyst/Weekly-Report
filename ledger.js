/**
 * Shared storage for the ledger. Only used when VITE_STORAGE_MODE=api.
 *
 * Setup:
 *   1. Vercel dashboard → Storage → Create Database → KV
 *   2. Connect it to this project (Vercel injects KV_* env vars for you)
 *   3. Add env var  VITE_STORAGE_MODE = api   and redeploy
 *
 * Note: this endpoint is unauthenticated. Anyone with the URL can read and
 * write your numbers. Put Vercel Authentication (Settings → Deployment
 * Protection) in front of the project before you put real data in it.
 */
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const key = req.query.key;
      if (!key) return res.status(400).json({ error: "key required" });
      const value = await kv.get(key);
      return res.status(200).json({ key, value: value ?? null });
    }

    if (req.method === "POST") {
      const { key, value } = req.body || {};
      if (!key || typeof value !== "string")
        return res.status(400).json({ error: "key and string value required" });
      if (value.length > 4_500_000)
        return res.status(413).json({ error: "payload too large" });
      await kv.set(key, value);
      return res.status(200).json({ key, ok: true });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: String(err?.message || err) });
  }
}

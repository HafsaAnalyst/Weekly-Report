/**
 * Storage adapter — the only file you touch to change where data lives.
 *
 * MODE "local"  (default) : saved in this browser only. Nothing leaves the device,
 *                           nothing is shared, clearing site data wipes it.
 * MODE "api"              : saved server-side via /api/ledger, so everyone who
 *                           opens the URL sees the same numbers. Requires the
 *                           Vercel KV steps in README.md.
 *
 * Switch by setting VITE_STORAGE_MODE=api in your Vercel environment variables.
 */
const MODE = import.meta.env.VITE_STORAGE_MODE === "api" ? "api" : "local";

let healthy = true;
export const isPersistent = () => healthy;
export const storageMode = MODE;

/* ---------------- local (browser) ---------------- */
const local = {
  async get(key) {
    try {
      const v = window.localStorage.getItem(key);
      healthy = true;
      return v == null ? null : { key, value: v };
    } catch {
      healthy = false;
      return null;
    }
  },
  async set(key, value) {
    try {
      window.localStorage.setItem(key, value);
      healthy = true;
      return { key, value };
    } catch {
      // Private browsing, or the 5MB quota is full.
      healthy = false;
      return null;
    }
  },
};

/* ---------------- api (shared) ---------------- */
const api = {
  async get(key) {
    try {
      const r = await fetch(`/api/ledger?key=${encodeURIComponent(key)}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      healthy = true;
      return j?.value == null ? null : { key, value: j.value };
    } catch {
      healthy = false;
      return local.get(key); // fall back so the app still works offline
    }
  },
  async set(key, value) {
    try {
      const r = await fetch("/api/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      healthy = true;
      local.set(key, value); // keep a local copy as a safety net
      return { key, value };
    } catch {
      healthy = false;
      return local.set(key, value);
    }
  },
};

export const store = MODE === "api" ? api : local;

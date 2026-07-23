import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell, Legend,
} from "recharts";

/* ================================================================== *
 *  PALETTE
 * ================================================================== */
const C = {
  paper: "#F7F8F6", card: "#FFFFFF", ink: "#16181A",
  muted: "#6B7370", faint: "#9AA29E", rule: "#DCE0DB", wash: "#EDF0EB",
  navy: "#2D4A7A", pine: "#0B6E4F", ochre: "#B07D2B", plum: "#6D3F63",
  up: "#0B6E4F", down: "#A32D2D",
};

/* ================================================================== *
 *  MODEL
 * ================================================================== */
const OWNERS = [
  { id: "pm", name: "Performance Marketer", short: "Performance", color: C.navy },
  { id: "smm", name: "Social Media Manager", short: "Social", color: C.pine },
  { id: "seo", name: "Organic Search TL", short: "Search", color: "#5B6E8C" },
  { id: "none", name: "Unowned", short: "Unowned", color: C.ochre },
];

const CHANNELS = [
  { id: "meta", name: "Meta Ads", platform: "Paid", owner: "pm", group: "paid" },
  { id: "ig", name: "Instagram", platform: "Organic", owner: "smm", group: "social" },
  { id: "tiktok", name: "TikTok", platform: "Organic", owner: "smm", group: "social" },
  { id: "whatsapp", name: "WhatsApp", platform: "Organic", owner: "smm", group: "social" },
  { id: "email", name: "Email", platform: "Organic", owner: "smm", group: "social" },
  { id: "linkedin", name: "LinkedIn", platform: "Organic", owner: "smm", group: "social" },
  { id: "youtube", name: "YouTube", platform: "Organic", owner: "smm", group: "social" },
  { id: "search", name: "Organic Search", platform: "Organic", owner: "seo", group: "search" },
  { id: "referral", name: "Referrals", platform: "Organic", owner: "none", group: "indep" },
  { id: "direct", name: "Direct", platform: "Organic", owner: "none", group: "indep" },
  { id: "walkin", name: "Walk-in", platform: "Organic", owner: "none", group: "indep" },
  { id: "call", name: "Direct Call", platform: "Organic", owner: "none", group: "indep" },
  { id: "dm", name: "Direct Message", platform: "Organic", owner: "none", group: "indep" },
  { id: "sms", name: "SMS", platform: "Organic", owner: "none", group: "indep" },
  { id: "other", name: "Other", platform: "Organic", owner: "none", group: "indep" },
];

const COUNSELLORS = [
  { id: "gurbir", name: "Gurbir", team: "Visa" },
  { id: "nasir", name: "Nasir", team: "Visa" },
  { id: "turab", name: "Turab", team: "Career" },
  { id: "kajal", name: "Kajal", team: "Education" },
  { id: "navneet", name: "Navneet", team: "Education" },
  { id: "saurab", name: "Saurab", team: "Education" },
  { id: "wajahad", name: "Wajahad", team: "Education" },
];
const TEAM_COLOR = { Visa: C.navy, Career: C.ochre, Education: C.pine };

/* Every input field that can exist anywhere */
const FIELDS = {
  spend:       { label: "Amount Spend", short: "Spend", kind: "money" },
  impressions: { label: "Impressions", short: "Impr.", kind: "int" },
  linkClicks:  { label: "Link Clicks", short: "Link clicks", kind: "int" },
  clicks:      { label: "Clicks", short: "Clicks", kind: "int" },
  convos:      { label: "Messaging Conversations Started", short: "Convos", kind: "int" },
  queries:     { label: "Queries", short: "Queries", kind: "int" },
  cpm:         { label: "CPM", short: "CPM", kind: "money" },
  payment:     { label: "Payment", short: "Payment", kind: "money" },
  leads:       { label: "Leads", short: "Leads", kind: "int" },
  booked:      { label: "Booked", short: "Booked", kind: "int" },
  show:        { label: "Show", short: "Show", kind: "int" },
  paid:        { label: "Paid Bookings", short: "Paid bk.", kind: "int" },
  coes:        { label: "COEs", short: "COEs", kind: "int" },
};

/* Derived — never typed, always computed */
const DERIVED = {
  cpc:       { label: "CPC (link)", kind: "money", fn: (r) => div(r.spend, r.linkClicks) },
  cpl:       { label: "CPL", kind: "money", fn: (r) => div(r.spend, r.leads) },
  cpb:       { label: "Cost / Booked", kind: "money", fn: (r) => div(r.spend, r.booked) },
  ctr:       { label: "CTR", kind: "pct", fn: (r) => div(r.clicks, r.impressions) },
  bookRate:  { label: "Booking rate", kind: "pct", fn: (r) => div(r.booked, r.leads) },
  showRate:  { label: "Show rate", kind: "pct", fn: (r) => div(r.show, r.booked) },
  paidRate:  { label: "Paid rate", kind: "pct", fn: (r) => div(r.paid, r.show) },
  coeRate:   { label: "COE rate", kind: "pct", fn: (r) => div(r.coes, r.paid) },
};

const FUNNEL = ["leads", "booked", "show", "paid", "coes"];

/* Which fields each group collects */
const GROUPS = [
  {
    id: "paid", title: "Paid Media", sub: "Meta ads", ownerId: "pm", layout: "panel",
    inputs: ["spend", "linkClicks", "cpm", "convos", "leads", "booked", "show", "paid", "coes"],
    derived: ["cpc", "cpl", "cpb", "bookRate", "showRate"],
  },
  {
    id: "social", title: "Social", sub: "organic social channels", ownerId: "smm", layout: "table",
    inputs: ["queries", "leads", "booked", "show", "paid", "coes", "payment"],
    derived: ["bookRate", "showRate"],
  },
  {
    id: "search", title: "Organic Search", sub: "website", ownerId: "seo", layout: "table",
    inputs: ["impressions", "clicks", "leads", "booked", "show", "paid", "coes", "payment"],
    derived: ["ctr", "bookRate", "showRate"],
  },
  {
    id: "indep", title: "Independent organic", sub: "no team lead assigned", ownerId: "none", layout: "table",
    inputs: ["leads", "booked", "show", "paid", "coes", "payment"],
    derived: ["bookRate", "showRate"],
  },
];
const groupOf = (id) => GROUPS.find((g) => g.id === id);

const TAGS = ["", "Intake peak", "Intake trough", "Public holiday", "Campaign launch", "Tracking gap", "Other one-off"];
const KEY = "edu-marketing-ledger-v3";

/* 16 weeks backfilled from the WBR workbook (5 Apr – 19 Jul 2026).
   Only figures that exist per-channel in the source are here. Where the
   source tracked something at platform level only, the cell is left blank
   and the week's note records the number. */
const SEED = {"2026-04-05":{"ch":{"meta":{"spend":2526.02,"linkClicks":1443,"convos":189,"leads":232,"booked":53,"show":22,"cpm":14.64},"search":{"leads":10,"payment":248},"referral":{"leads":12,"payment":375},"walkin":{"leads":8},"direct":{"leads":8},"other":{"leads":8,"payment":1448}},"co":{"gurbir":{"booked":11},"nasir":{"booked":2,"coes":3},"turab":{"booked":1},"kajal":{"booked":18},"navneet":{"booked":30},"saurab":{"booked":15},"wajahad":{"booked":39}},"note":"Backfilled from WBR. Not split by channel in source \u2014 social leads 4; organic booked 30 / showed 21."},"2026-04-12":{"ch":{"meta":{"spend":908.28,"linkClicks":571,"convos":75,"leads":96,"booked":32,"show":18,"cpm":13.07},"search":{"leads":11},"referral":{"leads":12,"payment":698},"walkin":{"leads":7},"direct":{"leads":11},"other":{"leads":11,"payment":1150}},"co":{"gurbir":{"booked":7},"nasir":{"booked":1,"coes":29},"turab":{"booked":2,"coes":5},"kajal":{"booked":8},"navneet":{"booked":14},"saurab":{"booked":12},"wajahad":{"booked":15}},"note":"Backfilled from WBR. Not split by channel in source \u2014 social leads 6; organic booked 27 / showed 19."},"2026-04-19":{"ch":{"meta":{"spend":172,"linkClicks":117,"leads":46,"booked":46,"show":25,"cpm":18.33},"search":{"leads":3,"payment":250},"referral":{"leads":14,"payment":775},"walkin":{"leads":8},"direct":{"leads":9,"payment":100},"other":{"leads":13,"payment":7648}},"co":{"gurbir":{"booked":17,"coes":1},"nasir":{"booked":6,"coes":1},"turab":{"booked":3},"kajal":{"booked":8},"navneet":{"booked":6},"saurab":{"booked":14},"wajahad":{"booked":18}},"note":"Backfilled from WBR. Not split by channel in source \u2014 social leads 7; organic booked 38 / showed 30."},"2026-04-26":{"ch":{"meta":{"spend":296,"linkClicks":158,"convos":1,"leads":43,"booked":34,"show":16,"cpm":17.42},"search":{"leads":8,"payment":100},"referral":{"leads":22,"payment":5280},"walkin":{"leads":8},"direct":{"leads":7},"other":{"leads":10,"payment":3230}},"co":{"gurbir":{"booked":7,"coes":2},"nasir":{"booked":8,"coes":5},"turab":{"coes":1},"kajal":{"booked":6,"coes":14},"navneet":{"booked":14,"coes":2},"saurab":{"booked":10,"coes":12},"wajahad":{"booked":16,"coes":13}},"note":"Backfilled from WBR. Not split by channel in source \u2014 social leads 7; organic booked 30 / showed 23."},"2026-05-03":{"ch":{"meta":{"spend":719,"linkClicks":392,"convos":10,"leads":55,"booked":39,"show":25,"cpm":16.76},"search":{"leads":3},"referral":{"leads":17,"payment":980},"walkin":{"leads":9},"direct":{"leads":6},"other":{"leads":7,"payment":11293}},"co":{"gurbir":{"booked":8,"coes":1},"nasir":{"booked":15,"coes":10},"kajal":{"booked":11,"coes":2},"navneet":{"booked":10},"saurab":{"booked":9},"wajahad":{"booked":20,"coes":4}},"note":"Backfilled from WBR. Not split by channel in source \u2014 social leads 1; organic booked 30 / showed 26."},"2026-05-10":{"ch":{"meta":{"spend":777,"linkClicks":334,"convos":14,"leads":60,"booked":44,"show":23,"cpm":17.96},"search":{"leads":2,"payment":1767},"referral":{"leads":18,"payment":2400},"walkin":{"leads":17},"direct":{"leads":7,"payment":100},"other":{"leads":11,"payment":32743}},"co":{"gurbir":{"booked":5,"coes":1},"nasir":{"booked":19,"coes":4},"turab":{"booked":6,"coes":1},"kajal":{"booked":9,"coes":1},"navneet":{"booked":26},"saurab":{"booked":9},"wajahad":{"booked":18,"coes":2}},"note":"Backfilled from WBR. Not split by channel in source \u2014 social leads 4 (payment $150); organic booked 42 / showed 39."},"2026-05-17":{"ch":{"meta":{"spend":2416,"linkClicks":960,"convos":100,"leads":120,"booked":36,"show":19,"cpm":19.66},"search":{"leads":11,"payment":100},"referral":{"leads":20,"payment":5160},"walkin":{"leads":8},"direct":{"leads":8},"other":{"leads":11,"payment":1948}},"co":{"gurbir":{"booked":4},"nasir":{"booked":28,"coes":1},"turab":{"booked":8,"coes":2},"kajal":{"booked":7,"coes":4},"navneet":{"booked":15,"coes":2},"saurab":{"booked":8,"coes":2},"wajahad":{"booked":12,"coes":2}},"note":"Backfilled from WBR. Not split by channel in source \u2014 social leads 4; organic booked 39 / showed 34."},"2026-05-24":{"ch":{"meta":{"spend":1949,"linkClicks":823,"convos":85,"leads":117,"booked":42,"show":15,"cpm":23.49},"search":{"leads":6},"referral":{"leads":26,"payment":1985},"walkin":{"leads":8},"direct":{"leads":8},"other":{"leads":7,"payment":6874}},"co":{"gurbir":{"booked":7},"nasir":{"booked":19,"coes":6},"turab":{"booked":7,"coes":1},"kajal":{"booked":7,"coes":2},"navneet":{"booked":16,"coes":1},"saurab":{"booked":5,"coes":7},"wajahad":{"booked":8}},"note":"Backfilled from WBR. Not split by channel in source \u2014 social leads 4; organic booked 35 / showed 29."},"2026-05-31":{"ch":{"meta":{"spend":1160,"linkClicks":539,"convos":22,"leads":35,"booked":11,"show":6,"cpm":23.5},"search":{"leads":7,"payment":100},"referral":{"leads":17,"payment":3528},"walkin":{"leads":4},"direct":{"leads":9},"other":{"leads":14,"payment":31900}},"co":{"gurbir":{"booked":3},"nasir":{"booked":19},"turab":{"booked":6},"kajal":{"booked":5,"coes":2},"navneet":{"booked":3},"saurab":{"booked":8,"coes":1},"wajahad":{"booked":8}},"note":"Backfilled from WBR. Not split by channel in source \u2014 social leads 5; organic booked 43 / showed 26."},"2026-06-07":{"ch":{"meta":{"spend":1709,"linkClicks":1077,"convos":15,"leads":51,"booked":33,"show":15,"cpm":23.01},"search":{"leads":8,"payment":6264},"referral":{"leads":23,"payment":1900},"walkin":{"leads":4},"direct":{"leads":10},"other":{"leads":9,"payment":11884}},"co":{"gurbir":{"booked":4,"coes":6},"nasir":{"booked":28,"coes":8},"turab":{"booked":8,"coes":2},"kajal":{"booked":2,"coes":2},"navneet":{"booked":10,"coes":1},"saurab":{"booked":8,"coes":3},"wajahad":{"booked":3,"coes":1}},"note":"Backfilled from WBR. Not split by channel in source \u2014 social leads 6; organic booked 43 / showed 38."},"2026-06-14":{"ch":{"meta":{"spend":1313,"linkClicks":606,"convos":27,"leads":34,"booked":18,"show":7,"cpm":19.67},"search":{"leads":8,"payment":275},"referral":{"leads":6,"payment":475},"walkin":{"leads":7},"direct":{"leads":8},"other":{"leads":12,"payment":7795}},"co":{"gurbir":{"booked":1},"nasir":{"booked":18,"coes":3},"turab":{"booked":6,"coes":1},"kajal":{"booked":10,"coes":6},"navneet":{"booked":3},"saurab":{"booked":5},"wajahad":{"booked":10,"coes":4}},"note":"Backfilled from WBR. Not split by channel in source \u2014 social leads 6; organic booked 30 / showed 24."},"2026-06-21":{"ch":{"meta":{"spend":2063.76,"linkClicks":1173,"convos":18,"leads":35,"booked":18,"show":10,"cpm":16.01},"search":{"leads":3,"payment":1128},"referral":{"leads":21,"payment":2498},"walkin":{"leads":5},"direct":{"leads":12,"payment":100},"other":{"leads":7,"payment":11312}},"co":{"gurbir":{"coes":2},"nasir":{"booked":22,"coes":4},"turab":{"booked":4,"coes":3},"kajal":{"booked":6,"coes":5},"navneet":{"booked":5},"saurab":{"booked":3,"coes":2},"wajahad":{"booked":5,"coes":7}},"note":"Backfilled from WBR. Not split by channel in source \u2014 social leads 12; organic booked 29 / showed 23."},"2026-06-28":{"ch":{"meta":{"spend":2963.56,"linkClicks":1179,"convos":13,"leads":17,"booked":7,"show":4,"cpm":20.42},"search":{"leads":5,"payment":7403},"referral":{"leads":14,"payment":12533},"walkin":{"leads":5},"direct":{"leads":4},"other":{"leads":9,"payment":18971}},"co":{"gurbir":{"booked":4},"nasir":{"booked":17,"coes":3},"turab":{"booked":2,"coes":1},"kajal":{"booked":1,"coes":3},"navneet":{"booked":2},"saurab":{"booked":5,"coes":2},"wajahad":{"booked":9,"coes":7}},"note":"Backfilled from WBR. Not split by channel in source \u2014 social leads 8; organic booked 30 / showed 22."},"2026-07-05":{"ch":{"meta":{"spend":2975,"linkClicks":1119,"convos":37,"leads":54,"booked":21,"show":7},"search":{"leads":11},"referral":{"leads":19},"walkin":{"leads":2},"direct":{"leads":10},"other":{"leads":6}},"co":{"gurbir":{"booked":2},"nasir":{"booked":19},"turab":{"booked":1},"kajal":{"booked":3,"coes":1},"navneet":{"booked":9},"saurab":{"booked":6,"coes":2},"wajahad":{"booked":8,"coes":2}},"note":"Backfilled from WBR. Not split by channel in source \u2014 social leads 7; organic booked 28 / showed 22."},"2026-07-12":{"ch":{"meta":{"spend":2815.4,"linkClicks":1102,"convos":20,"leads":51,"booked":6,"show":3},"search":{"leads":13},"referral":{"leads":18},"walkin":{"leads":2},"direct":{"leads":8},"other":{"leads":4}},"co":{"gurbir":{"booked":4},"nasir":{"booked":11},"kajal":{"booked":3,"coes":5},"navneet":{"booked":2},"saurab":{"booked":6,"coes":2},"wajahad":{"booked":3,"coes":4}},"note":"Backfilled from WBR. Not split by channel in source \u2014 social leads 3; organic booked 29 / showed 21."},"2026-07-19":{"ch":{"meta":{"spend":1425,"linkClicks":479,"convos":10,"leads":16,"booked":1},"search":{"leads":11},"referral":{"leads":16},"walkin":{"leads":3},"direct":{"leads":13},"other":{"leads":4}},"co":{"gurbir":{"booked":1},"nasir":{"booked":14},"turab":{"booked":1},"kajal":{"booked":1,"coes":3},"saurab":{"booked":2,"coes":1},"wajahad":{"booked":4,"coes":4}},"note":"Backfilled from WBR. Not split by channel in source \u2014 social leads 4; organic booked 22 / showed 15."}};

/* ================================================================== *
 *  HELPERS
 * ================================================================== */
function div(a, b) { return b ? a / b : 0; }
const num = (v) => {
  const n = parseFloat(String(v ?? "").replace(/[, $]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const nf = (n, d = 0) =>
  Number.isFinite(n) ? n.toLocaleString("en-AU", { minimumFractionDigits: d, maximumFractionDigits: d }) : "—";
const money = (n, d = 0) => (Number.isFinite(n) && n !== 0 ? `$${nf(n, d)}` : n === 0 ? "—" : "—");
const pctf = (n, d = 1) => (Number.isFinite(n) && n !== 0 ? `${(n * 100).toFixed(d)}%` : n === 0 ? "—" : "—");
const growth = (a, b) => (b ? a / b - 1 : NaN);
const show = (v, kind, d) => (kind === "money" ? money(v, d) : kind === "pct" ? pctf(v, d ?? 1) : nf(v));

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const weekEnding = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return addDays(x, (7 - x.getDay()) % 7); };
function isoWeekNum(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  return Math.ceil(((t - new Date(Date.UTC(t.getUTCFullYear(), 0, 1))) / 864e5 + 1) / 7);
}
const weekLabel = (k) => `W${isoWeekNum(fromISO(k))}`;
function weekLong(k) {
  const d = fromISO(k), s = addDays(d, -6);
  return `${s.getDate()} ${MONTHS[s.getMonth()]} – ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
const weekOfMonth = (k) => Math.min(5, Math.ceil(fromISO(k).getDate() / 7));

function emptyWeek() {
  const channels = {};
  CHANNELS.forEach((c) => {
    channels[c.id] = {};
    groupOf(c.group).inputs.forEach((f) => (channels[c.id][f] = ""));
  });
  const counsellors = {};
  COUNSELLORS.forEach((p) => (counsellors[p.id] = { booked: "", show: "", coes: "" }));
  return { channels, counsellors, tag: "", note: "" };
}

/* --------- roll-ups --------- */
function rollup(week, chans) {
  const t = {};
  Object.keys(FIELDS).forEach((f) => (t[f] = 0));
  if (!week) return t;
  chans.forEach((c) => {
    const r = week.channels?.[c.id];
    if (!r) return;
    Object.keys(FIELDS).forEach((f) => (t[f] += num(r[f])));
  });
  return t;
}
const rates = (r) => ({
  ...r,
  cpl: div(r.spend, r.leads), cpb: div(r.spend, r.booked),
  bookRate: div(r.booked, r.leads), showRate: div(r.show, r.booked),
  paidRate: div(r.paid, r.show), coeRate: div(r.coes, r.paid),
  ctr: div(r.clicks, r.impressions), cpc: div(r.spend, r.linkClicks),
});

/* --------- seasonality --------- */
function decompose(series) {
  const n = series.length, trend = new Array(n).fill(null);
  const v = series.map((s) => s.value);
  if (n >= 5) for (let i = 2; i < n - 2; i++) trend[i] = (0.5 * v[i - 2] + v[i - 1] + v[i] + v[i + 1] + 0.5 * v[i + 2]) / 4;
  return { trend, ratio: series.map((s, i) => (trend[i] > 0 ? s.value / trend[i] : null)) };
}
function indexBy(series, ratio, keyFn, minObs = 2) {
  const b = {};
  series.forEach((s, i) => { if (ratio[i] != null && !s.excluded) (b[keyFn(s)] = b[keyFn(s)] || []).push(ratio[i]); });
  const raw = {};
  Object.entries(b).forEach(([k, a]) => { if (a.length >= minObs) raw[k] = a.reduce((x, y) => x + y, 0) / a.length; });
  const vals = Object.values(raw);
  if (!vals.length) return {};
  const mean = vals.reduce((x, y) => x + y, 0) / vals.length;
  const out = {};
  Object.entries(raw).forEach(([k, v]) => (out[k] = { index: (v / mean) * 100, n: b[k].length }));
  return out;
}
const stdev = (a) => {
  if (a.length < 2) return 0;
  const m = a.reduce((x, y) => x + y, 0) / a.length;
  return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1));
};

/* ================================================================== *
 *  STORAGE (degrades to session memory instead of breaking)
 * ================================================================== */
const mem = {};
let persistent = true;

/* Works in three places without changing a line:
   1. Claude artifact  -> window.storage
   2. Vercel / any web -> localStorage
   3. neither          -> memory for this session only            */
const store = {
  async get(k) {
    try {
      if (typeof window !== "undefined" && window.storage?.get) {
        const r = await window.storage.get(k);
        persistent = true;
        return r;
      }
    } catch (e) {
      if (!String(e).match(/not.?found|no.?such|missing/i)) persistent = false;
      return null;
    }
    try {
      const v = window.localStorage.getItem(k);
      persistent = true;
      return v == null ? null : { key: k, value: v };
    } catch { /* blocked */ }
    persistent = false;
    return mem[k] ? { key: k, value: mem[k] } : null;
  },
  async set(k, v) {
    try {
      if (typeof window !== "undefined" && window.storage?.set) {
        const r = await window.storage.set(k, v);
        persistent = true;
        return r;
      }
    } catch { /* fall through */ }
    try {
      window.localStorage.setItem(k, v);
      persistent = true;
      return { key: k, value: v };
    } catch { /* quota or private mode */ }
    persistent = false;
    mem[k] = v;
    return { key: k, value: v };
  },
};

/* Turn the compact SEED into full week records. Unknown ids are ignored,
   so editing CHANNELS or COUNSELLORS can never break the backfill. */
function expandSeed() {
  const out = {};
  Object.entries(SEED).forEach(([wk, d]) => {
    const w = emptyWeek();
    Object.entries(d.ch || {}).forEach(([cid, vals]) => {
      if (!w.channels[cid]) return;
      Object.entries(vals).forEach(([f, val]) => {
        if (f in w.channels[cid]) w.channels[cid][f] = String(val);
      });
    });
    Object.entries(d.co || {}).forEach(([pid, vals]) => {
      if (!w.counsellors[pid]) return;
      Object.entries(vals).forEach(([f, val]) => {
        if (f in w.counsellors[pid]) w.counsellors[pid][f] = String(val);
      });
    });
    w.note = d.note || "";
    out[wk] = w;
  });
  return out;
}

/* ================================================================== *
 *  UI ATOMS
 * ================================================================== */
const Eyebrow = ({ children, style }) => (
  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: C.faint, fontWeight: 500, ...style }}>
    {children}
  </div>
);
const Card = ({ children, style }) => (
  <div style={{ background: C.card, border: `1px solid ${C.rule}`, borderRadius: 3, padding: 18, ...style }}>{children}</div>
);
const Delta = ({ v, invert }) => {
  if (!Number.isFinite(v) || v === 0) return <span style={{ color: C.faint, fontFamily: "'IBM Plex Mono', monospace" }}>—</span>;
  const good = invert ? v < 0 : v > 0;
  return (
    <span style={{ color: good ? C.up : C.down, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, whiteSpace: "nowrap" }}>
      {v > 0 ? "▲" : "▼"} {Math.abs(v * 100).toFixed(1)}%
    </span>
  );
};
function Btn({ children, onClick, primary, danger, small }) {
  return (
    <button onClick={onClick} style={{
      background: primary ? C.ink : "transparent", color: primary ? C.paper : danger ? C.down : C.ink,
      border: `1px solid ${primary ? C.ink : danger ? "#E3C9C9" : C.rule}`, borderRadius: 2,
      padding: small ? "4px 9px" : "6px 12px", fontSize: small ? 11.5 : 12.5, fontWeight: 500, cursor: "pointer",
    }}>{children}</button>
  );
}
function SectionHead({ n, title, note }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, borderBottom: `1px solid ${C.rule}`, paddingBottom: 6, marginTop: 6, flexWrap: "wrap" }}>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: C.faint }}>{n}</span>
      <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 15.5, fontWeight: 600, margin: 0, letterSpacing: "-.01em" }}>{title}</h2>
      <span style={{ fontSize: 11.5, color: C.faint }}>{note}</span>
    </div>
  );
}
const Empty = ({ title, body }) => (
  <Card style={{ borderStyle: "dashed", textAlign: "center", padding: 34 }}>
    <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
    <div style={{ fontSize: 12.5, color: C.muted, marginTop: 5 }}>{body}</div>
  </Card>
);
const th = { padding: "9px 8px", textAlign: "right", fontSize: 10.5, fontWeight: 600, color: C.muted, letterSpacing: ".05em", textTransform: "uppercase", borderBottom: `1px solid ${C.rule}`, whiteSpace: "nowrap" };
const td = { padding: "5px 8px", textAlign: "right", borderBottom: "1px solid #EFF1EE" };
const Mono = ({ children, dim }) => (
  <td style={{ ...td, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5, color: dim ? C.muted : C.ink }}>{children}</td>
);
const shellStyle = { minHeight: "100vh", background: C.paper, color: C.ink, fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 14 };

function Fonts() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
      * { box-sizing: border-box; }
      input, select, button { font-family: inherit; }
      input:focus-visible, select:focus-visible, button:focus-visible { outline: 2px solid ${C.navy}; outline-offset: 1px; }
      .cellInput { width:100%; border:none; background:transparent; text-align:right; font-family:'IBM Plex Mono',monospace; font-size:12.5px; color:${C.ink}; padding:7px 8px; border-radius:2px; }
      .cellInput:focus { background:${C.wash}; outline:none; box-shadow: inset 0 0 0 1px ${C.navy}; }
      .cellInput::placeholder { color:#C9CEC8; }
      .boxInput { width:100%; border:1px solid ${C.rule}; background:${C.card}; text-align:right; font-family:'IBM Plex Mono',monospace; font-size:14px; color:${C.ink}; padding:8px 10px; border-radius:2px; }
      .boxInput:focus { outline:none; box-shadow: inset 0 0 0 2px ${C.navy}; }
      .rowHover:hover { background:#FAFBF9; }
      @media (prefers-reduced-motion: reduce) { * { transition:none !important; } }
    `}</style>
  );
}

/* ================================================================== *
 *  APP
 * ================================================================== */
function Ledger() {
  const [weeks, setWeeks] = useState({});
  const [order, setOrder] = useState([]);
  const [active, setActive] = useState(null);
  const [view, setView] = useState("enter");
  const [status, setStatus] = useState("loading");
  const [saveState, setSaveState] = useState("idle");
  const timer = useRef(null);

  useEffect(() => {
    (async () => {
      let data = null;
      try { const r = await store.get(KEY); data = r ? JSON.parse(r.value) : null; } catch { /* empty */ }
      if (!data?.weeks || !Object.keys(data.weeks).length) data = { weeks: expandSeed() };
      if (data?.weeks && Object.keys(data.weeks).length) {
        const keys = Object.keys(data.weeks).sort();
        setWeeks(data.weeks); setOrder(keys);
        setActive(data.active && data.weeks[data.active] ? data.active : keys[keys.length - 1]);
      } else {
        const k = toISO(weekEnding(new Date()));
        setWeeks({ [k]: emptyWeek() }); setOrder([k]); setActive(k);
      }
      setStatus("ready");
    })();
  }, []);

  const persist = useCallback((w, a) => {
    setSaveState("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await store.set(KEY, JSON.stringify({ weeks: w, active: a }));
        setSaveState("saved"); setTimeout(() => setSaveState("idle"), 1600);
      } catch { setSaveState("error"); }
    }, 600);
  }, []);

  const setChannel = (k, cid, field, val) => setWeeks((p) => {
    const n = { ...p, [k]: { ...p[k], channels: { ...p[k].channels, [cid]: { ...p[k].channels[cid], [field]: val } } } };
    persist(n, active); return n;
  });
  const setStaff = (k, pid, field, val) => setWeeks((p) => {
    const n = { ...p, [k]: { ...p[k], counsellors: { ...p[k].counsellors, [pid]: { ...p[k].counsellors[pid], [field]: val } } } };
    persist(n, active); return n;
  });
  const setMeta = (k, field, val) => setWeeks((p) => {
    const n = { ...p, [k]: { ...p[k], [field]: val } }; persist(n, active); return n;
  });

  const addWeek = () => {
    const k = toISO(addDays(fromISO(order[order.length - 1]), 7));
    if (weeks[k]) return setActive(k);
    const n = { ...weeks, [k]: emptyWeek() }, o = [...order, k].sort();
    setWeeks(n); setOrder(o); setActive(k); setView("enter"); persist(n, k);
  };
  const copyPrev = () => {
    const i = order.indexOf(active); if (i <= 0) return;
    const prev = weeks[order[i - 1]];
    const n = { ...weeks, [active]: { ...weeks[active], channels: JSON.parse(JSON.stringify(prev.channels)), counsellors: JSON.parse(JSON.stringify(prev.counsellors)) } };
    setWeeks(n); persist(n, active);
  };
  const clearWeek = () => {
    const n = { ...weeks, [active]: { ...emptyWeek(), tag: weeks[active].tag, note: weeks[active].note } };
    setWeeks(n); persist(n, active);
  };
  const restoreSeed = () => {
    const seeded = expandSeed();
    const n = { ...weeks };
    let added = 0;
    Object.entries(seeded).forEach(([k, w]) => { if (!n[k]) { n[k] = w; added++; } });
    if (!added) return;
    const o = Object.keys(n).sort();
    setWeeks(n); setOrder(o); persist(n, active);
  };
  const missingSeed = Object.keys(SEED).filter((k) => !weeks[k]).length;

  const delWeek = () => {
    if (order.length <= 1) return;
    const n = { ...weeks }; delete n[active];
    const o = order.filter((x) => x !== active);
    setWeeks(n); setOrder(o); setActive(o[o.length - 1]); persist(n, o[o.length - 1]);
  };

  const series = useMemo(() => order.map((k) => {
    const t = rates(rollup(weeks[k], CHANNELS));
    return { key: k, label: weekLabel(k), value: t.leads, totals: t, tag: weeks[k]?.tag || "", excluded: !!weeks[k]?.tag, filled: t.leads > 0 || t.booked > 0 || t.spend > 0 };
  }), [order, weeks]);

  if (status === "loading")
    return <div style={{ ...shellStyle, display: "flex", alignItems: "center", justifyContent: "center" }}><Fonts /><Eyebrow>Loading your ledger…</Eyebrow></div>;
  if (!active || !weeks[active])
    return <div style={{ ...shellStyle, padding: 40 }}><Fonts /><Empty title="No week selected" body="Reload to start a fresh ledger." /></div>;

  const i = order.indexOf(active);
  const prevKey = i > 0 ? order[i - 1] : null;
  const cur = rates(rollup(weeks[active], CHANNELS));
  const prv = rates(rollup(prevKey ? weeks[prevKey] : null, CHANNELS));
  const filled = series.filter((s) => s.filled).length;

  const NAV = [
    { id: "enter", label: "Enter", sub: "weekly numbers" },
    { id: "review", label: "Review", sub: prevKey ? `vs ${weekLabel(prevKey)}` : "this week" },
    { id: "team", label: "Counsellors", sub: `${COUNSELLORS.length} people` },
    { id: "trends", label: "Trends", sub: "week over week" },
    { id: "season", label: "Seasonality", sub: `${filled} wk logged` },
  ];

  return (
    <div style={shellStyle}>
      <Fonts />
      <header style={{ borderBottom: `1px solid ${C.rule}`, background: C.card, padding: "14px 20px 0" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "baseline", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontFamily: "'Bricolage Grotesque','IBM Plex Sans',sans-serif", fontSize: 21, fontWeight: 800, letterSpacing: "-.02em", margin: 0 }}>
              Weekly Marketing Ledger
            </h1>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              Leads → Booked → Show → COEs · figures in AUD
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <SaveChip state={saveState} />
            <Btn onClick={() => exportCSV(order, weeks)}>Export CSV</Btn>
            <Btn primary onClick={addWeek}>+ Add week</Btn>
          </div>
        </div>
        <WeekSpine series={series} active={active} onPick={(k) => { setActive(k); persist(weeks, k); }} />
        <nav style={{ display: "flex", gap: 2, marginTop: 4, overflowX: "auto" }}>
          {NAV.map((n) => {
            const on = view === n.id;
            return (
              <button key={n.id} onClick={() => setView(n.id)} style={{
                background: "none", border: "none", borderBottom: `2px solid ${on ? C.ink : "transparent"}`,
                padding: "8px 14px 9px", cursor: "pointer", textAlign: "left", flexShrink: 0,
              }}>
                <div style={{ fontSize: 13, fontWeight: on ? 600 : 500, color: on ? C.ink : C.muted }}>{n.label}</div>
                <div style={{ fontSize: 10, color: C.faint, fontFamily: "'IBM Plex Mono',monospace" }}>{n.sub}</div>
              </button>
            );
          })}
        </nav>
      </header>

      <main style={{ padding: "18px 20px 60px", maxWidth: 1180, margin: "0 auto" }}>
        {view === "enter" && <EnterView wk={active} week={weeks[active]} cur={cur}
          onCh={setChannel} onStaff={setStaff} onMeta={setMeta}
          onCopy={copyPrev} onClear={clearWeek} onDelete={delWeek}
          onRestore={restoreSeed} missingSeed={missingSeed}
          canCopy={i > 0} canDelete={order.length > 1} />}
        {view === "review" && <ReviewView wk={active} prevKey={prevKey} week={weeks[active]} prev={prevKey ? weeks[prevKey] : null} cur={cur} prv={prv} />}
        {view === "team" && <TeamView week={weeks[active]} order={order} weeks={weeks} />}
        {view === "trends" && <TrendsView order={order} weeks={weeks} />}
        {view === "season" && <SeasonView series={series} weeks={weeks} />}
      </main>
    </div>
  );
}

function SaveChip({ state }) {
  if (state === "idle") return null;
  const m = { saving: ["Saving…", C.faint], saved: [persistent ? "Saved" : "Session only", persistent ? C.pine : C.ochre], error: ["Not saved", C.down] };
  const [t, col] = m[state] || m.saving;
  return <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, color: col, letterSpacing: ".06em" }}>{t}</span>;
}

function WeekSpine({ series, active, onPick }) {
  const max = Math.max(1, ...series.map((s) => s.value));
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 4 }}>
        <Eyebrow>Week spine — lead volume · click to open</Eyebrow>
        <Eyebrow>{weekLong(active)}</Eyebrow>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 52, overflowX: "auto", paddingBottom: 2, borderBottom: `1px solid ${C.rule}` }}>
        {series.map((s) => {
          const on = s.key === active;
          const h = s.value > 0 ? Math.max(4, (s.value / max) * 40) : 3;
          return (
            <button key={s.key} onClick={() => onPick(s.key)} title={`${weekLong(s.key)}\n${nf(s.value)} leads${s.tag ? ` · ${s.tag}` : ""}`}
              style={{ border: "none", background: "none", padding: 0, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", minWidth: 22, flex: "0 0 auto" }}>
              {s.tag && <span style={{ width: 4, height: 4, borderRadius: 4, background: C.ochre, marginBottom: 2 }} />}
              <span style={{ width: 14, height: h, background: on ? C.ink : s.value > 0 ? "#B7BEB8" : "#E4E7E2", borderRadius: 1, display: "block" }} />
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, marginTop: 3, color: on ? C.ink : C.faint, fontWeight: on ? 600 : 400 }}>{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== *
 *  ENTER
 * ================================================================== */
function EnterView({ wk, week, cur, onCh, onStaff, onMeta, onCopy, onClear, onDelete, onRestore, missingSeed, canCopy, canDelete }) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <Eyebrow>Mark this week</Eyebrow>
          <select value={week?.tag || ""} onChange={(e) => onMeta(wk, "tag", e.target.value)}
            style={{ border: `1px solid ${C.rule}`, borderRadius: 2, padding: "5px 8px", fontSize: 12, background: C.card, color: week?.tag ? C.ochre : C.muted }}>
            {TAGS.map((t) => <option key={t} value={t}>{t || "Normal week"}</option>)}
          </select>
          <span style={{ fontSize: 11, color: C.faint }}>Tagged weeks stay in charts, out of the seasonality baseline.</span>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {missingSeed > 0 && <Btn small onClick={onRestore}>Restore {missingSeed} backfilled {missingSeed === 1 ? "week" : "weeks"}</Btn>}
          {canCopy && <Btn small onClick={onCopy}>Copy last week</Btn>}
          <Btn small onClick={onClear}>Clear</Btn>
          {canDelete && <Btn small danger onClick={onDelete}>Delete week</Btn>}
        </div>
      </div>

      {GROUPS.map((g) => {
        const chans = CHANNELS.filter((c) => c.group === g.id);
        const owner = OWNERS.find((o) => o.id === g.ownerId);
        return (
          <div key={g.id} style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap" }}>
              <span style={{ width: 3, height: 14, background: owner.color, borderRadius: 2, alignSelf: "center" }} />
              <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 14.5, fontWeight: 600, margin: 0 }}>{g.title}</h3>
              <span style={{ fontSize: 11.5, color: C.faint }}>{g.sub}</span>
              <span style={{ fontSize: 11, color: owner.color, fontWeight: 500 }}>{owner.name}</span>
            </div>
            {g.layout === "panel"
              ? <PaidPanel g={g} chan={chans[0]} row={week.channels[chans[0].id]} onCh={(f, v) => onCh(wk, chans[0].id, f, v)} />
              : <GroupTable g={g} chans={chans} week={week} onCh={(cid, f, v) => onCh(wk, cid, f, v)} />}
          </div>
        );
      })}

      <StaffTable week={week} onStaff={(pid, f, v) => onStaff(wk, pid, f, v)} />

      <div style={{ display: "grid", gap: 6 }}>
        <Eyebrow>Note for the meeting (optional)</Eyebrow>
        <input value={week?.note || ""} onChange={(e) => onMeta(wk, "note", e.target.value)}
          placeholder="What happened this week that the numbers don't explain?"
          style={{ border: `1px solid ${C.rule}`, borderRadius: 2, padding: "9px 11px", fontSize: 13, background: C.card, width: "100%" }} />
      </div>
      <p style={{ fontSize: 11.5, color: C.faint, margin: 0, lineHeight: 1.6 }}>
        Booking rate is Booked ÷ Leads. Show rate is Show ÷ Booked. Payment is money received; only Meta Ads
        carries Spend. Everything saves as you type.
      </p>
    </div>
  );
}

function PaidPanel({ g, row, onCh }) {
  const r = {}; Object.keys(FIELDS).forEach((f) => (r[f] = num(row?.[f])));
  return (
    <Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(148px,1fr))", gap: 12 }}>
        {g.inputs.map((f) => (
          <label key={f} style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 10.5, color: C.muted, fontWeight: 500, letterSpacing: ".03em", textTransform: "uppercase", lineHeight: 1.35 }}>
              {FIELDS[f].label}{FIELDS[f].kind === "money" ? " (AUD)" : ""}
            </span>
            <input className="boxInput" inputMode="numeric" placeholder="0"
              value={row?.[f] ?? ""} onChange={(e) => onCh(f, e.target.value)} />
          </label>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 0, marginTop: 16, borderTop: `1px solid ${C.rule}`, paddingTop: 13 }}>
        {g.derived.map((d) => {
          const D = DERIVED[d];
          return (
            <div key={d} style={{ padding: "0 18px 0 0", marginRight: 18, borderRight: `1px solid ${C.rule}`, minWidth: 104, marginBottom: 6 }}>
              <Eyebrow>{D.label}</Eyebrow>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 16, marginTop: 3 }}>
                {show(D.fn(r), D.kind, D.kind === "money" ? 2 : 1)}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function GroupTable({ g, chans, week, onCh }) {
  const tot = {}; Object.keys(FIELDS).forEach((f) => (tot[f] = 0));
  chans.forEach((c) => g.inputs.forEach((f) => (tot[f] += num(week.channels[c.id]?.[f]))));
  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 640 }}>
          <thead>
            <tr style={{ background: C.wash }}>
              <th style={{ ...th, textAlign: "left", paddingLeft: 16, position: "sticky", left: 0, background: C.wash, zIndex: 2, minWidth: 140 }}>Channel</th>
              {g.inputs.map((f) => <th key={f} style={{ ...th, minWidth: 84 }}>{FIELDS[f].short}{FIELDS[f].kind === "money" ? " $" : ""}</th>)}
              {g.derived.map((d) => <th key={d} style={{ ...th, minWidth: 84, color: C.faint }}>{DERIVED[d].label}</th>)}
            </tr>
          </thead>
          <tbody>
            {chans.map((c) => {
              const row = week.channels[c.id] || {};
              const r = {}; Object.keys(FIELDS).forEach((f) => (r[f] = num(row[f])));
              return (
                <tr key={c.id} className="rowHover">
                  <td style={{ ...td, textAlign: "left", paddingLeft: 16, position: "sticky", left: 0, background: C.card, zIndex: 1, fontSize: 13 }}>{c.name}</td>
                  {g.inputs.map((f) => (
                    <td key={f} style={{ ...td, padding: 0 }}>
                      <input className="cellInput" inputMode="numeric" placeholder="0" value={row[f] ?? ""} onChange={(e) => onCh(c.id, f, e.target.value)} />
                    </td>
                  ))}
                  {g.derived.map((d) => {
                    const v = DERIVED[d].fn(r);
                    return <td key={d} style={{ ...td, fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: v ? C.muted : C.faint }}>{show(v, DERIVED[d].kind)}</td>;
                  })}
                </tr>
              );
            })}
            <tr style={{ background: C.wash, borderTop: `2px solid ${C.ink}` }}>
              <td style={{ ...td, textAlign: "left", paddingLeft: 16, fontWeight: 600, position: "sticky", left: 0, background: C.wash }}>Total</td>
              {g.inputs.map((f) => <td key={f} style={{ ...td, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 600, fontSize: 12.5 }}>{show(tot[f], FIELDS[f].kind)}</td>)}
              {g.derived.map((d) => <td key={d} style={{ ...td, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 600, fontSize: 12.5 }}>{show(DERIVED[d].fn(tot), DERIVED[d].kind)}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function StaffTable({ week, onStaff }) {
  const cols = [
    { id: "booked", label: "Bookings" },
    { id: "show", label: "Show" },
    { id: "coes", label: "COEs" },
  ];
  const tot = { booked: 0, show: 0, coes: 0 };
  COUNSELLORS.forEach((p) => cols.forEach((c) => (tot[c.id] += num(week.counsellors?.[p.id]?.[c.id]))));
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap" }}>
        <span style={{ width: 3, height: 14, background: C.plum, borderRadius: 2, alignSelf: "center" }} />
        <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 14.5, fontWeight: 600, margin: 0 }}>Counsellors</h3>
        <span style={{ fontSize: 11.5, color: C.faint }}>bookings, attendance and COEs by person</span>
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 520 }}>
            <thead>
              <tr style={{ background: C.wash }}>
                <th style={{ ...th, textAlign: "left", paddingLeft: 16, minWidth: 130 }}>Counsellor</th>
                {cols.map((c) => <th key={c.id} style={{ ...th, minWidth: 88 }}>{c.label}</th>)}
                <th style={{ ...th, minWidth: 88, color: C.faint }}>Show rate</th>
              </tr>
            </thead>
            <tbody>
              {COUNSELLORS.map((p) => {
                const r = week.counsellors?.[p.id] || {};
                const b = num(r.booked), sh = num(r.show);
                return (
                  <tr key={p.id} className="rowHover">
                    <td style={{ ...td, textAlign: "left", paddingLeft: 16 }}>
                      <div style={{ fontSize: 13 }}>{p.name}</div>
                      <div style={{ fontSize: 9.5, color: TEAM_COLOR[p.team], fontFamily: "'IBM Plex Mono',monospace", letterSpacing: ".08em", textTransform: "uppercase" }}>{p.team}</div>
                    </td>
                    {cols.map((c) => (
                      <td key={c.id} style={{ ...td, padding: 0 }}>
                        <input className="cellInput" inputMode="numeric" placeholder="0" value={r[c.id] ?? ""} onChange={(e) => onStaff(p.id, c.id, e.target.value)} />
                      </td>
                    ))}
                    <td style={{ ...td, fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: C.muted }}>{pctf(div(sh, b))}</td>
                  </tr>
                );
              })}
              <tr style={{ background: C.wash, borderTop: `2px solid ${C.ink}` }}>
                <td style={{ ...td, textAlign: "left", paddingLeft: 16, fontWeight: 600 }}>Total</td>
                {cols.map((c) => <td key={c.id} style={{ ...td, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 600, fontSize: 12.5 }}>{nf(tot[c.id])}</td>)}
                <td style={{ ...td, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 600, fontSize: 12.5 }}>{pctf(div(tot.show, tot.booked))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
      <p style={{ fontSize: 11.5, color: C.faint, margin: 0, lineHeight: 1.6 }}>
        Bookings and COEs for 5 Apr – 19 Jul are backfilled from your WBR sheet. Show is blank for those
        weeks because the source never recorded attendance per counsellor \u2014 fill it in going forward and
        show rate starts working.
      </p>
    </div>
  );
}

/* ================================================================== *
 *  REVIEW
 * ================================================================== */
function ReviewView({ wk, prevKey, week, prev, cur, prv }) {
  const stages = [
    { id: "leads", label: "Leads" },
    { id: "booked", label: "Booked" },
    { id: "show", label: "Show" },
    { id: "paid", label: "Paid Bookings" },
    { id: "coes", label: "COEs" },
  ];
  const maxStage = Math.max(1, ...stages.map((s) => cur[s.id] || 0));

  const cards = [
    ["Leads", cur.leads, prv.leads, "int", false],
    ["Amount Spend", cur.spend, prv.spend, "money", true],
    ["Payment", cur.payment, prv.payment, "money", false],
    ["Booked", cur.booked, prv.booked, "int", false],
    ["Show", cur.show, prv.show, "int", false],
    ["Paid Bookings", cur.paid, prv.paid, "int", false],
    ["COEs", cur.coes, prv.coes, "int", false],
    ["CPL", cur.cpl, prv.cpl, "money", true],
    ["Cost / Booked", cur.cpb, prv.cpb, "money", true],
  ];

  const byOwner = OWNERS.map((o) => {
    const ch = CHANNELS.filter((c) => c.owner === o.id);
    return { owner: o, cur: rates(rollup(week, ch)), prv: rates(rollup(prev, ch)), n: ch.length };
  });
  const byPlatform = ["Paid", "Organic"].map((p) => {
    const ch = CHANNELS.filter((c) => c.platform === p);
    return { platform: p, cur: rates(rollup(week, ch)) };
  });

  const movers = CHANNELS.map((c) => ({
    name: c.name,
    delta: num(week?.channels?.[c.id]?.leads) - num(prev?.channels?.[c.id]?.leads),
  })).sort((a, b) => b.delta - a.delta);
  const gains = movers.filter((m) => m.delta > 0).slice(0, 3);
  const drops = movers.filter((m) => m.delta < 0).slice(-3).reverse();

  const unownedShare = div(byOwner.find((b) => b.owner.id === "none").cur.leads, cur.leads);
  const flags = [];
  if (cur.leads === 0) flags.push(["Nothing logged for this week yet.", "info"]);
  else {
    flags.push(unownedShare > 0.25
      ? [`${pctf(unownedShare, 0)} of leads sit outside every team lead. That is an attribution gap, not channel performance.`, "warn"]
      : [`${pctf(unownedShare, 0)} of leads are unowned. Within tolerance.`, "ok"]);
    flags.push(cur.showRate > 0 && cur.showRate < 0.6
      ? [`Show rate is ${pctf(cur.showRate, 0)}. More than a third of booked appointments did not attend — that is a confirmation and reminder problem, not a lead problem.`, "warn"]
      : [`Show rate is ${pctf(cur.showRate, 0)} on ${nf(cur.booked)} bookings.`, "ok"]);
    const org = byPlatform.find((b) => b.platform === "Organic").cur;
    if (org.leads > 0)
      flags.push([`Organic produced ${nf(org.leads)} leads at no media spend, against ${nf(cur.leads - org.leads)} from Meta. Cost per lead only exists on the paid side, so judge the two against each other on booking and show rate, not on CPL.`, "ok"]);
    const untracked = FUNNEL.filter((f) => cur[f] === 0);
    if (untracked.length && cur.leads > 0)
      flags.push([`Nothing entered yet for ${untracked.map((f) => FIELDS[f].label.toLowerCase()).join(", ")}. The funnel stops early until those are filled in.`, "info"]);
    if (prevKey) {
      const d = growth(cur.cpl, prv.cpl);
      if (Number.isFinite(d))
        flags.push(d > 0.1
          ? [`CPL rose ${pctf(d, 0)} while leads moved ${pctf(growth(cur.leads, prv.leads), 0)}. Cost efficiency is going the wrong way.`, "warn"]
          : [`CPL moved ${pctf(d, 0)} against leads ${pctf(growth(cur.leads, prv.leads), 0)}.`, "ok"]);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <SectionHead n="A" title="The funnel" note={prevKey ? `week ending ${weekLong(wk)}` : "no prior week yet"} />
      <Card>
        <div style={{ display: "grid", gap: 3 }}>
          {stages.map((s, i) => {
            const v = cur[s.id];
            const prevV = i === 0 ? null : cur[stages[i - 1].id];
            const conv = prevV ? div(v, prevV) : null;
            const w = Math.max(2, (v / maxStage) * 100);
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 104, fontSize: 12, color: C.muted, flexShrink: 0 }}>{s.label}</span>
                <div style={{ flex: 1, minWidth: 60, background: C.wash, borderRadius: 2, height: 26, position: "relative", overflow: "hidden" }}>
                  {v > 0 && <div style={{ width: `${w}%`, height: "100%", background: [C.ink, C.navy, C.pine, "#4C7C5E", C.ochre][i], opacity: 0.86, borderRadius: 2 }} />}
                  <span style={{ position: "absolute", left: 9, top: 5, fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, color: v === 0 ? C.faint : w > 22 ? "#fff" : C.ink, fontWeight: 500 }}>
                    {v > 0 ? nf(v) : "not tracked"}
                  </span>
                </div>
                <span style={{ width: 74, textAlign: "right", fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: C.muted, flexShrink: 0 }}>
                  {conv != null && v > 0 ? pctf(conv, 0) : ""}
                </span>
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: 11.5, color: C.faint, margin: "12px 0 0" }}>
          Right-hand figure is conversion from the stage above. A stage marked "not tracked" has no source in
          your sheet yet — fill it in on the Enter tab and the funnel completes itself.
        </p>
      </Card>

      <SectionHead n="B" title="Headline" note={prevKey ? `vs ${weekLabel(prevKey)}` : "no comparison available"} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 10 }}>
        {cards.map(([label, a, b, kind, inv]) => (
          <Card key={label} style={{ padding: 14 }}>
            <Eyebrow>{label}</Eyebrow>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 21, fontWeight: 500, marginTop: 5, letterSpacing: "-.02em" }}>
              {show(a, kind)}
            </div>
            <div style={{ fontSize: 11.5, marginTop: 4 }}>
              {prevKey ? <Delta v={growth(a, b)} invert={inv} /> : <span style={{ color: C.faint }}>—</span>}
            </div>
          </Card>
        ))}
      </div>

      <SectionHead n="C" title="Owner scorecard" note="who is accountable for what" />
      <Card style={{ padding: 0, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
          <thead>
            <tr style={{ background: C.wash }}>
              {["Owner", "Ch.", "Leads", "Spend", "Payment", "Booked", "Show", "COEs", "CPL", "Book %", "Show %", "Leads Δ"].map((h, i) => (
                <th key={h} style={{ ...th, textAlign: i === 0 ? "left" : "right", paddingLeft: i === 0 ? 16 : 8 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {byOwner.map((b) => (
              <tr key={b.owner.id} style={b.owner.id === "none" ? { background: "#FCF7EC" } : undefined}>
                <td style={{ ...td, textAlign: "left", paddingLeft: 16 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 3, height: 13, background: b.owner.color, borderRadius: 2 }} />
                    <span style={{ fontWeight: 600, fontSize: 12.5 }}>{b.owner.name}</span>
                  </span>
                </td>
                <Mono dim>{b.n}</Mono>
                <Mono>{nf(b.cur.leads)}</Mono>
                <Mono>{money(b.cur.spend)}</Mono>
                <Mono>{money(b.cur.payment)}</Mono>
                <Mono>{nf(b.cur.booked)}</Mono>
                <Mono>{nf(b.cur.show)}</Mono>
                <Mono>{nf(b.cur.coes)}</Mono>
                <Mono>{money(b.cur.cpl, 2)}</Mono>
                <Mono dim>{pctf(b.cur.bookRate, 0)}</Mono>
                <Mono dim>{pctf(b.cur.showRate, 0)}</Mono>
                <td style={{ ...td, fontSize: 11.5 }}>{prevKey ? <Delta v={growth(b.cur.leads, b.prv.leads)} /> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <SectionHead n="D" title="Platform split" note="Organic vs Paid" />
      <Card style={{ padding: 0, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
          <thead>
            <tr style={{ background: C.wash }}>
              {["Platform", "Leads", "Share", "Spend", "Payment", "CPL", "Booked", "Show", "COEs"].map((h, i) => (
                <th key={h} style={{ ...th, textAlign: i === 0 ? "left" : "right", paddingLeft: i === 0 ? 16 : 8 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {byPlatform.map((p) => (
              <tr key={p.platform}>
                <td style={{ ...td, textAlign: "left", paddingLeft: 16, fontWeight: 600 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 8, background: p.platform === "Paid" ? C.navy : C.pine }} />
                    {p.platform === "Paid" ? "Paid Media" : "Organic"}
                  </span>
                </td>
                <Mono>{nf(p.cur.leads)}</Mono>
                <Mono dim>{pctf(div(p.cur.leads, cur.leads), 0)}</Mono>
                <Mono>{money(p.cur.spend)}</Mono>
                <Mono>{money(p.cur.payment)}</Mono>
                <Mono>{money(p.cur.cpl, 2)}</Mono>
                <Mono>{nf(p.cur.booked)}</Mono>
                <Mono>{nf(p.cur.show)}</Mono>
                <Mono>{nf(p.cur.coes)}</Mono>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {prevKey && (
        <>
          <SectionHead n="E" title="Movers" note="biggest lead swings vs last week" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 10 }}>
            <MoverCard title="Gained" rows={gains} sign="+" color={C.up} />
            <MoverCard title="Dropped" rows={drops} sign="" color={C.down} />
          </div>
        </>
      )}

      <SectionHead n="F" title="Watch-outs" note="calculated, not typed" />
      <div style={{ display: "grid", gap: 7 }}>
        {flags.map(([t, kind], i) => (
          <div key={i} style={{
            display: "flex", gap: 11, alignItems: "flex-start",
            background: kind === "warn" ? "#FCF7EC" : C.card,
            border: `1px solid ${kind === "warn" ? "#EBDCC0" : C.rule}`,
            borderLeft: `3px solid ${kind === "warn" ? C.ochre : kind === "ok" ? C.pine : C.rule}`,
            borderRadius: 2, padding: "11px 13px", fontSize: 12.5, lineHeight: 1.55,
          }}>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: kind === "warn" ? C.ochre : C.pine, letterSpacing: ".1em", paddingTop: 2, flexShrink: 0 }}>
              {kind === "warn" ? "REVIEW" : kind === "ok" ? "OK" : "—"}
            </span>
            <span>{t}</span>
          </div>
        ))}
      </div>

      {week?.note && (
        <Card style={{ borderLeft: `3px solid ${C.navy}` }}>
          <Eyebrow>Note on {weekLabel(wk)}</Eyebrow>
          <div style={{ marginTop: 6, fontSize: 13.5, lineHeight: 1.6 }}>{week.note}</div>
        </Card>
      )}
    </div>
  );
}

function MoverCard({ title, rows, sign, color }) {
  return (
    <Card>
      <Eyebrow>{title}</Eyebrow>
      <div style={{ marginTop: 9, display: "grid", gap: 7 }}>
        {rows.length === 0 && <div style={{ fontSize: 12.5, color: C.faint }}>No channel moved this way.</div>}
        {rows.map((r) => (
          <div key={r.name} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <span style={{ fontSize: 13 }}>{r.name}</span>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, color, fontWeight: 500 }}>{sign}{nf(r.delta)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ================================================================== *
 *  COUNSELLORS
 * ================================================================== */
function TeamView({ week, order, weeks }) {
  const rows = COUNSELLORS.map((p) => {
    const r = week.counsellors?.[p.id] || {};
    const b = num(r.booked), sh = num(r.show), co = num(r.coes);
    return { ...p, booked: b, show: sh, coes: co, showRate: div(sh, b) };
  });
  const tot = rows.reduce((a, r) => ({ booked: a.booked + r.booked, show: a.show + r.show, coes: a.coes + r.coes }), { booked: 0, show: 0, coes: 0 });
  const teamShowRate = div(tot.show, tot.booked);
  const anyShow = tot.show > 0;

  const teams = ["Visa", "Career", "Education"].map((t) => {
    const g = rows.filter((r) => r.team === t);
    const b = g.reduce((a, r) => a + r.booked, 0);
    const sh = g.reduce((a, r) => a + r.show, 0);
    const co = g.reduce((a, r) => a + r.coes, 0);
    return { team: t, booked: b, show: sh, coes: co, showRate: div(sh, b), people: g.length };
  }).filter((t) => t.people > 0);

  const trend = order.map((k) => {
    const row = { week: weekLabel(k) };
    COUNSELLORS.forEach((p) => (row[p.name] = num(weeks[k]?.counsellors?.[p.id]?.booked)));
    return row;
  });
  const anyTrend = trend.some((r) => COUNSELLORS.some((p) => r[p.name] > 0));
  const chart = rows.filter((r) => r.booked > 0 || r.coes > 0)
    .map((r) => ({ name: r.name, Bookings: r.booked, COEs: r.coes, team: r.team }));

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <SectionHead n="A" title="This week by counsellor" note={anyShow ? `team show rate ${pctf(teamShowRate, 0)}` : "attendance not recorded this week"} />
      <Card style={{ padding: 0, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
          <thead>
            <tr style={{ background: C.wash }}>
              {["Counsellor", "Team", "Bookings", "Show", "COEs", "Show rate", "vs team"].map((h, i2) => (
                <th key={h} style={{ ...th, textAlign: i2 < 2 ? "left" : "right", paddingLeft: i2 === 0 ? 16 : 8 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const gap = r.booked > 0 && r.show > 0 ? r.showRate - teamShowRate : null;
              return (
                <tr key={r.id} className="rowHover">
                  <td style={{ ...td, textAlign: "left", paddingLeft: 16, fontSize: 13, fontWeight: 500 }}>{r.name}</td>
                  <td style={{ ...td, textAlign: "left" }}>
                    <span style={{ fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: ".08em", textTransform: "uppercase", color: TEAM_COLOR[r.team] }}>{r.team}</span>
                  </td>
                  <Mono>{nf(r.booked)}</Mono>
                  <Mono dim>{r.show ? nf(r.show) : "\u2014"}</Mono>
                  <Mono>{r.coes ? nf(r.coes) : "\u2014"}</Mono>
                  <Mono>{r.show ? pctf(r.showRate, 0) : "\u2014"}</Mono>
                  <td style={{ ...td, fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: gap == null ? C.faint : gap >= 0 ? C.up : C.down }}>
                    {gap == null ? "\u2014" : `${gap >= 0 ? "+" : ""}${(gap * 100).toFixed(0)}pp`}
                  </td>
                </tr>
              );
            })}
            <tr style={{ background: C.wash, borderTop: `2px solid ${C.ink}` }}>
              <td style={{ ...td, textAlign: "left", paddingLeft: 16, fontWeight: 600 }} colSpan={2}>All counsellors</td>
              <Mono>{nf(tot.booked)}</Mono>
              <Mono>{tot.show ? nf(tot.show) : "\u2014"}</Mono>
              <Mono>{nf(tot.coes)}</Mono>
              <Mono>{anyShow ? pctf(teamShowRate, 0) : "\u2014"}</Mono>
              <td style={{ ...td }} />
            </tr>
          </tbody>
        </table>
      </Card>
      <p style={{ fontSize: 11.5, color: C.faint, margin: 0, lineHeight: 1.6 }}>
        "vs team" is percentage points above or below the all-counsellor show rate this week. On one week it is
        mostly noise \u2014 a single no-show swings a small book badly. Read it across four weeks before acting on it.
      </p>

      <SectionHead n="B" title="By practice area" note="visa \u00b7 career \u00b7 education" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
        {teams.map((t) => (
          <Card key={t.team} style={{ borderTop: `3px solid ${TEAM_COLOR[t.team]}` }}>
            <Eyebrow>{t.team}</Eyebrow>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 24, fontWeight: 500 }}>{nf(t.booked)}</span>
              <span style={{ fontSize: 11.5, color: C.muted }}>bookings</span>
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
              {nf(t.coes)} COEs{t.show ? <> \u00b7 <span style={{ color: t.showRate >= teamShowRate ? C.up : C.down, fontFamily: "'IBM Plex Mono',monospace" }}>{pctf(t.showRate, 0)}</span> show</> : null}
            </div>
          </Card>
        ))}
      </div>

      {chart.length > 0 && (
        <>
          <SectionHead n="C" title="Bookings and COEs" note="this week" />
          <Card>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={chart} margin={{ top: 6, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid stroke={C.rule} strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="name" tick={axTick} axisLine={{ stroke: C.rule }} tickLine={false} />
                <YAxis tick={axTick} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tipStyle} />
                <Legend wrapperStyle={legendStyle} />
                <Bar dataKey="Bookings" fill={C.plum} fillOpacity={0.28} radius={[2, 2, 0, 0]} />
                <Bar dataKey="COEs" fill={C.plum} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}

      {anyTrend && (
        <>
          <SectionHead n="D" title="Bookings over time" note="per counsellor" />
          <Card>
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={trend} margin={{ top: 6, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid stroke={C.rule} strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="week" tick={axTick} axisLine={{ stroke: C.rule }} tickLine={false} />
                <YAxis tick={axTick} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tipStyle} />
                <Legend wrapperStyle={legendStyle} />
                {COUNSELLORS.map((p, i2) => (
                  <Line key={p.id} type="monotone" dataKey={p.name} stroke={TEAM_COLOR[p.team]} strokeOpacity={0.45 + (i2 % 3) * 0.27} strokeWidth={1.6} dot={{ r: 1.8 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}
    </div>
  );
}

/* ================================================================== *
 *  TRENDS
 * ================================================================== */
const axTick = { fontSize: 10.5, fill: C.muted, fontFamily: "'IBM Plex Mono',monospace" };
const tipStyle = { border: `1px solid ${C.rule}`, borderRadius: 2, fontSize: 12, fontFamily: "'IBM Plex Sans',sans-serif", boxShadow: "0 2px 8px rgba(0,0,0,.06)" };
const legendStyle = { fontSize: 11.5, fontFamily: "'IBM Plex Sans',sans-serif" };

function TrendsView({ order, weeks }) {
  const rows = order.map((k) => {
    const t = rates(rollup(weeks[k], CHANNELS));
    const r = {
      week: weekLabel(k), Leads: t.leads, Spend: Math.round(t.spend), Payment: Math.round(t.payment), CPL: Math.round(t.cpl),
      Booked: t.booked, Show: t.show, "Paid Bookings": t.paid, COEs: t.coes,
      "Booking rate": +(t.bookRate * 100).toFixed(1), "Show rate": +(t.showRate * 100).toFixed(1),
    };
    ["Paid", "Organic"].forEach((p) => (r[p] = rollup(weeks[k], CHANNELS.filter((c) => c.platform === p)).leads));
    OWNERS.forEach((o) => (r[o.short] = rollup(weeks[k], CHANNELS.filter((c) => c.owner === o.id)).leads));
    return r;
  });
  if (!rows.some((r) => r.Leads > 0 || r.Spend > 0 || r.Booked > 0))
    return <Empty title="No weeks logged yet" body="Enter one week of numbers and every chart builds itself." />;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <SectionHead n="A" title="Leads, spend and payment" note="every week logged" />
      <Card>
        <ResponsiveContainer width="100%" height={230}>
          <LineChart data={rows} margin={{ top: 6, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid stroke={C.rule} strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="week" tick={axTick} axisLine={{ stroke: C.rule }} tickLine={false} />
            <YAxis yAxisId="l" tick={axTick} axisLine={false} tickLine={false} />
            <YAxis yAxisId="r" orientation="right" tick={axTick} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tipStyle} />
            <Legend wrapperStyle={legendStyle} />
            <Line yAxisId="l" type="monotone" dataKey="Leads" stroke={C.ink} strokeWidth={2} dot={{ r: 2.5 }} />
            <Line yAxisId="r" type="monotone" dataKey="Spend" stroke={C.navy} strokeWidth={1.6} dot={{ r: 2 }} strokeDasharray="4 3" />
            <Line yAxisId="r" type="monotone" dataKey="Payment" stroke={C.pine} strokeWidth={1.6} dot={{ r: 2 }} strokeDasharray="1 3" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <SectionHead n="B" title="Funnel stages" note="leads through to COEs" />
      <Card>
        <ResponsiveContainer width="100%" height={230}>
          <LineChart data={rows} margin={{ top: 6, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid stroke={C.rule} strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="week" tick={axTick} axisLine={{ stroke: C.rule }} tickLine={false} />
            <YAxis tick={axTick} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tipStyle} />
            <Legend wrapperStyle={legendStyle} />
            {[["Leads", C.ink], ["Booked", C.navy], ["Show", C.pine], ["COEs", C.ochre]].map(([k, col]) => (
              <Line key={k} type="monotone" dataKey={k} stroke={col} strokeWidth={1.7} dot={{ r: 2 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <SectionHead n="C" title="Booking and show rate" note="percent" />
      <Card>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={rows} margin={{ top: 6, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid stroke={C.rule} strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="week" tick={axTick} axisLine={{ stroke: C.rule }} tickLine={false} />
            <YAxis tick={axTick} axisLine={false} tickLine={false} unit="%" />
            <Tooltip contentStyle={tipStyle} />
            <Legend wrapperStyle={legendStyle} />
            <Line type="monotone" dataKey="Booking rate" stroke={C.navy} strokeWidth={1.8} dot={{ r: 2 }} />
            <Line type="monotone" dataKey="Show rate" stroke={C.plum} strokeWidth={1.8} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <SectionHead n="D" title="Organic vs Paid" note="leads, stacked" />
      <Card>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={rows} margin={{ top: 6, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid stroke={C.rule} strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="week" tick={axTick} axisLine={{ stroke: C.rule }} tickLine={false} />
            <YAxis tick={axTick} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tipStyle} />
            <Legend wrapperStyle={legendStyle} />
            <Area type="monotone" dataKey="Organic" stackId="1" stroke={C.pine} fill={C.pine} fillOpacity={0.18} />
            <Area type="monotone" dataKey="Paid" stackId="1" stroke={C.navy} fill={C.navy} fillOpacity={0.18} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <SectionHead n="E" title="Cost per lead" note="the efficiency line" />
      <Card>
        <ResponsiveContainer width="100%" height={190}>
          <LineChart data={rows} margin={{ top: 6, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid stroke={C.rule} strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="week" tick={axTick} axisLine={{ stroke: C.rule }} tickLine={false} />
            <YAxis tick={axTick} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tipStyle} />
            <Line type="monotone" dataKey="CPL" stroke={C.ochre} strokeWidth={2} dot={{ r: 2.5 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

/* ================================================================== *
 *  SEASONALITY
 * ================================================================== */
function SeasonView({ series, weeks }) {
  const live = series.filter((s) => s.filled);
  const n = live.length;
  const { trend, ratio } = useMemo(() => decompose(live), [live]);
  const runData = live.map((s, i) => ({ week: s.label, Actual: s.totals.leads, Trend: trend[i] ? Math.round(trend[i]) : null }));
  const womIdx = useMemo(() => indexBy(live, ratio, (s) => weekOfMonth(s.key), 2), [live, ratio]);
  const monIdx = useMemo(() => indexBy(live, ratio, (s) => fromISO(s.key).getMonth(), 2), [live, ratio]);
  const womData = [1, 2, 3, 4, 5].filter((w) => womIdx[w]).map((w) => ({ label: `Week ${w}`, index: Math.round(womIdx[w].index), n: womIdx[w].n }));
  const monData = MONTHS.map((m, i) => (monIdx[i] ? { label: m, index: Math.round(monIdx[i].index), n: monIdx[i].n } : null)).filter(Boolean);

  const vol = CHANNELS.map((c) => {
    const vals = live.map((s) => num(weeks[s.key]?.channels?.[c.id]?.leads));
    const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    return { name: c.name, owner: c.owner, mean, cv: mean ? stdev(vals) / mean : 0 };
  }).filter((v) => v.mean > 0).sort((a, b) => b.cv - a.cv);

  const tagged = live.filter((s) => s.excluded).length;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Gate n={n} tagged={tagged} />
      <SectionHead n="A" title="Run chart" note="actual leads against their own 4-week trend" />
      {n < 3 ? <Empty title="Needs at least 3 weeks" body="A run chart needs something to run across." /> : (
        <Card>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={runData} margin={{ top: 6, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid stroke={C.rule} strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="week" tick={axTick} axisLine={{ stroke: C.rule }} tickLine={false} />
              <YAxis tick={axTick} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tipStyle} />
              <Legend wrapperStyle={legendStyle} />
              <Line type="monotone" dataKey="Actual" stroke={C.ink} strokeWidth={2} dot={{ r: 2.5 }} />
              <Line type="monotone" dataKey="Trend" stroke={C.ochre} strokeWidth={1.6} strokeDasharray="5 4" dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 11.5, color: C.faint, margin: "8px 0 0", lineHeight: 1.6 }}>
            Dashed line is the centred 4-week moving average. Where actual sits above it, that week ran hot for
            reasons the trend does not explain — which is what seasonality looks like before you have enough weeks to name it.
          </p>
        </Card>
      )}

      <SectionHead n="B" title="Week-of-month pattern" note="index — 100 is an average week" />
      {womData.length < 3
        ? <Locked need={12} have={n} what="a week-of-month pattern" why="Each of weeks 1 to 4 needs to appear at least twice with a trend around it. That takes about three months." />
        : <Card>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={womData} margin={{ top: 6, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid stroke={C.rule} strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="label" tick={axTick} axisLine={{ stroke: C.rule }} tickLine={false} />
                <YAxis tick={axTick} axisLine={false} tickLine={false} domain={[0, "dataMax + 20"]} />
                <Tooltip contentStyle={tipStyle} />
                <ReferenceLine y={100} stroke={C.ink} strokeDasharray="3 3" />
                <Bar dataKey="index" radius={[2, 2, 0, 0]}>
                  {womData.map((d, i) => <Cell key={i} fill={d.index >= 100 ? C.pine : C.ochre} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <Reading data={womData} unit="week of the month" />
          </Card>}

      <SectionHead n="C" title="Month pattern" note="intake seasonality" />
      {monData.length < 4
        ? <Locked need={26} have={n} what="a month-of-year pattern" why="Every month needs at least two logged weeks before its average means anything. Six months in, this starts to be worth reading — and for an education business it is the chart that matters most, because intake cycles drive everything." />
        : <Card>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={monData} margin={{ top: 6, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid stroke={C.rule} strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="label" tick={axTick} axisLine={{ stroke: C.rule }} tickLine={false} />
                <YAxis tick={axTick} axisLine={false} tickLine={false} domain={[0, "dataMax + 20"]} />
                <Tooltip contentStyle={tipStyle} />
                <ReferenceLine y={100} stroke={C.ink} strokeDasharray="3 3" />
                <Bar dataKey="index" radius={[2, 2, 0, 0]}>
                  {monData.map((d, i) => <Cell key={i} fill={d.index >= 100 ? C.pine : C.ochre} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <Reading data={monData} unit="month" />
          </Card>}

      <SectionHead n="D" title="Channel steadiness" note="how much each source swings week to week" />
      {n < 4
        ? <Locked need={4} have={n} what="steadiness scoring" why="Swing needs at least four weeks to be distinguishable from noise." />
        : <Card style={{ padding: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.wash }}>
                  {["Channel", "Avg leads / wk", "Swing", ""].map((h, i) => (
                    <th key={h + i} style={{ ...th, textAlign: i === 0 || i === 3 ? "left" : "right", paddingLeft: i === 0 ? 16 : 8 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vol.map((v) => {
                  const o = OWNERS.find((x) => x.id === v.owner);
                  const w = Math.min(100, v.cv * 100);
                  return (
                    <tr key={v.name}>
                      <td style={{ ...td, textAlign: "left", paddingLeft: 16 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                          <span style={{ width: 3, height: 12, background: o.color, borderRadius: 2 }} />
                          <span style={{ fontSize: 12.5 }}>{v.name}</span>
                        </span>
                      </td>
                      <Mono>{nf(v.mean, 1)}</Mono>
                      <Mono dim>{pctf(v.cv, 0)}</Mono>
                      <td style={{ ...td, width: "34%" }}>
                        <div style={{ height: 5, background: C.wash, borderRadius: 3 }}>
                          <div style={{ height: 5, width: `${w}%`, background: w > 50 ? C.ochre : "#B7BEB8", borderRadius: 3 }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p style={{ fontSize: 11.5, color: C.faint, margin: 0, padding: "10px 16px 14px", lineHeight: 1.6 }}>
              Swing is the week-to-week standard deviation as a share of the average. Anything above 50% is too noisy
              to judge on one week — report it as a 4-week average or you will keep congratulating and scolding the
              same person for randomness.
            </p>
          </Card>}
    </div>
  );
}

function Gate({ n, tagged }) {
  const steps = [{ at: 3, label: "Run chart" }, { at: 5, label: "Trend line" }, { at: 12, label: "Week-of-month" }, { at: 26, label: "Month pattern" }];
  const next = steps.find((s) => n < s.at);
  return (
    <Card>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <Eyebrow>Weeks logged</Eyebrow>
          <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginTop: 3 }}>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 30, fontWeight: 500, letterSpacing: "-.03em" }}>{n}</span>
            <span style={{ fontSize: 12.5, color: C.muted }}>{next ? `${next.at - n} more until ${next.label.toLowerCase()} unlocks` : "full pattern detection is on"}</span>
          </div>
          {tagged > 0 && <div style={{ fontSize: 11.5, color: C.ochre, marginTop: 5 }}>{tagged} tagged {tagged === 1 ? "week is" : "weeks are"} held out of the baseline.</div>}
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "flex-end" }}>
          {steps.map((s) => {
            const on = n >= s.at;
            return (
              <div key={s.at} style={{ textAlign: "center", minWidth: 74 }}>
                <div style={{ height: 3, background: on ? C.ink : C.rule, borderRadius: 2, marginBottom: 5 }} />
                <div style={{ fontSize: 10, color: on ? C.ink : C.faint, fontFamily: "'IBM Plex Mono',monospace" }}>{s.label}</div>
                <div style={{ fontSize: 9, color: C.faint, fontFamily: "'IBM Plex Mono',monospace" }}>{s.at} wk</div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
function Locked({ need, have, what, why }) {
  return (
    <Card style={{ borderStyle: "dashed" }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 5 }}>Not enough weeks for {what} yet</div>
      <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.6, maxWidth: 640 }}>{why}</div>
      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 11 }}>
        <div style={{ flex: 1, height: 4, background: C.wash, borderRadius: 3, maxWidth: 320 }}>
          <div style={{ height: 4, width: `${Math.min(100, (have / need) * 100)}%`, background: C.ink, borderRadius: 3 }} />
        </div>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, color: C.muted }}>{have} / {need} weeks</span>
      </div>
    </Card>
  );
}
function Reading({ data, unit }) {
  const hi = data.reduce((a, b) => (b.index > a.index ? b : a));
  const lo = data.reduce((a, b) => (b.index < a.index ? b : a));
  const spread = hi.index - lo.index;
  return (
    <p style={{ fontSize: 12.5, margin: "10px 0 0", lineHeight: 1.65 }}>
      {spread < 15
        ? <>The spread between your strongest and weakest {unit} is only {spread} points. That sits inside normal noise — do not plan around it yet.</>
        : <><strong>{hi.label}</strong> runs about {hi.index - 100}% above an average week and <strong>{lo.label}</strong> about {100 - lo.index}% below. Budget, ad flighting and counsellor rosters should follow that shape, not a flat split.</>}
      {" "}<span style={{ color: C.faint }}>Based on {data.reduce((a, b) => a + b.n, 0)} observations.</span>
    </p>
  );
}

/* ================================================================== *
 *  CSV
 * ================================================================== */
function exportCSV(order, weeks) {
  const fieldIds = Object.keys(FIELDS);
  const lines = ["CHANNELS"];
  lines.push(["Week ending", "Week", "Tag", "Platform", "Channel", "Owner", ...fieldIds.map((f) => FIELDS[f].label)].join(","));
  order.forEach((k) => CHANNELS.forEach((c) => {
    const g = groupOf(c.group), row = weeks[k]?.channels?.[c.id] || {};
    lines.push([k, weekLabel(k), `"${weeks[k]?.tag || ""}"`, c.platform, `"${c.name}"`,
      `"${OWNERS.find((o) => o.id === c.owner).name}"`,
      ...fieldIds.map((f) => (g.inputs.includes(f) ? num(row[f]) : ""))].join(","));
  }));
  lines.push("", "COUNSELLORS");
  lines.push(["Week ending", "Week", "Counsellor", "Team", "Bookings", "Show", "COEs"].join(","));
  order.forEach((k) => COUNSELLORS.forEach((p) => {
    const r = weeks[k]?.counsellors?.[p.id] || {};
    lines.push([k, weekLabel(k), p.name, p.team, num(r.booked), num(r.show), num(r.coes)].join(","));
  }));
  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url; a.download = "weekly-marketing-ledger.csv"; a.click();
  URL.revokeObjectURL(url);
}

/* ================================================================== *
 *  BOUNDARY
 * ================================================================== */
class Boundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (this.state.err)
      return (
        <div style={{ ...shellStyle, padding: 40 }}>
          <Fonts />
          <div style={{ maxWidth: 560 }}>
            <Eyebrow>Something broke while drawing the ledger</Eyebrow>
            <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 18, margin: "8px 0 10px" }}>Your saved weeks are still there</h2>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.65 }}>Reload to try again. If it keeps happening, send me this line:</p>
            <pre style={{ background: C.wash, border: `1px solid ${C.rule}`, borderRadius: 2, padding: 11, fontSize: 11.5, fontFamily: "'IBM Plex Mono',monospace", whiteSpace: "pre-wrap", color: C.down }}>
              {String(this.state.err)}
            </pre>
          </div>
        </div>
      );
    return this.props.children;
  }
}

export default function App() {
  return <Boundary><Ledger /></Boundary>;
}

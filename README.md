# Weekly Marketing Ledger

Weekly lead-to-COE reporting across Organic and Paid, with counsellor performance
and seasonality that unlocks as weeks accumulate.

---

## Run it locally first

You need Node 18 or newer.

```bash
npm install
npm run dev
```

Open the URL it prints (usually http://localhost:5173). Enter a week of numbers and
confirm it still shows them after a refresh. If that works, deploy.

---

## Deploy to Vercel

### Option 1 — dashboard (no CLI)

1. Push this folder to a new GitHub repository.
2. Go to vercel.com → **Add New** → **Project** → import that repository.
3. Vercel detects Vite on its own. Leave every build setting alone:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
4. Click **Deploy**. First build takes about a minute.

### Option 2 — CLI

```bash
npm i -g vercel
vercel          # preview deployment
vercel --prod   # production
```

Answer the prompts with the defaults. It links the folder to a project and deploys.

---

## Where the data lives — read this before sharing the link

By default the ledger saves to **`localStorage` in whichever browser you used**.
That means:

- Your numbers never leave your machine.
- Nobody else sees them. If you send a team lead the URL, they get an empty ledger.
- Clearing site data, or switching to another browser or device, loses everything.

For a single analyst keeping their own working file, that is fine. Export CSV each
week as a backup.

### Making it shared

If team leads need to see the same numbers, switch to server storage:

1. Vercel dashboard → your project → **Storage** → **Create Database** → **KV**.
2. Connect it to the project. Vercel injects the `KV_*` environment variables.
3. **Settings → Environment Variables** → add `VITE_STORAGE_MODE` = `api`.
4. Redeploy.

`api/ledger.js` then handles reads and writes, and `src/storage.js` routes through it.
Local storage stays on as an offline fallback, so a dropped connection doesn't lose
the week you are typing.

**The API route has no authentication.** Anyone with the URL can read and overwrite
your numbers. Before real data goes in, turn on **Settings → Deployment Protection →
Vercel Authentication**, which restricts the site to your Vercel team. Other options
are Cloudflare Access or a shared password check inside `api/ledger.js`.

---

## Project structure

```
index.html          fonts + mount point
vite.config.js      Vite + React plugin
src/main.jsx        React root
src/App.jsx         the entire ledger (one file)
src/storage.js      swap point: browser-local vs shared API
api/ledger.js       serverless read/write, only used in api mode
```

## Changing the setup

Everything configurable sits in the first 120 lines of `src/App.jsx`:

- `CHANNELS` — add or remove a lead source, and set its platform, owner and group
- `COUNSELLORS` — add or remove people, and set their practice area
- `OWNERS` — rename team leads
- `GROUPS` — change which fields each channel group collects
- `FIELDS` / `DERIVED` — add a new metric, or change how a rate is calculated

Adding a channel to `CHANNELS` makes it appear in entry, review, trends and
seasonality automatically. Weeks logged before the change keep working; the new
channel simply reads as zero for them.

## Custom domain

Project → **Settings** → **Domains** → add your domain and follow the DNS
instructions. Vercel issues the certificate.

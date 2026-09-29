# Full website online (data + login)

GitHub Pages **only shows the UI shell** unless a **live API + MySQL** is connected.

## Option A — One link on Render (recommended for FYP demo)

1. Create a **free MySQL** database (any host that gives you `DB_HOST`, `DB_USER`, `DB_PASSWORD`).
2. Import **`xamp-database/nayab_sms.sql`** in phpMyAdmin / MySQL client.
3. Open [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint** → connect repo `NayabSchool`.
4. Set environment variables when asked:
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD` (from step 1)
   - `DB_NAME=nayab_sms`, `DB_PORT=3306`
5. After deploy, open: **https://nayab-school-sms.onrender.com** (admin, portal, data all work).

Then in GitHub → **Settings → Secrets → Actions** add:

- `PUBLIC_API_URL` = `https://nayab-school-sms.onrender.com/api`

Re-run the **Deploy frontend to GitHub Pages** workflow so Pages also loads data.

## Option B — Full app on your PC (always works with your data)

1. Run **`RUN-WEBSITE.bat`** (MySQL + dev servers), or **`start-production.bat`** (single port **5000**).
2. Open: **http://127.0.0.1:5173** or **http://127.0.0.1:5000**

## Links

| What | URL |
|------|-----|
| GitHub code | https://github.com/danishaliarain666/NayabSchool |
| GitHub Pages (UI) | https://danishaliarain666.github.io/NayabSchool/ |
| Render (after setup) | https://nayab-school-sms.onrender.com |

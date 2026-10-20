# Brighton & Hove Albion app: self-updating version

Premier League fixtures, results and the table update by themselves (about every minute, scores delayed on the free plan).
Cup games, squad and news are simple files you edit: cups.json, squad.json, news.json.

## Set up (about 15 minutes, all free)
1. Get a free key: register at football-data.org and copy the API token from your email/account.
2. Put this folder on GitHub: create a free account, make a new repository, drag all these files in ("Add file > Upload files"), commit.
3. Go to vercel.com, sign in with GitHub, "Add New > Project", pick the repository, then before deploying open
   Environment Variables and add:  Name FOOTBALL_DATA_KEY  Value (your token). Click Deploy.
4. Open the address Vercel gives you. Check <your-address>/api/data shows data (not an error).

## Android app (APK)
1. Go to pwabuilder.com, paste your Vercel address, press Start.
2. Choose Android, then Download the package and follow its short install notes.
3. On your phone allow "install unknown apps" for your browser/files app, then open the APK file.
(Easier alternative: open the address in Chrome, menu > Add to Home screen / Install app.)

## Adding things
- Player photos: put files in /players named by shirt number, e.g. players/7.jpg. Re-upload to GitHub; Vercel redeploys.
- Cup games: edit cups.json. Team codes are 3 letters; use "BHA" for Brighton; add new clubs under "teams".
  Format: ["2026-10-22T16:45Z","JAB","BHA",homeGoals,awayGoals,"CL"]  (use null for goals before kick-off; CL = Conference League, EFL = Carabao Cup).
- News: edit news.json (src, when, title, sum, body[], facts[], url).
- Kits: add images to the folder and tell Claude where you want them.

## Notes
- Free plan = delayed scores and 10 calls/min; api/data.js caches for 60s so you stay under it.
- Cup fixtures are not in the free data, so they are manual.
- All-time head-to-head uses football-data.org's head2head feature; if your plan does not include it, the app says so.

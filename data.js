// API-Football server-side integration. Keep API_FOOTBALL_KEY in Vercel Environment Variables.
const BASE = "https://v3.football.api-sports.io";
const get = async (p) => {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error("API_FOOTBALL_KEY is not configured in Vercel");
  const r = await fetch(BASE + p, { headers: { "x-apisports-key": key } });
  if (!r.ok) throw new Error("API-Football returned " + r.status);
  const j = await r.json();
  if (j.errors && Object.keys(j.errors).length) throw new Error("API-Football: " + JSON.stringify(j.errors));
  return j.response || [];
};
const team = (t) => ({ id: t.id, tla: t.code || (t.name === "Brighton" ? "BHA" : t.name.slice(0,3).toUpperCase()), name: t.id === 51 ? "Brighton" : t.name });
module.exports = async (_req, res) => {
  try {
    const [fixtures, standings] = await Promise.all([
      get("/fixtures?league=39&season=2026&team=51"),
      get("/standings?league=39&season=2026")
    ]);
    const matches = fixtures.map(x => ({ id: x.fixture.id, d: x.fixture.date, st: ({ NS:"SCHEDULED", TBD:"SCHEDULED", "1H":"IN_PLAY", HT:"PAUSED", "2H":"IN_PLAY", "ET":"IN_PLAY", P:"PAUSED", FT:"FINISHED", AET:"FINISHED", PEN:"FINISHED", PST:"POSTPONED", CANC:"CANCELLED", ABD:"CANCELLED", AWD:"FINISHED", WO:"FINISHED" })[x.fixture.status.short] || "SCHEDULED", h: team(x.teams.home), a: team(x.teams.away), hs: x.goals.home, as: x.goals.away }));
    const league = standings[0] && standings[0].league;
    const rows = league && league.standings && league.standings[0] || [];
    const table = rows.map(r => ({ t: team(r.team), p: r.all.played, w: r.all.win, d: r.all.draw, l: r.all.lose, gd: r.goalsDiff, pts: r.points }));
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    res.status(200).json({ matches, table, updated: new Date().toISOString() });
  } catch (e) { res.status(502).json({ error: String(e.message) }); }
};

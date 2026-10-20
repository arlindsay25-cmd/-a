// Fetches Brighton's Premier League fixtures/results + the table from football-data.org.
// Your key stays here on the server (env var FOOTBALL_DATA_KEY). Cached 60s so the free 10 calls/min limit is safe.
const BASE = "https://api.football-data.org/v4";
const get = async (p) => {
  const r = await fetch(BASE + p, { headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_KEY || "" } });
  if (!r.ok) throw new Error("football-data " + r.status);
  return r.json();
};
const team = (t) => ({ id: t.id, tla: t.tla, name: t.id === 397 ? "Brighton" : t.shortName || t.name });
module.exports = async (req, res) => {
  try {
    const [m, s] = await Promise.all([get("/competitions/PL/matches"), get("/competitions/PL/standings")]);
    const matches = m.matches
      .filter((x) => x.homeTeam.id === 397 || x.awayTeam.id === 397)
      .map((x) => ({ id: x.id, d: x.utcDate, st: x.status, h: team(x.homeTeam), a: team(x.awayTeam), hs: x.score.fullTime.home, as: x.score.fullTime.away }));
    const total = s.standings.find((z) => z.type === "TOTAL") || s.standings[0];
    const table = total.table.map((r) => ({ t: team(r.team), p: r.playedGames, w: r.won, d: r.draw, l: r.lost, gd: r.goalDifference, pts: r.points }));
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    res.status(200).json({ matches, table, updated: new Date().toISOString() });
  } catch (e) {
    res.status(502).json({ error: String(e.message) });
  }
};

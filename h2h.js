// API-Football head-to-head. Query id is an API-Football fixture id.
module.exports = async (req, res) => {
  const id = String((req.query && req.query.id) || "").replace(/\D/g, "");
  if (!id) return res.status(400).json({ error: "id required" });
  try {
    const key = process.env.API_FOOTBALL_KEY;
    if (!key) throw new Error("API_FOOTBALL_KEY is not configured");
    const base = "https://v3.football.api-sports.io";
    const headers = { "x-apisports-key": key };
    const fr = await fetch(`${base}/fixtures?id=${id}`, { headers });
    if (!fr.ok) throw new Error("API-Football returned " + fr.status);
    const fj = await fr.json(); const f = (fj.response || [])[0];
    if (!f) return res.status(404).json({ error: "fixture not found" });
    const hr = await fetch(`${base}/fixtures/headtohead?h2h=${f.teams.home.id}-${f.teams.away.id}&last=20`, { headers });
    if (!hr.ok) throw new Error("API-Football returned " + hr.status);
    const hj = await hr.json(); const matches = hj.response || [];
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=3600");
    res.status(200).json({ aggregates: { numberOfMatches: matches.length, homeTeam: { id: f.teams.home.id, wins: matches.filter(x=>x.teams.home.id===f.teams.home.id ? x.teams.home.winner : x.teams.away.winner).length, draws: matches.filter(x=>x.goals.home===x.goals.away).length }, awayTeam: { id: f.teams.away.id, wins: matches.filter(x=>x.teams.home.id===f.teams.away.id ? x.teams.home.winner : x.teams.away.winner).length } }, matches: matches.map(x=>({ d:x.fixture.date, h:x.teams.home.name, a:x.teams.away.name, hs:x.goals.home, as:x.goals.away })) });
  } catch (e) { res.status(502).json({ error: String(e.message) }); }
};

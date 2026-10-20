// Match statistics and events for an API-Football fixture.
module.exports = async (req, res) => {
  const id = String((req.query && req.query.id) || "").replace(/\D/g, "");
  if (!id) return res.status(400).json({ error: "id required" });
  try {
    const key = process.env.API_FOOTBALL_KEY;
    if (!key) throw new Error("API_FOOTBALL_KEY is not configured");
    const base = "https://v3.football.api-sports.io";
    const headers = { "x-apisports-key": key };
    const [sr, er] = await Promise.all([fetch(`${base}/fixtures/statistics?fixture=${id}`, { headers }), fetch(`${base}/fixtures/events?fixture=${id}`, { headers })]);
    if (!sr.ok || !er.ok) throw new Error("API-Football returned an error");
    const sj = await sr.json(), ej = await er.json();
    const stats = (sj.response || []).map(team => ({ name: team.team.name, stats: (team.statistics || []).map(s=>({ type:s.type, value:s.value })) }));
    const events = (ej.response || []).map(e=>({ time:e.time && e.time.elapsed, team:e.team && e.team.name, type:e.type, detail:e.detail, player:e.player && e.player.name, assist:e.assist && e.assist.name }));
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=3600");
    res.status(200).json({ stats, events });
  } catch (e) { res.status(502).json({ error: String(e.message) }); }
};

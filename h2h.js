// All-time head-to-head for a match id. May not be included on every free plan; the app handles that gracefully.
module.exports = async (req, res) => {
  const id = String((req.query && req.query.id) || "").replace(/\D/g, "");
  if (!id) return res.status(400).json({ error: "id required" });
  try {
    const r = await fetch(`https://api.football-data.org/v4/matches/${id}/head2head?limit=20`, { headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_KEY || "" } });
    if (!r.ok) return res.status(r.status).json({ error: r.status });
    const j = await r.json();
    res.setHeader("Cache-Control", "s-maxage=86400");
    res.status(200).json({
      aggregates: j.aggregates,
      matches: (j.matches || []).map((x) => ({ d: x.utcDate, h: x.homeTeam.shortName || x.homeTeam.name, a: x.awayTeam.shortName || x.awayTeam.name, hs: x.score.fullTime.home, as: x.score.fullTime.away })),
    });
  } catch (e) {
    res.status(502).json({ error: "failed" });
  }
};

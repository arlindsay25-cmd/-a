const BASE = "https://footballdata.io/api/v1";

const get = async (path) => {
  const key = process.env.FOOTBALLDATA_API_KEY;
  if (!key) {
    throw new Error("FOOTBALLDATA_API_KEY is not configured in Vercel");
  }

  const response = await fetch(BASE + path, {
    headers: {
      Authorization: "Bearer " + key,
      Accept: "application/json"
    }
  });

  const json = await response.json();

  if (!response.ok || json.success === false) {
    throw new Error(
      json.error?.message || "FootballData.io returned " + response.status
    );
  }

  return json.data;
};

const team = (t) => {
  if (!t) return null;

  const name = t.team_name || t.name || "Unknown";
  return {
    id: t.team_id ?? t.id,
    tla: t.team_code || t.code ||
      (name === "Brighton" ? "BHA" : name.slice(0, 3).toUpperCase()),
    name: name,
    logo: t.team_logo || t.logo || ""
  };
};

module.exports = async (_req, res) => {
  try {
    const [matchesData, standingsData] = await Promise.all([
      get("/leagues/15/matches?limit=100"),
      get("/leagues/15/standings")
    ]);

    const fixtures = Array.isArray(matchesData)
      ? matchesData
      : matchesData?.matches || [];

    const league = standingsData?.league;
    const rows = standingsData?.standings || [];

    const statusMap = {
      scheduled: "SCHEDULED",
      not_started: "SCHEDULED",
      live: "IN_PLAY",
      "in-play": "IN_PLAY",
      halftime: "PAUSED",
      half_time: "PAUSED",
      complete: "FINISHED",
      completed: "FINISHED",
      finished: "FINISHED",
      postponed: "POSTPONED",
      cancelled: "CANCELLED",
      abandoned: "CANCELLED"
    };

    const matches = fixtures.map((x) => {
      const home = x.home_team || {};
      const away = x.away_team || {};
      const score = x.score || {};

      return {
        id: x.match_id ?? x.id,
        d: x.match_date || x.date || "",
        st: statusMap[String(x.status || "").toLowerCase()]
          || String(x.status || "SCHEDULED").toUpperCase(),
        h: team(home),
        a: team(away),
        hs: score.home ?? null,
        as: score.away ?? null,
        minute: x.minute ?? null,
        venue: x.venue?.stadium || x.venue || ""
      };
    });

    const table = rows.map((r) => {
      const stats = r.all || r;
      return {
        p: r.position,
        t: team(r.team),
        pl: r.played ?? stats.played ?? 0,
        w: r.won ?? stats.won ?? 0,
        d: r.drawn ?? stats.drawn ?? 0,
        l: r.lost ?? stats.lost ?? 0,
        gf: r.goals_for ?? stats.goals_for ?? 0,
        ga: r.goals_against ?? stats.goals_against ?? 0,
        gd: r.goal_difference ?? 0,
        pts: r.points ?? 0,
        form: r.form || ""
      };
    });

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    res.status(200).json({
      matches,
      table,
      updated: new Date().toISOString()
    });
  } catch (error) {
    res.status(502).json({ error: String(error.message) });
  }
};

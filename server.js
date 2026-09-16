require("dotenv").config();
const express = require("express");

const app = express();
const PORT = 3000;

app.use(express.static("public"));


// ==========================================
// TODAY'S MATCHES
// ==========================================

app.get("/api/matches", async (req, res) => {
    try {
        const now = new Date();

        // Pakistan time ke hisaab se aaj ki date
        const pakistanDate = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Karachi"
        }).format(now);

        const start = `${pakistanDate}T00:00:00`;
        const end = `${pakistanDate}T23:59:59`;

        const url =
            "https://cricket.sportmonks.com/api/v2.0/fixtures" +
            "?api_token=" + process.env.SPORTMONKS_API_TOKEN +
            "&filter[starts_between]=" +
            encodeURIComponent(start + "," + end) +
            "&include=localteam,visitorteam,scoreboards,runs";

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        const matches = (data.data || []).map(match => ({
            id: match.id,
            date: match.starting_at,
            status: match.status,
            live: match.live,
            type: match.type,

            team1: match.localteam?.name || "Team 1",
            team2: match.visitorteam?.name || "Team 2",

            scoreboards: match.scoreboards || [],
            runs: match.runs || []
        }));

        res.json({
            success: true,
            count: matches.length,
            matches: matches,
            updatedAt: new Date().toISOString()
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });

    }
});


// ==========================================
// SINGLE MATCH DETAILS
// ==========================================

app.get("/api/matches/:id", async (req, res) => {
    try {
        const id = req.params.id;

        const url =
            "https://cricket.sportmonks.com/api/v2.0/fixtures/" +
            id +
            "?api_token=" + process.env.SPORTMONKS_API_TOKEN +
            "&include=localteam,visitorteam,scoreboards,runs,batting,bowling,lineup";

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json({
            success: true,
            match: data.data
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });

    }
});


// ==========================================
// START SERVER
// =========================================
module.exports = app;

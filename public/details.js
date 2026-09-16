const detailsBox = document.getElementById("details");

const params = new URLSearchParams(window.location.search);
const matchId = params.get("id");

function goBack() {
    window.location.href = "/";
}

function safe(value, fallback = "N/A") {
    return value !== null && value !== undefined && value !== ""
        ? value
        : fallback;
}

function getStatus(match) {
    if (match.status === "NS") return "🕒 UPCOMING";
    if (match.status === "Finished") return "🏁 FINISHED";
    if (match.live === true) {
        return `🔴 LIVE • ${safe(match.status)}`;
    }

    return `ℹ️ ${safe(match.status)}`;
}

function getRun(match, teamId) {
    return (match.runs || []).find(
        run => run.team_id === teamId
    );
}

function getPlayer(match, playerId) {
    return (match.lineup || []).find(
        player => player.id === playerId
    );
}

function getPlayerTeamId(player) {
    return player?.lineup?.team_id;
}

function getLastScoreUpdate(match) {

    const updates = [];

    (match.runs || []).forEach(run => {
        if (run.updated_at) {
            updates.push(new Date(run.updated_at));
        }
    });

    (match.scoreboards || []).forEach(board => {
        if (board.updated_at) {
            updates.push(new Date(board.updated_at));
        }
    });

    (match.batting || []).forEach(player => {
        if (player.updated_at) {
            updates.push(new Date(player.updated_at));
        }
    });

    (match.bowling || []).forEach(player => {
        if (player.updated_at) {
            updates.push(new Date(player.updated_at));
        }
    });

    if (!updates.length) {
        return null;
    }

    return new Date(
        Math.max(
            ...updates.map(date => date.getTime())
        )
    );
}

function teamCard(team, innings) {

    const name = team?.name || "Team";
    const code = team?.code || "";
    const logo = team?.image_path || "";

    const score = innings
        ? `${safe(innings.score, 0)}/${safe(innings.wickets, 0)}`
        : "-";

    const overs = innings
        ? `${safe(innings.overs, 0)} overs`
        : "Not started";

    return `
        <div class="team">

            ${
                logo
                    ? `
                        <img
                            src="${logo}"
                            width="65"
                            height="65"
                            alt="${code}"
                            style="object-fit:contain;"
                        >
                    `
                    : ""
            }

            <h2>${name}</h2>

            <small>${code}</small>

            <div class="score">
                ${score}
            </div>

            <p>${overs}</p>

        </div>
    `;
}


/* ==========================================
   TEAM HEADER
========================================== */

function teamHeader(team) {

    const logo = team?.image_path || "";
    const name = team?.name || "Team";
    const code = team?.code || "";

    return `
        <div class="team-section-header">

            ${
                logo
                    ? `
                        <img
                            src="${logo}"
                            width="35"
                            height="35"
                            alt="${code}"
                            style="object-fit:contain;"
                        >
                    `
                    : ""
            }

            <div>
                <strong>${name}</strong>
                <small>${code}</small>
            </div>

        </div>
    `;
}


/* ==========================================
   BATTING
========================================== */

function battingSection(match) {

    const batting = match.batting || [];

    if (!batting.length) {
        return `
            <div class="match">
                <h2>🏏 Batting</h2>
                <div class="empty-state">
                    No batting data available.
                </div>
            </div>
        `;
    }

    const team1 = match.localteam || {};
    const team2 = match.visitorteam || {};

    function makeBattingTeam(team) {

        const teamId = team.id;

        const teamBatting = batting.filter(bat => {

            const player = getPlayer(match, bat.player_id);

            return getPlayerTeamId(player) === teamId;
        });

        if (!teamBatting.length) {
            return "";
        }

        const rows = teamBatting.map(bat => {

            const player = getPlayer(
                match,
                bat.player_id
            );

            const name =
                player?.fullname ||
                `Player ${bat.player_id}`;

            const status = bat.active
                ? "🟢 Batting"
                : "Out";

            return `
                <div class="score-player">

                    <div class="score-player-name">
                        <strong>${name}</strong>
                        <small>${status}</small>
                    </div>

                    <div class="score-stats">

                        <span>
                            <strong>${safe(bat.score, 0)}</strong>
                            <small>Runs</small>
                        </span>

                        <span>
                            <strong>${safe(bat.ball, 0)}</strong>
                            <small>Balls</small>
                        </span>

                        <span>
                            <strong>${safe(bat.four_x, 0)}</strong>
                            <small>4s</small>
                        </span>

                        <span>
                            <strong>${safe(bat.six_x, 0)}</strong>
                            <small>6s</small>
                        </span>

                        <span>
                            <strong>${safe(bat.rate, 0)}</strong>
                            <small>SR</small>
                        </span>

                    </div>

                </div>
            `;
        }).join("");

        const teamName = team.name || "Team";
        const code = team.code || "";

        return `
            <details class="players-accordion">

                <summary>

                    <div class="accordion-team">

                        ${
                            team.image_path
                                ? `
                                    <img
                                        src="${team.image_path}"
                                        width="32"
                                        height="32"
                                        alt="${code}"
                                        style="object-fit:contain;"
                                    >
                                `
                                : ""
                        }

                        <div>
                            <strong>${teamName}</strong>
                            <small>${teamBatting.length} Batsmen</small>
                        </div>

                    </div>

                    <span class="accordion-arrow">▼</span>

                </summary>

                <div class="accordion-content">

                    <div class="players-list">
                        ${rows}
                    </div>

                </div>

            </details>
        `;
    }

    return `
        <div class="match">

            <h2>🏏 Batting</h2>

            <div class="players-accordion-list">

                ${makeBattingTeam(team1)}

                ${makeBattingTeam(team2)}

            </div>

        </div>
    `;
}


/* ==========================================
   BOWLING
========================================== */

function bowlingSection(match) {

    const bowling = match.bowling || [];

    if (!bowling.length) {
        return `
            <div class="match">
                <h2>🎯 Bowling</h2>
                <div class="empty-state">
                    No bowling data available.
                </div>
            </div>
        `;
    }

    const team1 = match.localteam || {};
    const team2 = match.visitorteam || {};

    function makeBowlingTeam(team) {

        const teamId = team.id;

        const teamBowling = bowling.filter(bowl => {

            const player = getPlayer(
                match,
                bowl.player_id
            );

            return getPlayerTeamId(player) === teamId;
        });

        if (!teamBowling.length) {
            return "";
        }

        const rows = teamBowling.map(bowl => {

            const player = getPlayer(
                match,
                bowl.player_id
            );

            const name =
                player?.fullname ||
                `Player ${bowl.player_id}`;

            return `
                <div class="score-player">

                    <div class="score-player-name">
                        <strong>${name}</strong>
                    </div>

                    <div class="score-stats">

                        <span>
                            <strong>${safe(bowl.overs, 0)}</strong>
                            <small>Overs</small>
                        </span>

                        <span>
                            <strong>${safe(bowl.runs, 0)}</strong>
                            <small>Runs</small>
                        </span>

                        <span>
                            <strong>${safe(bowl.wickets, 0)}</strong>
                            <small>Wkts</small>
                        </span>

                        <span>
                            <strong>${safe(bowl.rate, 0)}</strong>
                            <small>Econ</small>
                        </span>

                    </div>

                </div>
            `;
        }).join("");

        const teamName = team.name || "Team";
        const code = team.code || "";

        return `
            <details class="players-accordion">

                <summary>

                    <div class="accordion-team">

                        ${
                            team.image_path
                                ? `
                                    <img
                                        src="${team.image_path}"
                                        width="32"
                                        height="32"
                                        alt="${code}"
                                        style="object-fit:contain;"
                                    >
                                `
                                : ""
                        }

                        <div>
                            <strong>${teamName}</strong>
                            <small>${teamBowling.length} Bowlers</small>
                        </div>

                    </div>

                    <span class="accordion-arrow">▼</span>

                </summary>

                <div class="accordion-content">

                    <div class="players-list">
                        ${rows}
                    </div>

                </div>

            </details>
        `;
    }

    return `
        <div class="match">

            <h2>🎯 Bowling</h2>

            <div class="players-accordion-list">

                ${makeBowlingTeam(team1)}

                ${makeBowlingTeam(team2)}

            </div>

        </div>
    `;
}


/* ==========================================
   PLAYERS
========================================== */

function playersSection(match) {

    const players = match.lineup || [];

    if (!players.length) {
        return `
            <div class="match">
                <h2>👥 Players</h2>
                <div class="empty-state">
                    No player data available.
                </div>
            </div>
        `;
    }

    const team1 = match.localteam || {};
    const team2 = match.visitorteam || {};

    function makePlayersTeam(team, index) {

        const teamId = team.id;

        const teamPlayers = players.filter(player => {
            return getPlayerTeamId(player) === teamId;
        });

        if (!teamPlayers.length) {
            return "";
        }

        const rows = teamPlayers.map(player => {

            const role =
                player.position?.name ||
                "Player";

            const captain =
                player.lineup?.captain
                    ? "⭐ Captain"
                    : "";

            const wicketkeeper =
                player.lineup?.wicketkeeper
                    ? "🧤 WK"
                    : "";

            return `
                <div class="player-card">

                    <div>
                        <strong>
                            ${safe(player.fullname)}
                        </strong>

                        <small>
                            ${safe(role)}
                        </small>
                    </div>

                    <div class="player-badges">
                        ${captain}
                        ${wicketkeeper}
                    </div>

                </div>
            `;

        }).join("");

        const teamName = team.name || "Team";
        const code = team.code || "";

        return `
            <details class="players-accordion" ${index === 0 ? "" : ""}>

                <summary>

                    <div class="accordion-team">

                        ${
                            team.image_path
                                ? `
                                    <img
                                        src="${team.image_path}"
                                        width="32"
                                        height="32"
                                        alt="${code}"
                                        style="object-fit:contain;"
                                    >
                                `
                                : ""
                        }

                        <div>
                            <strong>${teamName}</strong>
                            <small>${teamPlayers.length} Players</small>
                        </div>

                    </div>

                    <span class="accordion-arrow">▼</span>

                </summary>

                <div class="accordion-content">

                    <div class="players-list">
                        ${rows}
                    </div>

                </div>

            </details>
        `;
    }

    return `
        <div class="match">

            <h2>👥 Players</h2>

            <div class="players-accordion-list">

                ${makePlayersTeam(team1, 0)}

                ${makePlayersTeam(team2, 1)}

            </div>

        </div>
    `;
}


/* ==========================================
   LOAD MATCH DETAILS
========================================== */

async function loadDetails() {

    detailsBox.innerHTML = `
        <div class="loading-card">
            <div class="loading-spinner"></div>
            <strong>Loading match...</strong>
            <small>Fetching latest score and player data</small>
        </div>
    `;

    if (!matchId) {

        detailsBox.innerHTML = `
            <div class="match">

                <h2>❌ Match not found</h2>

            </div>
        `;

        return;
    }

    try {

        const response =
            await fetch(
                `/api/matches/${matchId}?t=${Date.now()}`
            );

        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }

        const data = await response.json();

        if (!data.success || !data.match) {

            throw new Error(
                "Match data unavailable"
            );

        }

        const match = data.match;

        const team1 =
            match.localteam || {};

        const team2 =
            match.visitorteam || {};

        const innings1 =
            getRun(
                match,
                match.localteam_id
            );

        const innings2 =
            getRun(
                match,
                match.visitorteam_id
            );

        const lastUpdated =
            getLastScoreUpdate(match);

        const tossTeam =
            match.toss_won_team_id ===
            match.localteam_id
                ? team1.name
                : match.toss_won_team_id ===
                  match.visitorteam_id
                    ? team2.name
                    : "N/A";

        const tossText =
            match.elected
                ? `${safe(tossTeam)} chose to ${match.elected === "batting" ? "bat" : match.elected}`
                : "Not available";


        detailsBox.innerHTML = `

            <!-- MATCH HEADER -->

            <div class="match details-card">

                <div class="status">
                    ${getStatus(match)}
                </div>

                <div class="info">

                    ${safe(match.type, "Cricket")}

                    •
                    
                    ${safe(match.round, "")}

                </div>

                <div class="teams">

                    ${teamCard(team1, innings1)}

                    <div class="vs">
                        VS
                    </div>

                    ${teamCard(team2, innings2)}

                </div>

                <div class="result">

                    ${safe(
                        match.note,
                        "Live match data"
                    )}

                </div>

                ${
                    lastUpdated
                        ? `
                            <div class="live-update">

                                🟢 Score updated:
                                ${lastUpdated.toLocaleTimeString()}

                            </div>
                        `
                        : ""
                }

            </div>


            <!-- LIVE SCOREBOARD -->

            <div class="match">

                <h2>📊 Live Scoreboard</h2>

                <div class="score-summary">

                    <div>

                        <strong>
                            ${safe(team1.name)}
                        </strong>

                        <div class="score">

                            ${
                                innings1
                                    ? `${safe(innings1.score, 0)}/${safe(innings1.wickets, 0)}`
                                    : "-"
                            }

                        </div>

                        <small>

                            ${
                                innings1
                                    ? `${safe(innings1.overs, 0)} overs`
                                    : "Not started"
                            }

                        </small>

                    </div>


                    <div>

                        <strong>
                            ${safe(team2.name)}
                        </strong>

                        <div class="score">

                            ${
                                innings2
                                    ? `${safe(innings2.score, 0)}/${safe(innings2.wickets, 0)}`
                                    : "-"
                            }

                        </div>

                        <small>

                            ${
                                innings2
                                    ? `${safe(innings2.overs, 0)} overs`
                                    : "Not started"
                            }

                        </small>

                    </div>

                </div>

            </div>


            ${battingSection(match)}

            ${bowlingSection(match)}

            ${playersSection(match)}


            <!-- MATCH INFORMATION -->

            <div class="match">

                <details class="info-accordion">

                    <summary>
                        <span>ℹ️ Match Information</span>
                        <span class="accordion-arrow">▼</span>
                    </summary>

                    <div class="info accordion-info">

                        <p>
                            <strong>Match:</strong>
                            ${safe(match.round)}
                        </p>

                        <p>
                            <strong>Type:</strong>
                            ${safe(match.type)}
                        </p>

                        <p>
                            <strong>Status:</strong>
                            ${safe(match.status)}
                        </p>

                        <p>
                            <strong>Live:</strong>
                            ${match.live ? "Yes" : "No"}
                        </p>

                        <p>
                            <strong>Toss:</strong>
                            ${tossText}
                        </p>

                        <p>
                            <strong>Total Overs Played:</strong>
                            ${safe(match.total_overs_played)}
                        </p>

                        <p>
                            <strong>Super Over:</strong>
                            ${match.super_over ? "Yes" : "No"}
                        </p>

                    </div>

                </details>

            </div>


            <button onclick="goBack()">
                ← Back to Matches
            </button>

        `;

    } catch (error) {

        console.error(error);

        detailsBox.innerHTML = `

            <div class="error-card">

                <div class="error-icon">⚠️</div>

                <h2>Unable to load match</h2>

                <p>
                    Please check your internet connection
                    and try again.
                </p>

                <div class="error-actions">

                    <button onclick="loadDetails()">
                        🔄 Retry
                    </button>

                    <button onclick="goBack()">
                        ← Back
                    </button>

                </div>

            </div>

        `;
    }
}


/* ==========================================
   START + AUTO REFRESH
========================================== */

loadDetails();

setInterval(
    loadDetails,
    30000
);

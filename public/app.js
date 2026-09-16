let allMatches = [];
let currentFilter = "all";

async function loadMatches() {
    const box = document.getElementById("matches");

    box.innerHTML = "Loading matches...";

    try {
        const response = await fetch("/api/matches");
        const data = await response.json();

        if (!data.success) {
            box.innerHTML = "❌ Failed to load matches.";
            return;
        }

        allMatches = data.matches || [];

        showMatches();

    } catch (error) {
        console.error(error);
        box.innerHTML = "❌ Server connection failed.";
    }
}


function filterMatches(filter) {
    currentFilter = filter;
    showMatches();
}


function showMatches() {

    const box = document.getElementById("matches");

    let matches = allMatches;

    if (currentFilter === "live") {
        matches = allMatches.filter(match =>
            match.live === true &&
            match.status !== "Finished"
        );
    }

    if (currentFilter === "finished") {
        matches = allMatches.filter(match =>
            match.status === "Finished"
        );
    }

    if (currentFilter === "upcoming") {
        matches = allMatches.filter(match =>
            !match.live &&
            match.status !== "Finished"
        );
    }


    if (matches.length === 0) {

        box.innerHTML = `
            <div class="empty">
                No ${currentFilter} matches.
            </div>
        `;

        return;
    }


    box.innerHTML = "";


    matches.forEach(match => {

        const scores = (match.scoreboards || []).filter(
            item => item.type === "total"
        );

        const score1 = scores[0];
        const score2 = scores[1];


        let statusText = "🕒 UPCOMING";
        let statusClass = "upcoming";

        if (match.status === "Finished") {
            statusText = "✓ FINISHED";
            statusClass = "finished";
        }
        else if (match.live) {
            statusText = "🔴 LIVE";
            statusClass = "live";
        }


        box.innerHTML += `

            <div class="match"
                 onclick="openMatch(${match.id})"
                 style="cursor:pointer;">

                <div class="status ${statusClass}">
                    ${statusText}
                </div>


                <div class="teams">

                    <div class="team">

                        <h3>
                            ${match.team1}
                        </h3>

                        ${
                            score1
                                ? `
                                    <div class="score">
                                        ${score1.total}/${score1.wickets}
                                    </div>

                                    <p>
                                        ${score1.overs} overs
                                    </p>
                                `
                                : `
                                    <div class="score">
                                        -
                                    </div>
                                `
                        }

                    </div>


                    <div class="vs">
                        VS
                    </div>


                    <div class="team">

                        <h3>
                            ${match.team2}
                        </h3>

                        ${
                            score2
                                ? `
                                    <div class="score">
                                        ${score2.total}/${score2.wickets}
                                    </div>

                                    <p>
                                        ${score2.overs} overs
                                    </p>
                                `
                                : `
                                    <div class="score">
                                        -
                                    </div>
                                `
                        }

                    </div>

                </div>


                <div class="info">
                    ${match.type || "Cricket"}
                </div>

            </div>

        `;
    });
}


function openMatch(id) {
    window.location.href = `/details.html?id=${id}`;
}


loadMatches();

setInterval(loadMatches, 30000);

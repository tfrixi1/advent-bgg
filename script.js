let games = [];
let usedGames = [];

const popupEl = document.getElementById("popup");
const revealBtn = document.getElementById("revealButton");

// Make sure the popup is hidden initially
popupEl.classList.add("hidden");

document.getElementById("csvInput").addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
        const text = event.target.result;
        parseCSV(text);
        revealBtn.disabled = false;
    };
    reader.readAsText(file);
});

function parseCSV(text) {
    const rows = text.split("\n").map(r => r.trim()).filter(r => r);
    if (rows[0].toLowerCase().includes("name")) {
        rows.shift();
    }
    games = rows.map(row => {
        const parts = row.split(",");
        return {
            name: parts[0],
            imageUrl: parts[1],
            length: parts[2]?.toLowerCase(),
            fixedDate: parts[3] || ""
        };
    });
}

function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6;
}

function getToday() {
    return new Date().toISOString().split("T")[0];
}

function getGameForToday() {
    const today = getToday();
    const fixed = games.find(g => g.fixedDate === today);
    if (fixed) return fixed;

    const todayDate = new Date();
    let pool;
    if (isWeekend(todayDate)) {
        pool = games.filter(g => g.length === "long" || g.length === "medium");
    } else {
        pool = games.filter(g => g.length === "short" || g.length === "medium");
    }

    pool = pool.filter(g => !usedGames.includes(g.name));
    if (pool.length === 0) {
        usedGames = [];
        pool = games.filter(g => !usedGames.includes(g.name));
    }

    let weightedPool = [];
    pool.forEach(g => {
        if (g.length === "medium") {
            weightedPool.push(g, g);
        } else {
            weightedPool.push(g);
        }
    });

    const selected = weightedPool[Math.floor(Math.random() * weightedPool.length)];
    usedGames.push(selected.name);
    return selected;
}

revealBtn.addEventListener("click", () => {
    if (!games.length) {
        alert("Please upload your CSV first.");
        return;
    }
    const game = getGameForToday();
    if (!game) {
        alert("Could not find a valid game for today.");
        return;
    }

    document.getElementById("gameName").textContent = game.name;
    document.getElementById("gameImage").src = game.imageUrl;

    document.getElementById("jingle").play();
    popupEl.classList.remove("hidden");
});

popupEl.addEventListener("click", () => {
    popupEl.classList.add("hidden");
});

let games = [];
let usedGames = [];

document.getElementById("revealButton").addEventListener("click", () => {
    if (!games || games.length === 0) {
        alert("Please upload your CSV first.");
        return;
    }

    const game = getGameForToday();
    if (!game || !game.name) {
        alert("Your CSV didn't load correctly. Please check formatting.");
        return;
    }

    document.getElementById("gameName").textContent = game.name;
    document.getElementById("gameImage").src = game.imageUrl;

    document.getElementById("jingle").play();
    document.getElementById("popup").classList.remove("hidden");
});


// Parse CSV with columns: name,imageUrl,length,fixedDate
function parseCSV(text) {
    const rows = text.split("\n").map(r => r.trim()).filter(r => r);

    // Remove header if it exists (detect if first row contains letters)
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
    return day === 0 || day === 6; // Sunday=0, Saturday=6
}

function getToday() {
    return new Date().toISOString().split("T")[0];
}

function getGameForToday() {
    const today = getToday();

    // 1. Respect fixed assignments first
    const fixed = games.find(g => g.fixedDate === today);
    if (fixed) return fixed;

    const todayDate = new Date();

    // 2. Determine valid game pool based on day type
    let pool;
    if (isWeekend(todayDate)) {
        pool = games.filter(g => g.length === "long" || g.length === "medium");
    } else {
        pool = games.filter(g => g.length === "short" || g.length === "medium");
    }

    // 3. Remove used games from the pool
    pool = pool.filter(g => !usedGames.includes(g.name));

    // If all games in the category have been used, reset
    if (pool.length === 0) {
        usedGames = [];
        return getGameForToday();
    }

    // 4. Weighted randomness:
    // medium games have slightly higher weight
    let weightedPool = [];
    pool.forEach(g => {
        if (g.length === "medium") {
            weightedPool.push(g, g); // double weight
        } else {
            weightedPool.push(g);
        }
    });

    const selected = weightedPool[Math.floor(Math.random() * weightedPool.length)];
    usedGames.push(selected.name);
    return selected;
}

document.getElementById("revealButton").addEventListener("click", () => {
    const game = getGameForToday();

    document.getElementById("gameName").textContent = game.name;
    document.getElementById("gameImage").src = game.imageUrl;

    document.getElementById("jingle").play();
    document.getElementById("popup").classList.remove("hidden");
});

document.getElementById("popup").addEventListener("click", () => {
    document.getElementById("popup").classList.add("hidden");
});



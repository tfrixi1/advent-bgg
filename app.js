/* =========================================================
   APP.JS — FULL LOGIC FOR CREATE + CALENDAR
   ========================================================= */

/* ---------------------------------------------------------
   GLOBAL CONSTANTS
--------------------------------------------------------- */

const STORAGE_KEY = "advent_calendar_config";
const DOOR_POSITIONS_KEY = "advent_calendar_door_positions";
const CALENDAR_RESULTS_KEY = "advent_calendar_results";

/* Sound */
let jingle = new Audio("assets/jingle_bells.ogg");

/* =========================================================
   CREATE.HTML LOGIC
   ========================================================= */

if (document.getElementById("create-container")) {
    document.getElementById("generate-btn").addEventListener("click", generateCalendar);
}

function generateCalendar() {
    const title = document.getElementById("calendar-title").value || "Advent Calendar";
    const bgImage = document.getElementById("background-image").value;
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;
    const fileInput = document.getElementById("csv-file").files[0];

    if (!startDate || !endDate) {
        alert("Please enter a start and end date.");
        return;
    }
    if (!fileInput) {
        alert("Please upload your CSV file.");
        return;
    }

    // Parse CSV
    const reader = new FileReader();
    reader.onload = function (event) {
        const lines = event.target.result.split("\n").map(l => l.trim()).filter(Boolean);

        let games = [];

        for (let i = 1; i < lines.length; i++) {
            const [name, image, length, fixedDateRaw] = lines[i].split(",");
            games.push({
                name: name.trim(),
                image: image.trim(),
                length: length.trim().toLowerCase(),
                fixedDate: fixedDateRaw ? fixedDateRaw.trim() : ""
            });
        }

        const config = {
            title,
            bgImage,
            startDate,
            endDate,
            games
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));

        // Reset previous door positions + results
        localStorage.removeItem(DOOR_POSITIONS_KEY);
        localStorage.removeItem(CALENDAR_RESULTS_KEY);

        window.location.href = "index.html";
    };

    reader.readAsText(fileInput);
}

/* =========================================================
   INDEX.HTML LOGIC (CALENDAR SCREEN)
   ========================================================= */

if (document.getElementById("calendar")) {
    initCalendar();
}

function initCalendar() {
    const config = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!config) {
        document.body.innerHTML = "<h2>No calendar configured. Please go to create.html.</h2>";
        return;
    }

    // Apply background and title
    if (config.bgImage) {
        document.body.style.backgroundImage = `url('${config.bgImage}')`;
    }
    document.getElementById("calendar-title-banner").textContent = config.title;

    // Build date range
    const start = new Date(config.startDate);
    const end = new Date(config.endDate);

    let days = [];
    let d = new Date(start);
    while (d <= end) {
        days.push(new Date(d));
        d.setDate(d.getDate() + 1);
    }

    const results = buildSchedule(days, config.games);
    localStorage.setItem(CALENDAR_RESULTS_KEY, JSON.stringify(results));

    renderCalendar(days, results);
}

/* =========================================================
   SMART SCHEDULER
--------------------------------------------------------- */

function buildSchedule(days, games) {
    let assigned = {};

    // 1. Handle fixed-date games first
    let remainingGames = [...games];

    for (const g of games) {
        if (g.fixedDate) {
            const fd = new Date(g.fixedDate).toDateString();
            assigned[fd] = g;
            remainingGames = remainingGames.filter(x => x !== g);
        }
    }

    // 2. Fill remaining days
    for (const day of days) {
        const key = day.toDateString();
        if (assigned[key]) continue; // already assigned from fixed

        const weekday = day.getDay(); // 0=Sun, 6=Sat
        const isWeekend = (weekday === 0 || weekday === 6);

        let pool = remainingGames.filter(g => {
            if (isWeekend) {
                return g.length !== "short"; // prefer long+medium
            } else {
                return g.length !== "long"; // prefer short+medium
            }
        });

        // If pool empty, fallback to any remaining
        if (pool.length === 0) {
            pool = remainingGames;
        }

        if (pool.length === 0) break; // just in case

        const choice = pool[Math.floor(Math.random() * pool.length)];
        assigned[key] = choice;

        // remove chosen
        remainingGames = remainingGames.filter(g => g !== choice);
    }

    return assigned;
}

/* =========================================================
   RENDER CALENDAR (INDEX.HTML)
--------------------------------------------------------- */

function renderCalendar(days, results) {
    const container = document.getElementById("calendar");

    let positions = JSON.parse(localStorage.getItem(DOOR_POSITIONS_KEY));
    if (!positions) {
        positions = {};
        days.forEach((day, i) => {
            positions[i] = {
                top: Math.random() * 70 + 5,
                left: Math.random() * 70 + 5
            };
        });
        localStorage.setItem(DOOR_POSITIONS_KEY, JSON.stringify(positions));
    }

    const now = new Date();

    days.forEach((day, index) => {
        const dateStr = day.toDateString();
        const game = results[dateStr];
        const pos = positions[index];

        const door = document.createElement("div");
        door.classList.add("door");
        door.style.top = pos.top + "%";
        door.style.left = pos.left + "%";
        door.dataset.date = dateStr;
        door.dataset.index = index;

        door.textContent = day.getDate(); // show day number

        // LOCK FUTURE DAYS
        if (day > now) {
            door.classList.add("locked");
        }

        // SHOW PREVIOUSLY OPENED FROM STORAGE
        const saved = JSON.parse(localStorage.getItem(CALENDAR_RESULTS_KEY));
        if (saved && saved[dateStr] && saved[dateStr].opened) {
            displayOpenedDoor(door, saved[dateStr]);
        }

        door.addEventListener("click", () => handleDoorClick(door, day, game));
        container.appendChild(door);
    });
}

/* =========================================================
   DOOR CLICK HANDLER
--------------------------------------------------------- */

function handleDoorClick(door, date, game) {
    const now = new Date();
    if (date > now) return; // locked

    if (door.classList.contains("opened")) return;

    jingle.play();

    showPopup(game, () => {
        openDoor(door, game);
    });
}

/* =========================================================
   POPUP
--------------------------------------------------------- */

function showPopup(game, onClose) {
    const overlay = document.getElementById("reveal-overlay");
    const popup = document.getElementById("popup");
    const title = document.getElementById("popup-title");
    const img = document.getElementById("popup-image");

    title.textContent = "Today's Game is:";
    img.src = game.image;

    overlay.style.display = "flex";

    document.getElementById("close-popup").onclick = () => {
        overlay.style.display = "none";
        onClose();
    };
}

/* =========================================================
   OPEN DOOR (REPLACE WITH GAME IMAGE)
--------------------------------------------------------- */

function openDoor(door, game) {
    door.classList.add("opened");
    displayOpenedDoor(door, game);

    // Save as opened
    const results = JSON.parse(localStorage.getItem(CALENDAR_RESULTS_KEY));
    const key = door.dataset.date;

    results[key].opened = true;
    localStorage.setItem(CALENDAR_RESULTS_KEY, JSON.stringify(results));
}

function displayOpenedDoor(door, game) {
    door.innerHTML = `
        <div>${game.name}</div>
        <img src="${game.image}">
    `;
}

/* =========================================================
   END OF FILE
========================================================= */

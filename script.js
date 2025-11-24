document.addEventListener("DOMContentLoaded", () => {
    const calendar = document.getElementById("calendar");
    const popup = document.getElementById("popup");
    const popupContent = document.getElementById("popupContent");
    const popupTitle = document.getElementById("popupTitle");
    const closePopup = document.getElementById("closePopup");

    const today = new Date();
    const year = today.getFullYear();
    const december1 = new Date(year, 11, 1);
    const december25 = new Date(year, 11, 25);

    // --- LocalStorage KEY for storing assigned games ---
    const HISTORY_KEY = "adventGameHistory";

    function loadHistory() {
        const saved = localStorage.getItem(HISTORY_KEY);
        return saved ? JSON.parse(saved) : {};
    }

    function saveHistory(history) {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }

    let gameHistory = loadHistory();

    // Utility to format YYYY-MM-DD
    function formatDate(date) {
        return date.toISOString().split("T")[0];
    }

    const isBeforeDecember = today < december1;

    fetch("games.json")
        .then(response => response.json())
        .then(games => {
            buildCalendar(games);
        })
        .catch(error => console.error("Error loading games.json:", error));

    function buildCalendar(games) {
        const gamePool = [...games];

        calendar.innerHTML = "";

        for (let day = 1; day <= 25; day++) {
            const date = new Date(year, 11, day);
            const dateKey = formatDate(date);

            const box = document.createElement("div");
            box.classList.add("door");

            // DAY LABEL (centered for locked/unopened)
            const dayLabel = document.createElement("div");
            dayLabel.classList.add("day-label");
            dayLabel.innerText = day;
            box.appendChild(dayLabel);

            const isToday = formatDate(today) === dateKey;
            const isPast = today > date;
            const isFuture = today < date;

            // --- Check if this day already has a locked game ---
            let assignedGame = gameHistory[dateKey] || null;

            // If no assigned game and the box is in the past or today → assign one now
            if (!assignedGame && (isPast || isToday)) {
                assignedGame = selectGameForDay(date, gamePool);
                if (assignedGame) {
                    gameHistory[dateKey] = assignedGame;
                    saveHistory(gameHistory);
                }
            }

            // If we have an assigned game, mark door as opened
            if (assignedGame) {
                box.classList.add("opened");

                // Day label moves to top-right
                dayLabel.classList.add("day-label-opened");

                // Game image
                const img = document.createElement("img");
                img.src = assignedGame.ImageURL + ".png";
                img.alt = assignedGame.Name;
                img.classList.add("door-image");
                box.appendChild(img);

                // Checkmark
                const check = document.createElement("div");
                check.classList.add("checkmark");
                check.innerText = "✔️";
                box.appendChild(check);

                // Click to reopen the popup
                box.addEventListener("click", () => {
                    openPopup(assignedGame.Name, img.src);
                });

            } else {
                // --- FUTURE DAYS → locked ---
                box.classList.add("locked");

                const lockIcon = document.createElement("div");
                lockIcon.classList.add("lock-icon");
                lockIcon.innerText = "🔒";
                box.appendChild(lockIcon);
            }

            // Highlight TODAY with green border
            if (isToday) box.classList.add("today");

            calendar.appendChild(box);
        }
    }

    // --- Game Selection With Fixed Dates & Scheduling ---
    function selectGameForDay(dateObj, gamePool) {
        const dateKey = formatDate(dateObj);

        // 1. Check for fixed-date games first
        const fixed = gamePool.find(g => g.fixedDate === dateKey);
        if (fixed) {
            removeGameFromPool(fixed.Name, gamePool);
            return fixed;
        }

        // 2. Random selection from remaining games
        if (gamePool.length === 0) return null;

        const choice = gamePool[Math.floor(Math.random() * gamePool.length)];
        removeGameFromPool(choice.Name, gamePool);

        return choice;
    }

    function removeGameFromPool(name, pool) {
        const idx = pool.findIndex(g => g.Name === name);
        if (idx !== -1) pool.splice(idx, 1);
    }

    // --- Popup ---
    function openPopup(name, imgSrc) {
        popupTitle.innerText = name;
        popupContent.innerHTML = `<img src="${imgSrc}" class="popup-image">`;
        popup.style.display = "block";
    }

    closePopup.addEventListener("click", () => {
        popup.style.display = "none";
    });

    popup.addEventListener("click", (e) => {
        if (e.target === popup) popup.style.display = "none";
    });
});

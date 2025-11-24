document.addEventListener('DOMContentLoaded', () => {

  const calendarEl = document.getElementById('calendar');
  const popup = document.getElementById('popup');
  const popupImage = document.getElementById('popup-image');
  const popupName = document.getElementById('popup-name');
  const closePopupBtn = document.getElementById('close-popup');
  const doorSound = document.getElementById('door-sound');

  // ------------------ TESTING MODE ------------------
  const TESTING = true;
  const TEST_MONTH = 11; // December (0-indexed)
  const TEST_DAY = 3;
  const today = TESTING ? new Date(2025, TEST_MONTH, TEST_DAY) : new Date();

  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  // ------------------ HISTORY STORAGE ------------------
  const HISTORY_KEY = "adventGameHistory2025";

  function loadHistory() {
    const json = localStorage.getItem(HISTORY_KEY);
    return json ? JSON.parse(json) : {};
  }

  function saveHistory(history) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  const history = loadHistory();

  // ------------------ LOAD GAME LIST ------------------
  fetch('games.json')
    .then(res => res.json())
    .then(games => {

      // All your JSON fields are already correct
      const fixedGames = games.filter(g => g.fixed_date);
      const flexibleGames = games.filter(g => !g.fixed_date);
      const shortGames = flexibleGames.filter(g => g.length.toLowerCase() === "short");
      const longGames = flexibleGames.filter(g => g.length.toLowerCase() === "long");

      const usedGames = new Set(Object.values(history).map(h => h.game_name));

      for (let day = 1; day <= 25; day++) {

        const door = document.createElement("div");
        door.classList.add("door");

        // Day number label (always present)
        const dayLabel = document.createElement("div");
        dayLabel.classList.add("door-day");
        dayLabel.textContent = day;
        door.appendChild(dayLabel);

        // Lock icon
        const lock = document.createElement("div");
        lock.classList.add("lock-icon");
        lock.textContent = "🔒";
        door.appendChild(lock);

        // Checkmark
        const check = document.createElement("div");
        check.classList.add("checkmark");
        check.textContent = "✔️";
        door.appendChild(check);

        // ------------------ ASSIGN GAME ------------------
        let assigned = history[day];

        if (!assigned) {
          // Check for fixed date
          const fixed = fixedGames.find(g => {
            if (!g.fixed_date) return false;
            const parts = g.fixed_date.split("-");
            const m = parseInt(parts[1], 10) - 1;
            const d = parseInt(parts[2], 10);
            return m === 11 && d === day;
          });
console.log("Assigning image for day", day, ":", assigned.image);
          
          let game;

          if (fixed) {
            game = fixed;
          } else {
            const dow = new Date(2025, 11, day).getDay();
            let pool = (dow === 0 || dow === 6) ? longGames : shortGames;
            pool = pool.filter(g => !usedGames.has(g.game_name));

            if (pool.length === 0) pool = flexibleGames.filter(g => !usedGames.has(g.game_name));
            if (pool.length === 0) pool = games;

            game = pool[Math.floor(Math.random() * pool.length)];
          }

          assigned = { name: game.game_name, image: game.image };
          history[day] = assigned;
          saveHistory(history);
          usedGames.add(assigned.name);
        }

        // ------------------ DETERMINE STATE ------------------
        const isPast = currentMonth === 11 && day < currentDay;
        const isToday = currentMonth === 11 && day === currentDay;
        const isFuture = currentMonth === 11 && day > currentDay;

        if (isFuture) {
          door.classList.add("locked");
        }

        if (isPast) {
          door.classList.add("opened");
          const img = document.createElement("img");
          img.src = assigned.image;
          door.insertBefore(img, check);
        }

        if (isToday) {
          door.classList.add("today");

          door.addEventListener("click", function openDoor() {
            if (doorSound) doorSound.play();
            door.style.opacity = 0;

            setTimeout(() => {
              popupImage.src = assigned.image;
              popupName.textContent = assigned.name;
              popup.classList.remove("hidden");

              door.style.opacity = 1;
              door.classList.add("opened");

              const img = document.createElement("img");
              img.src = assigned.image;
              door.insertBefore(img, check);
            }, 500);

            door.removeEventListener("click", openDoor);
          });
        }

        calendarEl.appendChild(door);
      }

    })
    .catch(err => console.error("ERROR loading games.json:", err));

  // ------------------ CLOSE POPUP ------------------
  if (closePopupBtn) {
    closePopupBtn.addEventListener("click", () => {
      popup.classList.add("hidden");
      popupImage.src = "";
      popupName.textContent = "";
    });
  }

});




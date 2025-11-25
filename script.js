document.addEventListener('DOMContentLoaded', () => {

  const calendarEl = document.getElementById('calendar');
  const popup = document.getElementById('popup');
  const popupImage = document.getElementById('popup-image');
  const popupName = document.getElementById('popup-name');
  const closePopupBtn = document.getElementById('close-popup');
  const doorSound = document.getElementById('door-sound');

  // ------------------ TEST MODE ------------------
  const TEST_MONTH = 11; 
  const TEST_DAY = 6;

  // ------------------ HISTORY FUNCTIONS ------------------
  function loadHistory() {
    return JSON.parse(localStorage.getItem("gameHistory") || "{}");
  }

  function saveHistory(history) {
    localStorage.setItem("gameHistory", JSON.stringify(history));
  }

  let history = loadHistory();

  fetch('games.json')
    .then(res => res.json())
    .then(games => {

      const fixedGames = games.filter(g => g.fixed_date);
      let flexibleGames = games.filter(g => !g.fixed_date);

      let shortGames = flexibleGames.filter(g => g.length === "short");
      let longGames = flexibleGames.filter(g => g.length === "long");

      const usedGames = new Set();

      for (let day = 1; day <= 25; day++) {

        const door = document.createElement('div');
        door.classList.add('door');

        const doorMonth = 11;
        const isToday = (day === TEST_DAY);
        const isPast = (day < TEST_DAY);
        const isFuture = (day > TEST_DAY);

        let game;

        // -------------- STEP 1: Check HISTORY first --------------
        if (history[day]) {
          game = history[day];
        } 
        else {
          // -------------- STEP 2: Check FIXED DATE --------------
          const fixed = fixedGames.find(g => {
            if (!g.fixed_date) return false;
            const parts = g.fixed_date.split("-");
            const fixedMonth = parseInt(parts[1], 10) - 1;
            const fixedDay = parseInt(parts[2], 10);
            return fixedMonth === doorMonth && fixedDay === day;
          });

          if (fixed) {
            game = fixed;
          } 
          else {
            // -------------- STEP 3: Smart scheduling logic --------------
            const dayOfWeek = new Date(2025, doorMonth, day).getDay();
            let pool = (dayOfWeek === 0 || dayOfWeek === 6) ? longGames : shortGames;
            pool = pool.filter(g => !usedGames.has(g.game_name));

            if (pool.length === 0) {
              pool = flexibleGames.filter(g => !usedGames.has(g.game_name));
            }
            if (pool.length === 0) {
              pool = games;
            }

            game = pool[Math.floor(Math.random() * pool.length)];
          }

          // -------------- SAVE new assignment to history --------------
          history[day] = game;
        }

        usedGames.add(game.game_name);

        door.dataset.gameName = game.game_name;
        door.dataset.gameImage = game.image;

        // ------------------ UI ELEMENTS ------------------
        const dayLabel = document.createElement("div");
        dayLabel.classList.add("door-day");
        dayLabel.textContent = day;

        const lock = document.createElement("div");
        lock.classList.add("lock-icon");
        lock.textContent = "🔒";

        const check = document.createElement("div");
        check.classList.add("checkmark");
        check.textContent = "✔️";

        door.appendChild(dayLabel);
        door.appendChild(check);
        door.appendChild(lock);

        // ------------------ DOOR STATE HANDLING ------------------

        // FUTURE
        if (isFuture) {
          door.classList.add('locked');
        }

        // PAST
        else if (isPast) {
          door.classList.add('opened');

          const img = document.createElement('img');
          img.src = game.image;
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'contain';

          door.insertBefore(img, dayLabel);
        }

        // TODAY
        else if (isToday) {
          door.innerHTML = "";
          door.appendChild(dayLabel);

          door.addEventListener('click', function openTodayDoor() {
            if (!door.dataset.gameName) return;

            if (doorSound) doorSound.play();

            door.style.opacity = 0;

            setTimeout(() => {
              popupImage.src = game.image;
              popupName.textContent = game.game_name;
              popup.classList.remove('hidden');

              door.innerHTML = "";

              const img = document.createElement('img');
              img.src = game.image;
              img.style.width = '100%';
              img.style.height = '100%';
              img.style.objectFit = 'contain';

              door.appendChild(img);

              const check = document.createElement("div");
              check.classList.add("checkmark");
              check.textContent = "✔️";
              door.appendChild(check);

              dayLabel.style.position = "absolute";
              dayLabel.style.top = "6px";
              dayLabel.style.right = "6px";
              dayLabel.style.left = "auto";
              dayLabel.style.transform = "none";
              dayLabel.style.zIndex = "10";

              door.appendChild(dayLabel);

              door.classList.add('opened');
              door.style.opacity = 1;

              // -------------- SAVE HISTORY after opening --------------
              history[day] = game;
              saveHistory(history);

            }, 600);

            door.removeEventListener('click', openTodayDoor);
          });
        }

        calendarEl.appendChild(door);
      }

      // SAVE history immediately (for fixed assignments)
      saveHistory(history);

    })
    .catch(err => console.error('Error loading games.json:', err));

  // ------------------ Close popup ------------------
  if (closePopupBtn) {
    closePopupBtn.addEventListener('click', () => {
      popup.classList.add('hidden');
      popupImage.src = '';
      popupName.textContent = '';
    });
  }

});

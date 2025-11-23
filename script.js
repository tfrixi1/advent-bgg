document.addEventListener('DOMContentLoaded', () => {

  const calendarEl = document.getElementById('calendar');
  const popup = document.getElementById('popup');
  const popupImage = document.getElementById('popup-image');
  const popupName = document.getElementById('popup-name');
  const closePopupBtn = document.getElementById('close-popup');
  const doorSound = document.getElementById('door-sound');

  // ------------------ TEST SETTING ------------------
  const TEST_MONTH = 11; // December (0-indexed)
  const TEST_DAY = 3;    // Change this to test today

  fetch('games.json')
    .then(res => res.json())
    .then(games => {

      const fixedGames = games.filter(g => g.fixed_date);
      let flexibleGames = games.filter(g => !g.fixed_date);

      let shortGames = flexibleGames.filter(g => g.length === "short");
      let longGames = flexibleGames.filter(g => g.length === "long");

      const usedGames = new Set();

      for (let i = 1; i <= 25; i++) {
        const door = document.createElement('div');
        door.classList.add('door');

        // ------------------ Determine door status ------------------
        const doorDay = i;
        const doorMonth = 11; // December

        const isToday = (doorDay === TEST_DAY && doorMonth === TEST_MONTH);
        const isPast = (doorDay < TEST_DAY && doorMonth === TEST_MONTH);
        const isFuture = (doorDay > TEST_DAY && doorMonth === TEST_MONTH);

        // ------------------ Assign game ------------------
        let game;
        const fixed = fixedGames.find(g => {
          if (!g.fixed_date) return false;
          const dateParts = g.fixed_date.split('-'); // "YYYY-MM-DD"
          const fixedMonth = parseInt(dateParts[1], 10) - 1; // 0-indexed
          const fixedDay = parseInt(dateParts[2], 10);
          return fixedMonth === doorMonth && fixedDay === doorDay;
        });

        if (fixed) {
          game = fixed;
        } else {
          const dayOfWeek = new Date(2025, doorMonth, doorDay).getDay();
          let pool = (dayOfWeek === 0 || dayOfWeek === 6) ? longGames : shortGames;
          pool = pool.filter(g => !usedGames.has(g.game_name));

          if (pool.length === 0) {
            pool = flexibleGames.filter(g => !usedGames.has(g.game_name));
          }
          if (pool.length === 0) {
            pool = games; // fallback
          }

          game = pool[Math.floor(Math.random() * pool.length)];
        }

        usedGames.add(game.game_name);
        door.dataset.gameName = game.game_name;
        door.dataset.gameImage = game.image;

        // ------------------ Display behavior ------------------
        if (isFuture) {
          door.classList.add('locked');
          door.innerHTML = `<span class="lock-icon">🔒</span>`;
        }

        else if (isPast) {
          // Past doors show the image + CSS checkmark
          door.innerHTML = `
            <img src="${game.image}">
            <span class="checkmark"></span>
          `;
        }

        else if (isToday) {
          // Today shows the day number until opened
          door.innerHTML = `<span class="day-number">${i}</span>`;

          door.addEventListener('click', function openTodayDoor() {
            if (!door.dataset.gameName) return;

            // Play sound
            if (doorSound) doorSound.play();

            // Fade out
            door.style.opacity = 0;

            setTimeout(() => {
              // Show popup
              popupImage.src = door.dataset.gameImage;
              popupName.textContent = door.dataset.gameName;
              popup.classList.remove('hidden');

              // Replace door content with the game image + green checkmark
              door.style.opacity = 1;
              door.innerHTML = `
                <img src="${door.dataset.gameImage}">
                <span class="checkmark"></span>
              `;

            }, 600);

            door.removeEventListener('click', openTodayDoor);
          });
        }

        calendarEl.appendChild(door);
      }

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

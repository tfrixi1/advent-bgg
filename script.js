document.addEventListener('DOMContentLoaded', () => {

  // ---------- Helper function to compare only year/month/day ----------
  function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  const calendarEl = document.getElementById('calendar');
  const popup = document.getElementById('popup');
  const popupImage = document.getElementById('popup-image');
  const popupName = document.getElementById('popup-name');
  const closePopupBtn = document.getElementById('close-popup');
  const doorSound = document.getElementById('door-sound');

  // ---------- Set "today" for testing ----------
  const today = new Date('2025-12-15'); // Change this to test different days
  today.setHours(0,0,0,0);

  fetch('games.json')
    .then(res => res.json())
    .then(games => {

      const fixedGames = games.filter(g => g.fixed_date);
      let flexibleGames = games.filter(g => !g.fixed_date);

      let shortGames = flexibleGames.filter(g => g.length === "short");
      let longGames = flexibleGames.filter(g => g.length === "long");

      const usedGames = new Set();

      for(let i=1; i<=25; i++){
        const door = document.createElement('div');
        door.classList.add('door');

        // ---------- Reliable door date ----------
        const doorDate = new Date(2025, 11, i); // month 11 = December
        doorDate.setHours(0,0,0,0);

        const isToday = isSameDay(doorDate, today);
        const isPast = doorDate < today && !isToday;
        const isFuture = doorDate > today && !isToday;

        // ---------- Assign game ----------
        let game;
        const fixed = fixedGames.find(g => {
          const fixedDate = new Date(g.fixed_date);
          fixedDate.setHours(0,0,0,0);
          return isSameDay(fixedDate, doorDate);
        });

        if(fixed){
          game = fixed;
        } else {
          const day = doorDate.getDay(); // 0=Sun,6=Sat
          let pool = (day === 0 || day === 6) ? longGames : shortGames;
          pool = pool.filter(g => !usedGames.has(g.game_name));
          if(pool.length === 0){
            pool = flexibleGames.filter(g => !usedGames.has(g.game_name));
          }
          if(pool.length === 0){
            pool = games; // final fallback
          }
          game = pool[Math.floor(Math.random() * pool.length)];
        }

        usedGames.add(game.game_name);
        door.dataset.gameName = game.game_name;
        door.dataset.gameImage = game.image;

        // ---------- Display behavior ----------
        if(isFuture){
          door.classList.add('locked');
          door.textContent = '🔒';
        } else if(isPast){
          const img = document.createElement('img');
          img.src = game.image;
          img.style.display = 'block';
          door.appendChild(img);
          door.innerHTML += `<span class="checkmark">✔</span>`;
        } else if(isToday){
          door.textContent = i;

          // Attach click listener for today
          door.addEventListener('click', function openTodayDoor() {
            if(!door.dataset.gameName) return;

            // Play sound
            if(doorSound) doorSound.play();

            // Fade out door
            door.style.opacity = 0;

            setTimeout(() => {
              // Show popup
              popupImage.src = door.dataset.gameImage;
              popupName.textContent = door.dataset.gameName;
              popup.classList.remove('hidden');

              // Mark door as opened
              door.style.opacity = 1;
              door.innerHTML = `<img src="${door.dataset.gameImage}" style="display:block;"><span class="checkmark">✔</span>`;
            }, 600);

            // Remove listener so it doesn’t trigger again
            door.removeEventListener('click', openTodayDoor);
          });
        }

        calendarEl.appendChild(door);
      }

    })
    .catch(err => console.error('Error loading games.json:', err));

  // ---------- Close popup ----------
  if(closePopupBtn){
    closePopupBtn.addEventListener('click', () => {
      popup.classList.add('hidden');
      popupImage.src = '';
      popupName.textContent = '';
    });
  }

});

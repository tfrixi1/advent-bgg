document.addEventListener('DOMContentLoaded', () => {

  const calendarEl = document.getElementById('calendar');
  const popup = document.getElementById('popup');
  const popupImage = document.getElementById('popup-image');
  const popupName = document.getElementById('popup-name');
  const closePopupBtn = document.getElementById('close-popup');
  const doorSound = document.getElementById('door-sound');

  const today = new Date();
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

        const doorDate = new Date(`2025-12-${i}`);
        doorDate.setHours(0,0,0,0);

        const isPast = doorDate < today;
        const isToday = doorDate.getTime() === today.getTime();
        const isFuture = doorDate > today;

        // Assign game
        let game;
        const fixed = fixedGames.find(g => {
          const fixedDate = new Date(g.fixed_date);
          fixedDate.setHours(0,0,0,0);
          return fixedDate.getTime() === doorDate.getTime();
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
          // Fallback if no game available
          if(pool.length === 0){
            console.warn(`No available game for day ${i}`);
            continue; // skip this door
          }
          game = pool[Math.floor(Math.random() * pool.length)];
        }

        usedGames.add(game.game_name);
        door.dataset.gameName = game.game_name;
        door.dataset.gameImage = game.image;

        // Display behavior
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
          door.addEventListener('click', () => openDoor(door));
        }

        calendarEl.appendChild(door);
      }
    });

  function openDoor(door){
    if(!door.dataset.gameName) return; // safeguard
    doorSound.play();
    door.style.opacity = 0;
    setTimeout(() => {
      popupImage.src = door.dataset.gameImage;
      popupName.textContent = door.dataset.gameName;
      popup.classList.remove('hidden');
      door.style.opacity = 1;
      door.innerHTML = `<img src="${door.dataset.gameImage}" style="display:block;"><span class="checkmark">✔</span>`;
    }, 600);
  }

  closePopupBtn.addEventListener('click', () => {
    popup.classList.add('hidden');
  });

});

const calendarEl = document.getElementById('calendar');
const popup = document.getElementById('popup');
const popupImage = document.getElementById('popup-image');
const popupName = document.getElementById('popup-name');
const closePopupBtn = document.getElementById('close-popup');
const doorSound = document.getElementById('door-sound');

let today = new Date();
today.setHours(0,0,0,0);

fetch('games.json')
  .then(res => res.json())
  .then(games => {
    // Split fixed and flexible games
    const fixedGames = games.filter(g => g.fixed_date);
    let flexibleGames = games.filter(g => !g.fixed_date);

    // Separate by length for smart scheduling
    let shortGames = flexibleGames.filter(g => g.length === "short");
    let longGames = flexibleGames.filter(g => g.length === "long");

    const usedGames = new Set();

    for(let i=1; i<=25; i++){
      const door = document.createElement('div');
      door.classList.add('door');

      // Random door size
      const sizes = ['small','medium','large'];
      door.classList.add(sizes[Math.floor(Math.random()*sizes.length)]);

      const doorDate = new Date(`2025-12-${i}`);
      const isPast = doorDate < today;
      const isToday = doorDate.getTime() === today.getTime();
      const isFuture = doorDate > today;

      // Assign game
      let game;
      const fixed = fixedGames.find(g => new Date(g.fixed_date).getDate() === i);
      if(fixed) {
        game = fixed;
      } else {
        // Smart scheduling
        const day = doorDate.getDay(); // 0=Sun, 6=Sat
        let pool = (day === 0 || day === 6) ? longGames : shortGames;

        // Pick a random game from pool that hasn’t been used
        pool = pool.filter(g => !usedGames.has(g.game_name));
        if(pool.length === 0){ // fallback if exhausted
          pool = flexibleGames.filter(g => !usedGames.has(g.game_name));
        }
        game = pool[Math.floor(Math.random() * pool.length)];
      }

      usedGames.add(game.game_name);
      door.dataset.gameName = game.game_name;
      door.dataset.gameImage = game.image;

      // Display behavior
      if(isFuture){
        door.classList.add('locked');
        door.innerHTML = '🔒';
      } else if(isPast){
        const img = document.createElement('img');
        img.src = game.image;
        img.style.display = 'block';
        door.appendChild(img);
        door.innerHTML += `<span class="checkmark">✔</span>`;
      } else {
        door.textContent = i;
        door.addEventListener('click', () => openDoor(door));
      }

      calendarEl.appendChild(door);
    }
  });

function openDoor(door){
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

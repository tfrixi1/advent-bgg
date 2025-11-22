document.addEventListener('DOMContentLoaded', () => {
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
      // (all your calendar generation code goes here)
    });

  closePopupBtn.addEventListener('click', () => {
    popup.classList.add('hidden');
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
});

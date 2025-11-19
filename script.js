document.addEventListener("DOMContentLoaded", function () {
  const popupEl = document.getElementById("popup");
  const revealBtn = document.getElementById("revealButton");
  const csvInput = document.getElementById("csvInput");
  const jingleAudio = document.getElementById("jingle");
  const gameNameEl = document.getElementById("gameName");
  const gameImageEl = document.getElementById("gameImage");

  let games = [];
  let usedGames = [];

  // 1. Make sure popup is hidden at the very beginning
  if (popupEl) {
    popupEl.classList.add("hidden");
  }

  csvInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      const text = event.target.result;
      parseCSV(text);
      revealBtn.disabled = false;
    };
    reader.readAsText(file);
  });

  function parseCSV(text) {
    const rows = text.split("\n").map(r => r.trim()).filter(r => r);
    if (rows[0] && rows[0].toLowerCase().includes("name")) {
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
    return day === 0 || day === 6;
  }

  function getTodayString() {
    return new Date().toISOString().split("T")[0];
  }

  function getGameForToday() {
    const today = getTodayString();
    const fixed = games.find(g => g.fixedDate === today);
    if (fixed) return fixed;

    const todayDate = new Date();
    let pool;
    if (isWeekend(todayDate)) {
      pool = games.filter(g => g.length === "long" || g.length === "medium");
    } else {
      pool = games.filter(g => g.length === "short" || g.length === "medium");
    }

    pool = pool.filter(g => !usedGames.includes(g.name));
    if (pool.length === 0) {
      usedGames = [];
      pool = games.filter(g => !usedGames.includes(g.name));
    }

    let weightedPool = [];
    pool.forEach(g => {
      if (g.length === "medium") {
        weightedPool.push(g, g);
      } else {
        weightedPool.push(g);
      }
    });

    const pick = weightedPool[Math.floor(Math.random() * weightedPool.length)];
    usedGames.push(pick.name);
    return pick;
  }

  revealBtn.addEventListener("click", () => {
    if (!games.length) {
      alert("Please upload your CSV first.");
      return;
    }

    const game = getGameForToday();
    if (!game) {
      alert("Couldn't pick a game. Check your CSV!");
      return;
    }

    gameNameEl.textContent = game.name;
    gameImageEl.src = game.imageUrl;

    if (jingleAudio) {
      jingleAudio.currentTime = 0;
      jingleAudio.play();
    }

    popupEl.classList.remove("hidden");
  });

  // Close popup when you click *outside* the box
  popupEl.addEventListener("click", function (e) {
    // If clicked exactly on the overlay, not inside the popup content
    if (e.target === popupEl) {
      popupEl.classList.add("hidden");
    }
  });
});


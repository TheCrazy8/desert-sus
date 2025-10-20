(() => {
  // Config (match original where sensible)
  const durationSeconds = 8 * 60 * 60; // unused, but kept
  const roadWidth = 200;
  const busWidth = 40;
  const busHeight = 60; // taller
  const busSpeed = 10; // px per move
  const updateInterval = 100; // ms
  const veerChance = 0.05; // 5% per tick
  const invertChance = 0.10; // 10% per key press
  const breakdownPerMove = 0.0000001; // 1e-7
  const dysenteryPerMove = 0.0000001; // 1e-7

  // Canvas setup with proper pixel ratio
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });

  function resizeCanvas() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = Math.floor(window.innerWidth);
    const h = Math.floor(window.innerHeight);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Game state
  let gameVars = null;
  function resetGameVars() {
    const ww = canvas.width / (window.devicePixelRatio || 1);
    const wh = canvas.height / (window.devicePixelRatio || 1);
    return {
      bus_x: Math.floor((ww - busWidth) / 2),
      bus_y: Math.floor(wh / 2),
      facing: 1, // 1 right, -1 left, 0 none
      game_over: false,
      reason: '',
    };
  }
  gameVars = resetGameVars();

  // Input
  document.addEventListener('keydown', (e) => {
    if (gameVars.game_over) {
      if (e.key === 'r' || e.key === 'R') {
        gameVars = resetGameVars();
      }
      return;
    }

    const invert = Math.random() < invertChance;
    if (e.key === 'ArrowLeft') {
      gameVars.facing = invert ? 1 : -1;
      primeAudio(); // first user action primes audio if needed
    } else if (e.key === 'ArrowRight') {
      gameVars.facing = invert ? -1 : 1;
      primeAudio();
    }
  });

  // Drawing helpers
  function drawDesert(roadLeft, roadRight, ww, wh) {
    // sand background
    ctx.fillStyle = '#EDC9Af';
    ctx.fillRect(0, 0, ww, wh);

    // features
    for (let i = 0; i < 15; i++) {
      const x = Math.floor(Math.random() * ww);
      const y = Math.floor(Math.random() * wh);
      if (x < roadLeft || x > roadRight) {
        if (Math.random() < 0.5) {
          // cactus
          ctx.fillStyle = '#228B22';
          // main stem
          ctx.fillRect(x, y, 8, 40);
          // left arm
          if (Math.random() < 0.5) ctx.fillRect(x - 6, y + 15, 8, 10);
          // right arm
          if (Math.random() < 0.5) ctx.fillRect(x + 6, y + 20, 8, 10);
        } else {
          // rock
          ctx.fillStyle = '#A0522D';
          ctx.beginPath();
          ctx.ellipse(x + 9, y + 6, 9, 6, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  function drawGame() {
    const ww = canvas.width / (window.devicePixelRatio || 1);
    const wh = canvas.height / (window.devicePixelRatio || 1);
    const roadLeft = Math.floor((ww - roadWidth) / 2);
    const roadRight = roadLeft + roadWidth;

    // background + road
    drawDesert(roadLeft, roadRight, ww, wh);
    ctx.fillStyle = 'gray';
    ctx.fillRect(roadLeft, 0, roadWidth, wh);

    // bus
    ctx.fillStyle = 'yellow';
    ctx.fillRect(gameVars.bus_x, gameVars.bus_y, busWidth, busHeight);

    // game over overlay
    if (gameVars.game_over) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, ww, wh);

      ctx.fillStyle = 'red';
      ctx.font = 'bold 32px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(gameVars.reason || 'GAME OVER', ww / 2, wh / 2 - 20);

      ctx.fillStyle = 'white';
      ctx.font = '16px Inter, sans-serif';
      ctx.fillText('Press R to Restart', ww / 2, wh / 2 + 16);
    }
  }

  // Game loop
  function step() {
    if (!gameVars.game_over) {
      // Random breakdown
      if (Math.random() < breakdownPerMove) {
        gameVars.game_over = true;
        gameVars.reason = 'BREAKDOWN!';
      }

      // Random dysentery
      if (!gameVars.game_over && Math.random() < dysenteryPerMove) {
        gameVars.game_over = true;
        gameVars.reason = 'You died of dysentery!';
      }

      // Move sideways if veer or input
      if (!gameVars.game_over) {
        let moved = false;

        if (Math.random() < veerChance) {
          const direction = Math.random() < 0.5 ? -1 : 1;
          gameVars.bus_x += direction * busSpeed;
          moved = true;
        } else if (gameVars.facing !== 0) {
          gameVars.bus_x += gameVars.facing * busSpeed;
          moved = true;
        }
        // one-tick input
        gameVars.facing = 0;

        // off-road check
        const ww = canvas.width / (window.devicePixelRatio || 1);
        const roadLeft = Math.floor((ww - roadWidth) / 2);
        const roadRight = roadLeft + roadWidth;
        if (gameVars.bus_x < roadLeft || gameVars.bus_x + busWidth > roadRight) {
          gameVars.game_over = true;
          gameVars.reason = 'OFF ROAD!';
        }
      }
    }

    drawGame();
  }

  const loop = setInterval(step, updateInterval);

  // Annoying popups
  const adPopupRef = { el: null };
  let edo = 0;

  const word_list = ["apple","mountain","computer","river","book","forest","ocean","car","house","music",
    "dog","city","garden","train","cloud","desk","bridge","star","tree","phone",
    "chair","window","beach","plane","flower","castle","lamp","boat","clock","road",
    "school","camera","horse","island","tower","lake","shoe","door","cat","field",
    "street","cup","hat","table","wall","bed","ring","stone","bird","pen"];

  const word_list1 = ["happy","blue","quick","bright","cold","silent","fuzzy","shiny","brave","loud",
    "gentle","bitter","soft","tall","rough","smooth","tiny","huge","ancient","fresh",
    "curious","warm","sharp","calm","dark","sweet","deep","heavy","light","wild",
    "elegant","greedy","fragile","bold","lazy","wise","red","green","young","old",
    "messy","clean","thick","thin","dull","funny","sad","clear","serious","short"];

  const word_list2 = ["running","jumping","swimming","reading","writing","singing","dancing","laughing","drawing","playing",
    "walking","talking","cooking","driving","painting","flying","hiking","building","coding","gaming",
    "spinning","sailing","shooting","hunting","thinking","skating","sketching","racing","baking","brewing",
    "smiling","cheering","yelling","whispering","posing","gliding","floating","climbing","drifting","buzzing",
    "charging","dashing","sprinting","strolling","snoozing","dreaming","beeping","booming","ringing","dinging"];

  function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function removeAd() {
    if (adPopupRef.el && adPopupRef.el.isConnected) {
      adPopupRef.el.remove();
    }
    adPopupRef.el = null;
  }

  function shake(el) {
    const rect = el.getBoundingClientRect();
    const baseLeft = rect.left;
    const baseTop = rect.top;
    const steps = 10;
    for (let i = 0; i < steps; i++) {
      setTimeout(() => {
        const dx = randomBetween(-10, 10);
        const dy = randomBetween(-10, 10);
        el.style.left = `${Math.max(0, baseLeft + dx)}px`;
        el.style.top = `${Math.max(0, baseTop + dy)}px`;
      }, i * 30);
    }
  }

  function colorFlash(el) {
    const colors = ["#fffbe6","#ffcccc","#ccffcc","#ccccff","#ffff99","#ff99ff","#99ffff"];
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      setTimeout(() => {
        if (i < steps) {
          el.style.background = colors[Math.floor(Math.random() * colors.length)];
        } else {
          el.style.background = 'var(--ad-bg)';
        }
      }, i * 60);
    }
  }

  let audioCtx = null;
  let audioPrimed = false;

  function primeAudio() {
    if (!audioPrimed) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioPrimed = true;
      } catch (_) {
        // ignore
      }
    }
  }

  function beep() {
    if (!audioPrimed || !audioCtx) return;
    try {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'square';
      o.frequency.value = 880;
      g.gain.value = 0.0001; // start silent to avoid pop
      o.connect(g).connect(audioCtx.destination);
      const now = audioCtx.currentTime;
      g.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      o.start(now);
      o.stop(now + 0.22);
    } catch (_) {
      // ignore
    }
  }

  function spawnAd() {
    // Close previous ad if exists
    removeAd();

    const ad = document.createElement('div');
    ad.className = 'ad-popup';
    ad.style.left = '0px';
    ad.style.top = '0px';

    const header = document.createElement('div');
    header.className = 'ad-header';
    header.textContent = 'Special Offer!';
    ad.appendChild(header);

    const body = document.createElement('div');
    body.className = 'ad-body';
    const text = document.createElement('div');
    text.className = 'ad-text';

    const random_noun = word_list[Math.floor(Math.random() * word_list.length)];
    const random_adj = word_list1[Math.floor(Math.random() * word_list1.length)];
    const random_verb = word_list2[Math.floor(Math.random() * word_list2.length)];
    let eggo = `🔥 ${random_adj.toUpperCase()} ${random_verb.toUpperCase()} ${random_noun.toUpperCase()}™ 🔥\nBuy now at www.soundproofmichael.wave!`;
    edo += 1;
    if (eggo.toLowerCase().startsWith('🔥 soundproof michael wave™')) {
      eggo = `🔥 SOUNDPROOF MICHAEL WAVE™ 🔥\nBuy now at www.soundproofmichael.wave!\nIt took ${edo} ads to get THE TRUE AD.`;
    }
    text.textContent = eggo;
    body.appendChild(text);
    ad.appendChild(body);

    // Position inside viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const maxX = Math.max(0, vw - 400);
    const maxY = Math.max(0, vh - 120);
    ad.style.left = `${randomBetween(0, maxX)}px`;
    ad.style.top = `${randomBetween(0, maxY)}px`;

    // Create multiple teleporting close buttons
    const escapeCounter = { count: 0, max: randomBetween(5, 12) };
    const btnCount = randomBetween(2, 5);
    for (let i = 0; i < btnCount; i++) {
      const btn = document.createElement('button');
      btn.className = 'ad-close';
      btn.textContent = '✖';
      btn.style.left = `${randomBetween(0, 320)}px`;
      btn.style.top = `${randomBetween(0, 90)}px`;
      btn.addEventListener('mouseenter', () => {
        const newX = randomBetween(0, 400 - 80);
        const newY = randomBetween(0, 120 - 30);
        btn.style.left = `${newX}px`;
        btn.style.top = `${newY}px`;
        escapeCounter.count++;
        if (escapeCounter.count >= escapeCounter.max) {
          removeAd();
        }
      });
      btn.addEventListener('click', () => removeAd());
      ad.appendChild(btn);
    }

    document.body.appendChild(ad);
    adPopupRef.el = ad;

    // Annoyances
    shake(ad);
    colorFlash(ad);
    beep();

    // Schedule next popup 2–8s
    setTimeout(spawnAd, randomBetween(2000, 8000));
  }

  // Start everything
  spawnAd();
  drawGame();
})();

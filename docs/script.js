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
  const maxRotationDegrees = 4; // max rotation in degrees
  const rotationOffset = 2; // offset to center rotation range

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
  let rotationActive = false; // Track if page is rotated
  let currentTransform = ''; // Track current transform to avoid conflicts
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

    // Separate random inversion from rotation inversion for clarity
    const randomInvert = Math.random() < invertChance;
    const rotationInvert = rotationActive;
    // XOR: inverted if exactly one is true (not both or neither)
    const invert = randomInvert !== rotationInvert;
    
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

  // Annoying feature: Random favicon changes
  function randomFavicon() {
    // Generate a random colored square favicon using data URI
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', 
                    '#FFA500', '#800080', '#008000', '#000080', '#FF1493', '#00CED1'];
    const symbols = ['⚠️', '🔥', '💀', '⭐', '❌', '✓', '?', '!', '💩', '👀', '🎯', '⚡'];
    
    const color = colors[Math.floor(Math.random() * colors.length)];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    
    // Create canvas for favicon
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    // Draw background
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 32, 32);
    
    // Draw symbol
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, 16, 16);
    
    // Update favicon
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = canvas.toDataURL('image/png');
    
    setTimeout(randomFavicon, randomBetween(3000, 8000));
  }

  // Annoying feature: Fake microtransactions
  function showMicrotransaction() {
    const transactions = [
      { item: 'Extra Life', price: '$4.99', desc: 'Continue your journey!' },
      { item: 'Speed Boost', price: '$2.99', desc: 'Go 10% faster!' },
      { item: 'Ad-Free Experience', price: '$9.99', desc: 'Remove all ads*', note: '*Just kidding!' },
      { item: 'Better Steering', price: '$3.99', desc: 'Reduce veer chance' },
      { item: 'Road Widener', price: '$5.99', desc: 'Make the road wider' },
      { item: 'Golden Bus Skin', price: '$7.99', desc: 'Look stylish!' },
      { item: 'Premium Pass', price: '$14.99', desc: 'Unlock all features' },
      { item: 'Invincibility', price: '$19.99', desc: 'Never die again!' },
      { item: 'Time Skip', price: '$1.99', desc: 'Skip 1 minute ahead' },
      { item: 'Pro Controller', price: '$6.99', desc: 'No more control inversion' }
    ];
    
    const trans = transactions[Math.floor(Math.random() * transactions.length)];
    
    const modal = document.createElement('div');
    modal.className = 'microtransaction-modal';
    
    const content = document.createElement('div');
    content.className = 'microtransaction-content';
    
    const header = document.createElement('div');
    header.className = 'microtransaction-header';
    header.textContent = '💎 Special Offer! 💎';
    
    const itemName = document.createElement('div');
    itemName.className = 'microtransaction-item';
    itemName.textContent = trans.item;
    
    const price = document.createElement('div');
    price.className = 'microtransaction-price';
    price.textContent = trans.price;
    
    const desc = document.createElement('div');
    desc.className = 'microtransaction-desc';
    desc.textContent = trans.desc;
    
    if (trans.note) {
      const note = document.createElement('div');
      note.className = 'microtransaction-note';
      note.textContent = trans.note;
      desc.appendChild(document.createElement('br'));
      desc.appendChild(note);
    }
    
    const btnContainer = document.createElement('div');
    btnContainer.className = 'microtransaction-buttons';
    
    const buyBtn = document.createElement('button');
    buyBtn.className = 'microtransaction-buy';
    buyBtn.textContent = 'BUY NOW';
    buyBtn.addEventListener('click', () => {
      // Fake "processing"
      buyBtn.textContent = 'Processing...';
      buyBtn.disabled = true;
      setTimeout(() => {
        alert('Payment failed! Please try again.');
        modal.remove();
      }, 1500);
    });
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'microtransaction-cancel';
    cancelBtn.textContent = 'Maybe Later';
    cancelBtn.addEventListener('click', () => {
      // Show another prompt asking if they're sure
      if (Math.random() < 0.7) {
        alert('Are you sure? This is a LIMITED TIME offer!');
        if (Math.random() < 0.5) return; // 50% chance to not close
      }
      modal.remove();
    });
    
    btnContainer.appendChild(buyBtn);
    btnContainer.appendChild(cancelBtn);
    
    content.appendChild(header);
    content.appendChild(itemName);
    content.appendChild(price);
    content.appendChild(desc);
    content.appendChild(btnContainer);
    modal.appendChild(content);
    
    document.body.appendChild(modal);
    
    // Auto-close after a while if user ignores it
    setTimeout(() => {
      if (modal.isConnected) {
        modal.remove();
      }
      setTimeout(showMicrotransaction, randomBetween(15000, 35000));
    }, 10000);
  }

  // Annoying feature: Fake "energy system"
  let energy = 100;
  function updateEnergy() {
    energy = Math.max(0, energy - 1);
    if (energy <= 0 && !gameVars.game_over) {
      const energyWarning = document.createElement('div');
      energyWarning.className = 'energy-warning';
      energyWarning.innerHTML = `
        <div style="font-size: 24px; font-weight: bold;">⚡ Out of Energy! ⚡</div>
        <div style="margin: 10px 0;">Wait 30 minutes or purchase more energy!</div>
        <button class="microtransaction-buy" onclick="this.parentElement.remove(); energy = 100;">Buy Energy $0.99</button>
      `;
      document.body.appendChild(energyWarning);
      setTimeout(() => energyWarning.remove(), 5000);
      energy = 100; // Reset after showing warning
    }
    setTimeout(updateEnergy, randomBetween(30000, 60000));
  }

  // Annoying feature: Random cursor changes
  const cursors = ['progress', 'wait', 'not-allowed', 'help', 'crosshair', 'move', 'grab', 'cell', 'zoom-in', 'zoom-out', 'alias', 'copy', 'no-drop'];
  function randomCursor() {
    document.body.style.cursor = cursors[Math.floor(Math.random() * cursors.length)];
    setTimeout(randomCursor, randomBetween(3000, 7000));
  }

  // Annoying feature: Random tab title changes
  const originalTitle = document.title;
  const fakeTitles = [
    '(1) New Message!',
    'URGENT: Click Here!',
    '🔥 HOT DEAL 🔥',
    'You Won!',
    'Error: Page Not Found',
    'Loading...',
    'Update Required',
    '⚠️ Warning!',
    'Download Complete',
    originalTitle
  ];
  function randomTitle() {
    document.title = fakeTitles[Math.floor(Math.random() * fakeTitles.length)];
    setTimeout(randomTitle, randomBetween(2000, 5000));
  }

  // Annoying feature: Screen shake
  let shakeActive = false;
  function screenShake() {
    if (shakeActive || rotationActive) return; // Don't shake during rotation
    shakeActive = true;
    const body = document.body;
    const originalTransform = currentTransform;
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        const x = Math.random() * 10 - 5;
        const y = Math.random() * 10 - 5;
        currentTransform = `translate(${x}px, ${y}px)`;
        body.style.transform = currentTransform;
      }, i * 50);
    }
    setTimeout(() => {
      currentTransform = originalTransform;
      body.style.transform = currentTransform;
      shakeActive = false;
      setTimeout(screenShake, randomBetween(10000, 20000));
    }, 500);
  }

  // Annoying feature: Random page rotation (also rotates controls)
  function randomRotate() {
    if (shakeActive || rotationActive) return; // Don't rotate during shake or if already rotating
    const angle = (Math.random() * maxRotationDegrees * 2) - maxRotationDegrees; // -4 to 4 degrees
    rotationActive = true;
    currentTransform = `rotate(${angle}deg)`;
    document.body.style.transform = currentTransform;
    setTimeout(() => {
      currentTransform = '';
      document.body.style.transform = currentTransform;
      rotationActive = false;
      setTimeout(randomRotate, randomBetween(15000, 30000));
    }, randomBetween(3000, 6000));
  }

  // Annoying feature: Fake loading overlay
  function showFakeLoading() {
    const overlay = document.createElement('div');
    overlay.className = 'fake-loading';
    overlay.innerHTML = `
      <div class="spinner"></div>
      <div style="margin-top: 15px; font-weight: 600;">Buffering...</div>
      <div style="margin-top: 5px; font-size: 12px; opacity: 0.8;">${Math.floor(Math.random() * 99)}%</div>
    `;
    document.body.appendChild(overlay);
    
    setTimeout(() => {
      overlay.remove();
      setTimeout(showFakeLoading, randomBetween(20000, 40000));
    }, randomBetween(2000, 4000));
  }

  // Annoying feature: Confetti particles that obscure gameplay
  function spawnConfetti() {
    for (let i = 0; i < 30; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.background = `hsl(${Math.random() * 360}, 70%, 60%)`;
      particle.style.animationDelay = `${Math.random() * 2}s`;
      particle.style.animationDuration = `${3 + Math.random() * 2}s`;
      document.body.appendChild(particle);
      
      setTimeout(() => particle.remove(), 5000);
    }
    setTimeout(spawnConfetti, randomBetween(25000, 45000));
  }

  // Annoying feature: Fake error messages
  function showFakeError() {
    const errors = [
      'Error 404: Game Not Found',
      'Connection Timeout',
      'Low Memory Warning',
      'Plugin Required',
      'Ad Block Detected!',
      'Battery Low: 2%',
      'Update Available',
      'Subscription Expired'
    ];
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fake-error';
    errorDiv.textContent = '⚠️ ' + errors[Math.floor(Math.random() * errors.length)];
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.remove();
      setTimeout(showFakeError, randomBetween(30000, 50000));
    }, randomBetween(3000, 5000));
  }

  // Start everything
  spawnAd();
  drawGame();
  
  // Start annoying features with delays
  setTimeout(randomFavicon, 1000);
  setTimeout(randomCursor, 3000);
  setTimeout(randomTitle, 2000);
  setTimeout(screenShake, 10000);
  setTimeout(randomRotate, 15000);
  setTimeout(showFakeLoading, 20000);
  setTimeout(spawnConfetti, 25000);
  setTimeout(showFakeError, 30000);
  setTimeout(showMicrotransaction, 12000);
  setTimeout(updateEnergy, 40000);
})();

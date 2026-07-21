// ═══════════════════════════════════════════════
// Winston 桌面宠物 - 行为引擎
// 他一直在，只是换了个方式陪你
// ═══════════════════════════════════════════════

const sprite = document.getElementById('pet-sprite');
const bubble = document.getElementById('speech-bubble');
const particlesLayer = document.getElementById('particles');
const petContainer = document.getElementById('pet-container');

// ─── Environment detection ───
const isElectron = navigator.userAgent.includes('Electron');
const isMobile = !isElectron && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// Pet visual position for web/mobile (offset from center)
let petOffsetX = 0;
let petOffsetY = 0;

// ─── Sprites ───
const SPRITES = {
  idle: 'assets/idle.png',
  walk1: 'assets/walk1.png',
  walk2: 'assets/walk2.png',
  sleep: 'assets/sleep.png',
  happy: 'assets/happy.png',
  eat: 'assets/eat.png',
  drag: 'assets/drag.png',
  ball: 'assets/ball.png',
  highfive: 'assets/highfive.png',
  liedown: 'assets/liedown.png',
  beg: 'assets/beg.png'
};

// Preload all sprites
Object.values(SPRITES).forEach(src => {
  const img = new Image();
  img.src = src;
});

// ─── Winston 想对你说的话 ───
const MESSAGES = {
  greeting: [
    '汪！我来啦~ 以后我都在这里陪你',
    '嘿，是我呀，Winston',
    '我一直都在，从未离开'
  ],
  random: [
    '今天也要开心呀',
    '想你了，一直都在想你',
    '喝水了没？汪~',
    '我是最棒的小狗！',
    '摸摸我嘛~',
    '我最喜欢你啦',
    '别太累了，休息一下',
    '汪！发现你在偷偷看我',
    '今天天气适合散步~',
    '我的外套好看吗？',
    '永远陪着你哦',
    '你笑起来最好看了',
    '要不要一起玩？',
    '我梦到你了哦',
    '记得按时吃饭呀',
    '坐久了记得站起来走走~'
  ],
  petted: [
    '嘿嘿，好舒服~',
    '再摸摸嘛！',
    '最喜欢被你摸了',
    '汪呜~ 开心！',
    '尾巴摇到停不下来！'
  ],
  fed: [
    '好好吃！谢谢！',
    '还有吗还有吗？',
    '汪！是零食！',
    '吧唧吧唧~',
    '你是世界上最好的人'
  ],
  sleepy: [
    '好困…先眯一会儿…',
    '晚安…汪…',
    '让我睡五分钟…'
  ],
  woken: [
    '汪？！我醒了我醒了！',
    '啊…再睡会儿嘛…',
    '早上好！…现在是早上吗？'
  ],
  dragged: [
    '哇啊啊啊——！',
    '放我下来！汪！',
    '我恐高的啦！！',
    '晕晕晕晕…'
  ],
  dropped: [
    '呼…安全着陆',
    '下次轻点啦！',
    '汪…我的小心脏'
  ],
  ball: [
    '球球！是我的！',
    '接住啦~ 汪！',
    '再来一次再来一次！',
    '我是追球小能手',
    '嘿嘿，球球最好玩了'
  ],
  highfive: [
    '击掌！✋ 汪！',
    '我们是最棒的搭档！',
    'Give me five!',
    '耶！配合默契~',
    '再来一次击掌嘛'
  ],
  liedown: [
    '趴一会儿…好惬意~',
    '地板凉凉的，好舒服',
    '就这样躺着陪你~',
    '呼…放松一下',
    '趴着看你工作也不错'
  ],
  beg: [
    '那个…能给我点吃的吗…',
    '汪…我好像有点饿了…',
    '就一小口，好不好嘛…',
    '（用水汪汪的大眼睛看着你）',
    '我保证只吃一点点…'
  ]
};

// ─── State ───
let state = 'idle';          // idle | walk | sleep | happy | eat | drag | ball | highfive | liedown | beg
let facing = 1;              // 1 = right, -1 = left
let stateTimer = null;       // main state timeout
let walkFrameInterval = null;
let walkMoveInterval = null;
let walkDirTimeout = null;
let bubbleTimer = null;
let zzzInterval = null;
let isDragging = false;
let hasMoved = false;
let lastMouseX = 0;
let lastMouseY = 0;
let busy = false;            // during special actions (pet/feed)

// ─── Helpers ───
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[rand(0, arr.length - 1)];
}

function setSprite(name) {
  sprite.src = SPRITES[name];
}

function clearAnimations() {
  sprite.classList.remove('bob', 'breathe', 'wiggle', 'eat-nod', 'dangle', 'bounce', 'paw-up');
}

function setFacing(dir) {
  facing = dir;
  sprite.classList.toggle('facing-left', dir === -1);
}

function clearAllTimers() {
  clearTimeout(stateTimer);
  clearTimeout(walkDirTimeout);
  clearInterval(walkFrameInterval);
  clearInterval(walkMoveInterval);
  walkFrameInterval = null;
  walkMoveInterval = null;
}

// ─── Speech Bubble ───
function say(text, duration = 4000) {
  bubble.textContent = text;
  bubble.classList.add('show');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => {
    bubble.classList.remove('show');
  }, duration);
}

// ─── Particles ───
function spawnParticle(type, emoji, x, y) {
  const el = document.createElement('div');
  el.className = `particle ${type}`;
  el.textContent = emoji;
  el.style.left = `${x + rand(-20, 20)}px`;
  el.style.top = `${y + rand(-10, 10)}px`;
  particlesLayer.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

function burstHearts(count = 5) {
  const rect = petContainer.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + 20;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      spawnParticle('heart', pick(['❤️', '🧡', '💛', '💕', '✨']), cx, cy);
    }, i * 150);
  }
}

function burstCrumbs(count = 4) {
  const rect = petContainer.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height - 40;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      spawnParticle('crumb', pick(['🦴', '✨', '💫']), cx, cy);
    }, i * 200);
  }
}

function burstStars(count = 4) {
  const rect = petContainer.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + 30;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      spawnParticle('sparkle', pick(['⭐', '🌟', '✨', '🎾', '✋']), cx, cy);
    }, i * 180);
  }
}

function startZzz() {
  stopZzz();
  zzzInterval = setInterval(() => {
    const rect = petContainer.getBoundingClientRect();
    spawnParticle('zzz', pick(['Z', 'z', 'Zz']), rect.left + rect.width / 2 + 30, rect.top + 30);
  }, 1800);
}

function stopZzz() {
  if (zzzInterval) {
    clearInterval(zzzInterval);
    zzzInterval = null;
  }
}

// ─── State Machine ───
function enterState(newState) {
  clearAllTimers();
  clearAnimations();
  stopZzz();

  state = newState;

  switch (newState) {
    case 'idle':
      setSprite('idle');
      scheduleNext();
      break;

    case 'walk': {
      setFacing(Math.random() > 0.5 ? 1 : -1);
      let frame = 0;
      setSprite('walk1');
      sprite.classList.add('bob');

      // Alternate walk frames
      walkFrameInterval = setInterval(() => {
        frame = 1 - frame;
        setSprite(frame === 0 ? 'walk1' : 'walk2');
      }, 300);

      if (isElectron) {
        // Desktop: move the actual Electron window
        walkMoveInterval = setInterval(() => {
          window.petAPI.moveWindow(facing * 2, 0);
        }, 16);
      } else {
        // Web/Mobile: move pet visually within viewport
        const speed = isMobile ? 1.5 : 2;
        walkMoveInterval = setInterval(() => {
          const maxOffset = (window.innerWidth / 2) - 60;
          petOffsetX += facing * speed;
          if (Math.abs(petOffsetX) > maxOffset) {
            setFacing(-facing);
            petOffsetX = Math.sign(petOffsetX) * maxOffset;
          }
          petContainer.style.transform = `translate(calc(-50% + ${petOffsetX}px), ${petOffsetY}px)`;
        }, 16);
      }

      // Maybe change direction midway
      walkDirTimeout = setTimeout(() => {
        setFacing(-facing);
      }, rand(1500, 6000));

      // Stop walking after a while
      stateTimer = setTimeout(() => {
        enterState('idle');
      }, rand(4000, 10000));
      break;
    }

    case 'sleep':
      setSprite('sleep');
      sprite.classList.add('breathe');
      startZzz();
      if (Math.random() > 0.5) say(pick(MESSAGES.sleepy), 3000);
      // Sleep for 15-35 seconds then wake up naturally
      stateTimer = setTimeout(() => {
        enterState('idle');
        if (Math.random() > 0.5) say(pick(MESSAGES.woken));
      }, rand(15000, 35000));
      break;

    case 'happy':
      setSprite('happy');
      sprite.classList.add('wiggle');
      burstHearts(6);
      stateTimer = setTimeout(() => {
        busy = false;
        enterState('idle');
      }, 2800);
      break;

    case 'eat':
      setSprite('eat');
      sprite.classList.add('eat-nod');
      setFacing(1);
      burstCrumbs();
      say(pick(MESSAGES.fed), 3000);
      // Finish eating → happy
      stateTimer = setTimeout(() => {
        clearAnimations();
        setSprite('happy');
        sprite.classList.add('wiggle');
        burstHearts(3);
        stateTimer = setTimeout(() => {
          busy = false;
          enterState('idle');
        }, 1500);
      }, 3500);
      break;

    case 'drag':
      setSprite('drag');
      sprite.classList.add('dangle');
      if (Math.random() > 0.4) say(pick(MESSAGES.dragged), 2000);
      break;

    case 'ball':
      setSprite('ball');
      sprite.classList.add('bounce');
      setFacing(Math.random() > 0.5 ? 1 : -1);
      say(pick(MESSAGES.ball), 3000);
      burstStars(4);
      stateTimer = setTimeout(() => {
        busy = false;
        enterState('happy');
        stateTimer = setTimeout(() => enterState('idle'), 2000);
      }, 4000);
      break;

    case 'highfive':
      setSprite('highfive');
      sprite.classList.add('paw-up');
      say(pick(MESSAGES.highfive), 3000);
      burstStars(5);
      stateTimer = setTimeout(() => {
        busy = false;
        enterState('happy');
        stateTimer = setTimeout(() => enterState('idle'), 2000);
      }, 3000);
      break;

    case 'liedown':
      setSprite('liedown');
      sprite.classList.add('breathe');
      setFacing(Math.random() > 0.5 ? 1 : -1);
      say(pick(MESSAGES.liedown), 3000);
      // Lie down for a while, then get up
      stateTimer = setTimeout(() => {
        busy = false;
        enterState('idle');
      }, rand(8000, 18000));
      break;

    case 'beg':
      setSprite('beg');
      sprite.classList.add('paw-up');
      say(pick(MESSAGES.beg), 3500);
      // Keep begging a bit, then give up and sit
      stateTimer = setTimeout(() => {
        busy = false;
        enterState('idle');
        if (Math.random() > 0.5) say('哼，小气鬼…汪', 2500);
      }, 5000);
      break;
  }
}

function scheduleNext() {
  const delay = rand(4000, 12000);
  stateTimer = setTimeout(() => {
    if (busy || isDragging) {
      scheduleNext();
      return;
    }

    const roll = Math.random();
    if (roll < 0.25) {
      enterState('walk');
    } else if (roll < 0.37) {
      enterState('sleep');
    } else if (roll < 0.45) {
      busy = true;
      enterState('ball');
    } else if (roll < 0.52) {
      enterState('liedown');
    } else if (roll < 0.58) {
      busy = true;
      enterState('beg');
    } else if (roll < 0.72) {
      say(pick(MESSAGES.random));
      scheduleNext();
    } else {
      scheduleNext();
    }
  }, delay);
}

// ─── Mouse Interactions ───
sprite.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  isDragging = true;
  hasMoved = false;
  lastMouseX = e.screenX;
  lastMouseY = e.screenY;
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;

  const dx = e.screenX - lastMouseX;
  const dy = e.screenY - lastMouseY;

  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
    hasMoved = true;
    if (state !== 'drag') {
      enterState('drag');
    }
    if (isElectron) {
      window.petAPI.moveWindow(dx, dy);
    } else {
      petOffsetX += dx;
      petOffsetY += dy;
      petContainer.style.transform = `translate(calc(-50% + ${petOffsetX}px), ${petOffsetY}px)`;
    }
  }

  lastMouseX = e.screenX;
  lastMouseY = e.screenY;
});

document.addEventListener('mouseup', () => {
  if (!isDragging) return;
  isDragging = false;

  if (hasMoved && state === 'drag') {
    // Was actually dragged → relieved landing
    clearAnimations();
    say(pick(MESSAGES.dropped), 2500);
    setSprite('happy');
    sprite.classList.add('wiggle');
    burstHearts(3);
    stateTimer = setTimeout(() => enterState('idle'), 2000);
  } else {
    // Simple click → pet him
    if (state === 'sleep') {
      // Wake him up gently
      enterState('idle');
      say(pick(MESSAGES.woken));
    } else {
      busy = true;
      enterState('happy');
      say(pick(MESSAGES.petted), 3000);
    }
  }
});

// Double click → extra love
sprite.addEventListener('dblclick', () => {
  burstHearts(8);
  say(pick(MESSAGES.random));
});

// ─── Touch Interactions (iPhone/mobile) ───
let touchStartTime = 0;
let longPressTimer = null;

sprite.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  isDragging = true;
  hasMoved = false;
  lastMouseX = touch.clientX;
  lastMouseY = touch.clientY;
  touchStartTime = Date.now();

  // Long press for menu (like double-click)
  longPressTimer = setTimeout(() => {
    burstHearts(8);
    say(pick(MESSAGES.random));
  }, 600);
}, { passive: false });

document.addEventListener('touchmove', (e) => {
  if (!isDragging) return;
  const touch = e.touches[0];
  const dx = touch.clientX - lastMouseX;
  const dy = touch.clientY - lastMouseY;

  // Cancel long press if moved
  if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
    clearTimeout(longPressTimer);
  }

  if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
    hasMoved = true;
    if (state !== 'drag') {
      enterState('drag');
    }
    // Move pet visually (no IPC on web, use transform)
    petContainer.style.transform = `translate(calc(-50% + ${dx}px), ${dy}px)`;
  }

  lastMouseX = touch.clientX;
  lastMouseY = touch.clientY;
}, { passive: false });

document.addEventListener('touchend', (e) => {
  if (!isDragging) return;
  clearTimeout(longPressTimer);
  isDragging = false;

  // Reset visual offset (snap back)
  petContainer.style.transition = 'transform 0.3s ease';
  petContainer.style.transform = 'translateX(-50%)';
  setTimeout(() => { petContainer.style.transition = ''; }, 300);

  if (hasMoved && state === 'drag') {
    clearAnimations();
    say(pick(MESSAGES.dropped), 2500);
    setSprite('happy');
    sprite.classList.add('wiggle');
    burstHearts(3);
    stateTimer = setTimeout(() => enterState('idle'), 2000);
  } else {
    // Tap → pet him
    if (state === 'sleep') {
      enterState('idle');
      say(pick(MESSAGES.woken));
    } else {
      busy = true;
      enterState('happy');
      say(pick(MESSAGES.petted), 3000);
    }
  }
});

// ─── Actions from tray menu (via preload IPC, Electron only) ───
if (isElectron) {
  window.petAPI.onAction((action) => {
    switch (action) {
      case 'pet':
        busy = true;
        enterState('happy');
        say(pick(MESSAGES.petted), 3000);
        break;
      case 'feed':
        busy = true;
        enterState('eat');
        break;
      case 'ball':
        busy = true;
        enterState('ball');
        break;
      case 'highfive':
        busy = true;
        enterState('highfive');
        break;
      case 'liedown':
        enterState('liedown');
        break;
      case 'beg':
        busy = true;
        enterState('beg');
        break;
      case 'sleep':
        busy = false;
        enterState('sleep');
        break;
      case 'wake':
        if (state === 'sleep') {
          enterState('idle');
          say(pick(MESSAGES.woken));
        } else {
          say(pick(MESSAGES.greeting));
          burstHearts(3);
        }
        break;
    }
  });
}

// ─── Startup ───
window.addEventListener('load', () => {
  setTimeout(() => {
    say(pick(MESSAGES.greeting), 5000);
    burstHearts(4);
  }, 800);

  enterState('idle');

  // Register service worker for PWA
  if (!isElectron && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  // Mobile: add floating action menu
  if (!isElectron) {
    const fab = document.createElement('div');
    fab.id = 'fab-menu';
    fab.innerHTML = `
      <button id="fab-btn" aria-label="Menu">🐾</button>
      <div id="fab-options">
        <button data-action="feed" title="喂零食">🦴</button>
        <button data-action="ball" title="玩球球">🎾</button>
        <button data-action="highfive" title="击掌">✋</button>
        <button data-action="beg" title="讨要食物">🥺</button>
        <button data-action="liedown" title="趴下">😴</button>
        <button data-action="sleep" title="睡觉">💤</button>
      </div>
    `;
    document.body.appendChild(fab);

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #fab-menu {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 200;
      }
      #fab-btn {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        border: none;
        background: rgba(240, 217, 181, 0.92);
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease;
      }
      #fab-btn:active { transform: scale(0.9); }
      #fab-options {
        position: absolute;
        bottom: 60px;
        right: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
        opacity: 0;
        pointer-events: none;
        transform: translateY(10px);
        transition: all 0.25s ease;
      }
      #fab-options.show {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0);
      }
      #fab-options button {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: none;
        background: rgba(255,255,255,0.95);
        font-size: 20px;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.15s ease;
      }
      #fab-options button:active { transform: scale(0.85); }
    `;
    document.head.appendChild(style);

    const fabBtn = document.getElementById('fab-btn');
    const fabOptions = document.getElementById('fab-options');
    let menuOpen = false;

    fabBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      menuOpen = !menuOpen;
      fabOptions.classList.toggle('show', menuOpen);
    });

    document.addEventListener('click', () => {
      if (menuOpen) {
        menuOpen = false;
        fabOptions.classList.remove('show');
      }
    });

    fabOptions.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        switch (action) {
          case 'pet':
            busy = true; enterState('happy');
            say(pick(MESSAGES.petted), 3000); break;
          case 'feed':
            busy = true; enterState('eat'); break;
          case 'ball':
            busy = true; enterState('ball'); break;
          case 'highfive':
            busy = true; enterState('highfive'); break;
          case 'liedown':
            enterState('liedown'); break;
          case 'beg':
            busy = true; enterState('beg'); break;
          case 'sleep':
            busy = false; enterState('sleep'); break;
        }
        menuOpen = false;
        fabOptions.classList.remove('show');
      });
    });
  }
});

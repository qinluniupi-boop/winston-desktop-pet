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
  beg: 'assets/beg.png',
  bath: 'assets/bath.png'
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
  ],
  lonely: [
    '你在忙吗…我想你了',
    '这里好安静…不过没关系，我一直在',
    '（小声）不要忘记我呀…',
    '我会一直在这里等你的',
    '抬头看看我嘛~ 我陪着你呢',
    '一个人也要好好的哦'
  ],
  loved: [
    '我是世界上最幸福的狗狗！',
    '被你这样爱着，真好',
    '我的心都要化啦~',
    '最爱你了！永远永远！',
    '这样的日子，好想一直过下去',
    '有你在我身边，就够了'
  ],
  comfort: [
    '如果今天不开心，就来抱抱我吧',
    '没关系的，慢慢来，我陪你',
    '你已经做得很好了，真的',
    '难过的时候就看看我，我一直在',
    '深呼吸~ 一切都会好起来的',
    '不管发生什么，我都站在你这边',
    '想哭就哭吧，我帮你挡着',
    '你不用一直坚强的，在我面前可以放松'
  ],
  morning: ['早上好呀！新的一天~', '早安！今天也要元气满满哦', '早上好，我陪你开始新的一天'],
  noon: ['中午啦，记得吃饭哦', '午饭吃什么呀？别饿着', '中午好~ 休息一下下'],
  afternoon: ['下午好~ 喝杯茶吧', '下午啦，别太拼了', '阳光正好，想出去走走吗'],
  evening: ['晚上好~ 辛苦一天啦', '傍晚了，放松一下吧', '晚上好，今天也辛苦了'],
  night: ['这么晚还没睡呀…早点休息', '夜深了，我陪你', '晚安，做个好梦~', '熬夜的话，我陪你一起'],
  bath: [
    '泡泡浴~ 好舒服呀',
    '洗香香啦！汪~',
    '我最爱洗澡了！',
    '搓搓搓~ 干干净净',
    '洗完澡我又是帅气的狗狗了'
  ]
};

// ─── State ───
let state = 'idle';          // idle | walk | sleep | happy | eat | drag | ball | highfive | liedown | beg | bath
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

// ─── Mood / Emotion System ───
const MOODS = {
  calm:    { emoji: '🙂', label: '平静' },
  happy:   { emoji: '😊', label: '开心' },
  loved:   { emoji: '🥰', label: '被爱包围' },
  excited: { emoji: '🤩', label: '兴奋' },
  lonely:  { emoji: '🥺', label: '想你' },
  sleepy:  { emoji: '😪', label: '困困' }
};

let mood = 'calm';
let lastInteraction = Date.now();
let petStreak = 0;
let petStreakTimer = null;
let moodIndicator = null;
let isHidden = false;

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

// ─── Mood Functions ───
function setMood(newMood) {
  mood = newMood;
  if (moodIndicator) {
    moodIndicator.textContent = MOODS[newMood].emoji;
    moodIndicator.title = MOODS[newMood].label;
    moodIndicator.classList.remove('pop');
    void moodIndicator.offsetWidth; // trigger reflow for animation
    moodIndicator.classList.add('pop');
  }
}

function recordInteraction() {
  lastInteraction = Date.now();
  if (mood === 'lonely') setMood('happy');
}

function onPetted() {
  recordInteraction();
  petStreak++;
  clearTimeout(petStreakTimer);
  petStreakTimer = setTimeout(() => { petStreak = 0; }, 5000);

  if (petStreak >= 5 && mood !== 'loved') {
    // Lots of love in a short time → overwhelmed with joy
    setMood('loved');
    say(pick(MESSAGES.loved), 4500);
    burstHearts(10);
  } else {
    setMood('happy');
  }
}

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return pick(MESSAGES.morning);
  if (h >= 11 && h < 14) return pick(MESSAGES.noon);
  if (h >= 14 && h < 18) return pick(MESSAGES.afternoon);
  if (h >= 18 && h < 23) return pick(MESSAGES.evening);
  return pick(MESSAGES.night);
}

// Periodic mood check: loneliness & sleepiness
setInterval(() => {
  if (isHidden) return;
  if (state === 'sleep') {
    if (mood !== 'sleepy') setMood('sleepy');
    return;
  }
  const idleSec = (Date.now() - lastInteraction) / 1000;
  if (idleSec > 90 && mood !== 'lonely') {
    setMood('lonely');
    if (Math.random() > 0.35) say(pick(MESSAGES.lonely), 4500);
  } else if (idleSec < 90 && mood === 'lonely') {
    setMood('calm');
  }
}, 10000);

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

function burstBubbles(count = 8) {
  const rect = petContainer.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      spawnParticle('sparkle', pick(['🫧', '🧼', '💧', '✨']), cx + rand(-30, 30), cy + rand(-20, 20));
    }, i * 160);
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

    case 'bath':
      setSprite('bath');
      sprite.classList.add('wiggle');
      burstBubbles(8);
      say(pick(MESSAGES.bath), 3500);
      stateTimer = setTimeout(() => {
        busy = false;
        enterState('happy');
        stateTimer = setTimeout(() => enterState('idle'), 2000);
      }, 4000);
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
    if (roll < 0.24) {
      enterState('walk');
    } else if (roll < 0.36) {
      enterState('sleep');
    } else if (roll < 0.44) {
      busy = true;
      enterState('ball');
    } else if (roll < 0.51) {
      enterState('liedown');
    } else if (roll < 0.57) {
      busy = true;
      enterState('beg');
    } else if (roll < 0.64) {
      // Comfort: sense you might need some warmth
      say(pick(MESSAGES.comfort), 5000);
      burstHearts(3);
      setMood('loved');
      scheduleNext();
    } else if (roll < 0.76) {
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
      recordInteraction();
    } else {
      busy = true;
      enterState('happy');
      say(pick(MESSAGES.petted), 3000);
      onPetted();
    }
  }
});

// Double click → extra love
sprite.addEventListener('dblclick', () => {
  burstHearts(8);
  say(pick(MESSAGES.random));
  onPetted();
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
      recordInteraction();
    } else {
      busy = true;
      enterState('happy');
      say(pick(MESSAGES.petted), 3000);
      onPetted();
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
        onPetted();
        break;
      case 'feed':
        busy = true;
        enterState('eat');
        recordInteraction();
        break;
      case 'bath':
        busy = true;
        enterState('bath');
        recordInteraction();
        break;
      case 'ball':
        busy = true;
        enterState('ball');
        setMood('excited');
        recordInteraction();
        break;
      case 'highfive':
        busy = true;
        enterState('highfive');
        setMood('excited');
        recordInteraction();
        break;
      case 'liedown':
        enterState('liedown');
        recordInteraction();
        break;
      case 'beg':
        busy = true;
        enterState('beg');
        recordInteraction();
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
        recordInteraction();
        break;
    }
  });
}

// ─── Hide / Show ───
let restoreBtn = null;

function hidePet() {
  isHidden = true;
  clearAllTimers();
  clearAnimations();
  stopZzz();
  bubble.classList.remove('show');
  petContainer.style.display = 'none';
  document.getElementById('pet-shadow').style.display = 'none';
  if (moodIndicator) moodIndicator.style.display = 'none';
  if (restoreBtn) restoreBtn.style.display = 'flex';
}

function showPet() {
  isHidden = false;
  petContainer.style.display = 'flex';
  document.getElementById('pet-shadow').style.display = 'block';
  if (moodIndicator) moodIndicator.style.display = 'flex';
  if (restoreBtn) restoreBtn.style.display = 'none';
  enterState('happy');
  say(pick(['汪！我回来啦~', '嘿嘿，又想我了吧', '我一直都在哦', '躲猫猫结束！']), 3000);
  burstHearts(4);
  recordInteraction();
}

// ─── Startup ───
window.addEventListener('load', () => {
  // Create mood indicator (emoji floating near pet's head)
  moodIndicator = document.createElement('div');
  moodIndicator.id = 'mood-indicator';
  moodIndicator.textContent = MOODS.calm.emoji;
  moodIndicator.title = MOODS.calm.label;
  document.body.appendChild(moodIndicator);

  // Greeting based on time of day
  setTimeout(() => {
    say(getTimeGreeting(), 5000);
    burstHearts(4);
  }, 800);

  enterState('idle');

  // Register service worker for PWA
  if (!isElectron && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // Mobile: add floating action menu + hide/restore
  if (!isElectron) {
    // Restore button (shown when pet is hidden)
    restoreBtn = document.createElement('button');
    restoreBtn.id = 'restore-btn';
    restoreBtn.textContent = '🐾';
    restoreBtn.title = '叫 Winston 回来';
    restoreBtn.style.display = 'none';
    restoreBtn.addEventListener('click', showPet);
    document.body.appendChild(restoreBtn);

    const fab = document.createElement('div');
    fab.id = 'fab-menu';
    fab.innerHTML = `
      <button id="fab-btn" aria-label="Menu">🐾</button>
      <div id="fab-options">
        <button data-action="feed" title="喂零食">🦴</button>
        <button data-action="bath" title="洗澡澡">🛁</button>
        <button data-action="ball" title="玩球球">🎾</button>
        <button data-action="highfive" title="击掌">✋</button>
        <button data-action="beg" title="讨要食物">🥺</button>
        <button data-action="liedown" title="趴下">😴</button>
        <button data-action="sleep" title="睡觉">💤</button>
        <button data-action="hide" title="隐藏 Winston">🙈</button>
      </div>
    `;
    document.body.appendChild(fab);

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #mood-indicator {
        position: fixed;
        bottom: max(190px, calc(env(safe-area-inset-bottom) + 190px));
        left: 50%;
        transform: translateX(-50%);
        font-size: 26px;
        z-index: 90;
        pointer-events: none;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
      }
      #mood-indicator.pop {
        animation: moodPop 0.4s ease;
      }
      @keyframes moodPop {
        0% { transform: translateX(-50%) scale(0.3); }
        60% { transform: translateX(-50%) scale(1.3); }
        100% { transform: translateX(-50%) scale(1); }
      }
      #restore-btn {
        position: fixed;
        bottom: max(30px, env(safe-area-inset-bottom));
        left: 50%;
        transform: translateX(-50%);
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: none;
        background: rgba(240, 217, 181, 0.95);
        font-size: 26px;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(0,0,0,0.18);
        align-items: center;
        justify-content: center;
        z-index: 200;
        animation: restorePulse 2s ease-in-out infinite;
      }
      @keyframes restorePulse {
        0%, 100% { transform: translateX(-50%) scale(1); }
        50% { transform: translateX(-50%) scale(1.1); }
      }
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
            say(pick(MESSAGES.petted), 3000); onPetted(); break;
          case 'feed':
            busy = true; enterState('eat'); recordInteraction(); break;
          case 'bath':
            busy = true; enterState('bath'); recordInteraction(); break;
          case 'ball':
            busy = true; enterState('ball'); setMood('excited'); recordInteraction(); break;
          case 'highfive':
            busy = true; enterState('highfive'); setMood('excited'); recordInteraction(); break;
          case 'liedown':
            enterState('liedown'); recordInteraction(); break;
          case 'beg':
            busy = true; enterState('beg'); recordInteraction(); break;
          case 'sleep':
            busy = false; enterState('sleep'); break;
          case 'hide':
            hidePet(); break;
        }
        menuOpen = false;
        fabOptions.classList.remove('show');
      });
    });
  }
});

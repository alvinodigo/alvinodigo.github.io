const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const marioImage = new Image();
const victoryImage = new Image();
const catImage = new Image();

marioImage.src = "assets/images/bkg/mario_moves.png";
victoryImage.src = "assets/images/bkg/victory.png";
catImage.src = "assets/images/bkg/cat.png";

const SPRITES = {
  walk: {
    frameCount: 8,
    frameWidth: 96,
    frameHeight: 192,
    gap: 30,
    y: 0,
  },
  jump: {
    frameCount: 2,
    frameWidth: 114,
    frameHeight: 192,
    gap: 30,
    y: 222, // 192 + 30
  },
};

const animation = {
  facing: 1, // 1 = direita, -1 = esquerda
  state: "idle",
  frameIndex: 0,
  timer: 0,
  frameDuration: 0.08,
  drawWidth: 48,
  drawHeight: 96,
};

if (!ctx) {
  throw new Error("Canvas 2D não suportado neste navegador.");
}

// =========================
// MUNDO FIXO
// =========================
const WORLD = {
  width: 2000,
  height: 540,
  gravity: 1800,
};

const GAME_STATE = {
  lives: 3,
  maxLives: 3,
  gameOver: false,
  isRespawning: false,
  hasWon: false,
  respawnX: 100,
  respawnY: 280,
};

// =========================
// CÂMERA
// A altura lógica fica fixa.
// A largura lógica visível varia conforme a proporção da tela.
// =========================
const camera = {
  x: 0,
  y: 0,
  width: 0,
  height: WORLD.height,
};

// =========================
// INPUT
// =========================
const input = {
  left: false,
  right: false,
  jump: false,
};
let jumpPressed = false;
let jumpHeld = false;
let jumpReleased = false;

const btnLeft = document.getElementById("btn-left");
const btnRight = document.getElementById("btn-right");
const btnJump = document.getElementById("btn-jump");

// =========================
// PLAYER
// =========================
const player = {
  x: GAME_STATE.respawnX,
  y: GAME_STATE.respawnY,
  w: 40,
  h: 80,
  vx: 0,
  vy: 0,
  speed: 260,
  jumpStrength: 700,
  onGround: false,
  color: "#d62828",
};

// =========================
// PLATAFORMAS
// Tudo continua em coordenadas do mundo.
// =========================
const platforms = [
  // chão com buracos
  { x: 0, y: 460, w: 500, h: 80, type: "solid" },
  { x: 700, y: 460, w: 600, h: 80, type: "solid" },
  { x: 1500, y: 460, w: 500, h: 80, type: "solid" },

  // plataformas suspensas
  { x: 260, y: 380, w: 140, h: 30, type: "oneWay" },
  { x: 480, y: 320, w: 140, h: 30, type: "oneWay" },
  { x: 700, y: 260, w: 140, h: 30, type: "solid" },
  { x: 980, y: 340, w: 140, h: 30, type: "oneWay" },
  { x: 1220, y: 280, w: 140, h: 30, type: "solid" },
  { x: 1480, y: 360, w: 140, h: 30, type: "oneWay" },
];

const goal = {
  x: 1900,
  y: 400,
  w: 50,
  h: 60,
};

let lastTime = 0;

// =========================
// RESIZE
// Canvas preenche a tela toda.
// A câmera recalcula a largura visível com base na altura fixa.
// =========================
function resizeGame() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  camera.height = WORLD.height;
  camera.width = WORLD.height * (canvas.width / canvas.height);
}

window.addEventListener("resize", resizeGame);
resizeGame();

// =========================
// TECLADO
// =========================
window.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "ArrowLeft":
    case "a":
    case "A":
      input.left = true;
      break;

    case "ArrowRight":
    case "d":
    case "D":
      input.right = true;
      break;

    case "ArrowUp":
    case "w":
    case "W":
    case " ":
      if (!jumpHeld) {
        jumpPressed = true;
      }
      jumpHeld = true;
      break;
  }
});

window.addEventListener("keyup", (event) => {
  switch (event.key) {
    case "ArrowLeft":
    case "a":
    case "A":
      input.left = false;
      break;

    case "ArrowRight":
    case "d":
    case "D":
      input.right = false;
      break;

    case "ArrowUp":
    case "w":
    case "W":
    case " ":
      jumpHeld = false;
      jumpReleased = true;
      break;
  }
});

// =========================
// UTILS
// =========================
function clampDelta(seconds) {
  return Math.min(seconds, 0.016 * 2);
}

function isColliding(a, b) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

function getScale() {
  return canvas.height / camera.height;
}

function worldToScreen(x, y, w, h) {
  const scale = getScale();

  return {
    x: (x - camera.x) * scale,
    y: (y - camera.y) * scale,
    w: w * scale,
    h: h * scale,
  };
}

function getWalkFrame(index) {
  const { frameWidth, frameHeight, gap, y } = SPRITES.walk;

  return {
    sx: index * (frameWidth + gap),
    sy: y,
    sw: frameWidth,
    sh: frameHeight,
  };
}

function getJumpFrame(index) {
  const { frameWidth, frameHeight, gap, y } = SPRITES.jump;

  return {
    sx: index * (frameWidth + gap),
    sy: y,
    sw: frameWidth,
    sh: frameHeight,
  };
}

function getCurrentFrame() {
  if (animation.state === "walk") {
    return getWalkFrame(animation.frameIndex);
  }

  if (animation.state === "jumpUp") {
    return getJumpFrame(0);
  }

  if (animation.state === "jumpDown") {
    return getJumpFrame(1);
  }

  // idle = primeiro frame da caminhada
  return getWalkFrame(0);
}

function updateAnimation(dt) {
  if (player.vx > 0) animation.facing = 1;
  if (player.vx < 0) animation.facing = -1;

  if (!player.onGround) {
    animation.state = player.vy < 0 ? "jumpUp" : "jumpDown";
    animation.frameIndex = 0;
    animation.timer = 0;
    return;
  }

  if (player.vx !== 0) {
    animation.state = "walk";
    animation.timer += dt;

    if (animation.timer >= animation.frameDuration) {
      animation.timer = 0;
      animation.frameIndex =
        (animation.frameIndex + 1) % SPRITES.walk.frameCount;
    }

    return;
  }

  animation.state = "idle";
  animation.frameIndex = 0;
  animation.timer = 0;
}

// =========================
// UPDATE
// =========================
function update(dt) {
  const previousY = player.y;

  if (GAME_STATE.gameOver || GAME_STATE.isRespawning || GAME_STATE.hasWon) {
    jumpPressed = false;
    jumpReleased = false;
    return;
  }

  // Movimento horizontal
  player.vx = 0;

  if (input.left) player.vx = -player.speed;
  if (input.right) player.vx = player.speed;

  // Iniciar pulo
  if (jumpPressed && player.onGround) {
    player.vy = -player.jumpStrength;
    player.onGround = false;
    playJumpSound();
  }

  // Gravidade
  player.vy += WORLD.gravity * dt;

  // Se soltou o botão enquanto está subindo, corta o pulo
  if (jumpReleased && player.vy < 0) {
    player.vy *= 0.5;
  }

  // =========================
  // MOVIMENTO HORIZONTAL
  // =========================
  player.x += player.vx * dt;

  for (const platform of platforms) {
    if (!isColliding(player, platform)) continue;

    if (platform.type === "oneWay") {
      const previousBottom = previousY + player.h;
      const wasAbovePlatform = previousBottom <= platform.y;
      const isMovingUp = player.vy < 0;

      // Se estiver vindo por baixo, ignora a plataforma por completo
      if (isMovingUp && !wasAbovePlatform) {
        continue;
      }

      // One-way normalmente não bloqueia lateral
      continue;
    }

    // Plataformas sólidas bloqueiam lateral
    if (player.vx > 0) {
      player.x = platform.x - player.w;
    } else if (player.vx < 0) {
      player.x = platform.x + platform.w;
    }
  }

  // Limites do mundo no eixo X
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > WORLD.width) {
    player.x = WORLD.width - player.w;
  }

  // =========================
  // MOVIMENTO VERTICAL
  // =========================
  player.y += player.vy * dt;
  player.onGround = false;

  for (const platform of platforms) {
    if (!isColliding(player, platform)) continue;

    const previousTop = previousY;
    const previousBottom = previousY + player.h;
    const currentTop = player.y;
    const currentBottom = player.y + player.h;

    const wasAbovePlatform = previousBottom <= platform.y;
    const wasBelowPlatform = previousTop >= platform.y + platform.h;
    const isFalling = player.vy >= 0;
    const isMovingUp = player.vy < 0;

    if (platform.type === "oneWay") {
      // One-way só colide por cima, quando está caindo
      if (wasAbovePlatform && isFalling && currentBottom >= platform.y) {
        player.y = platform.y - player.h;
        player.vy = 0;
        player.onGround = true;
      }

      continue;
    }

    // SOLID: colide por cima
    if (wasAbovePlatform && isFalling && currentBottom >= platform.y) {
      player.y = platform.y - player.h;
      player.vy = 0;
      player.onGround = true;
      continue;
    }

    // SOLID: colide por baixo
    if (
      wasBelowPlatform &&
      isMovingUp &&
      currentTop <= platform.y + platform.h
    ) {
      player.y = platform.y + platform.h;
      player.vy = 0;
      continue;
    }
  }

  if (!GAME_STATE.hasWon && isColliding(player, goal)) {
    GAME_STATE.hasWon = true;

    stopAndDestroyAudio();
    playVictorySound();
  }

  // Cair para fora do mapa = reset
  if (player.y > WORLD.height + 200) {
    loseLife();
  }

  updateCamera();
  updateAnimation(dt);

  jumpPressed = false;
  jumpReleased = false;
}

function updateCamera() {
  // Segue o jogador mantendo ele um pouco antes do centro
  camera.x = player.x - camera.width * 0.4;

  // Trava a câmera dentro do mundo
  if (camera.x < 0) camera.x = 0;
  if (camera.x + camera.width > WORLD.width) {
    camera.x = WORLD.width - camera.width;
  }

  // Caso a tela seja absurdamente larga e a câmera fique maior que o mundo
  if (camera.width > WORLD.width) {
    camera.x = 0;
  }
}

function resetPlayer() {
  respawnPlayer();
}

// =========================
// DRAW
// =========================
function drawBackground() {
  ctx.fillStyle = "#87ceeb";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const scale = getScale();

  // Sol fixo no mundo
  const sun = worldToScreen(820, 90, 0, 0);
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.arc(sun.x, sun.y, 40 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlatforms() {
  const scale = getScale();

  for (const platform of platforms) {
    const p = worldToScreen(platform.x, platform.y, platform.w, platform.h);

    if (platform.type === "solid") {
      ctx.fillStyle = "#6b4f2a";
      ctx.fillRect(p.x, p.y, p.w, p.h);

      ctx.fillStyle = "#7fb069";
      ctx.fillRect(p.x, p.y, p.w, 8 * scale);
    } else {
      ctx.fillStyle = "#4d96ff";
      ctx.fillRect(p.x, p.y, p.w, p.h);

      ctx.fillStyle = "#bde0fe";
      ctx.fillRect(p.x, p.y, p.w, 8 * scale);
    }
  }
}

function drawPlayer() {
  const scale = getScale();
  const frame = getCurrentFrame();

  // desenha o sprite separado da hitbox
  const spriteWorldWidth = animation.drawWidth;
  const spriteWorldHeight = animation.drawHeight;

  const spriteX = player.x + player.w / 2 - spriteWorldWidth / 2;
  const spriteY = player.y + player.h - spriteWorldHeight;

  const p = worldToScreen(
    spriteX,
    spriteY,
    spriteWorldWidth,
    spriteWorldHeight,
  );

  if (GAME_STATE.hasWon && victoryImage.complete) {
    const scale = getScale();

    const spriteWorldWidth = animation.drawWidth;
    const spriteWorldHeight = animation.drawHeight;

    const spriteX = player.x + player.w / 2 - spriteWorldWidth / 2;
    const spriteY = player.y + player.h - spriteWorldHeight;

    const p = worldToScreen(
      spriteX,
      spriteY,
      spriteWorldWidth,
      spriteWorldHeight,
    );

    ctx.drawImage(victoryImage, p.x, p.y, p.w, p.h);
    return;
  }

  if (!marioImage.complete) {
    // fallback: retângulo vermelho se a imagem ainda não carregou
    const body = worldToScreen(player.x, player.y, player.w, player.h);
    ctx.fillStyle = player.color;
    ctx.fillRect(body.x, body.y, body.w, body.h);
    return;
  }

  ctx.save();

  if (animation.facing === -1) {
    ctx.translate(p.x + p.w, 0);
    ctx.scale(-1, 1);

    ctx.drawImage(
      marioImage,
      frame.sx,
      frame.sy,
      frame.sw,
      frame.sh,
      0,
      p.y,
      p.w,
      p.h,
    );
  } else {
    ctx.drawImage(
      marioImage,
      frame.sx,
      frame.sy,
      frame.sw,
      frame.sh,
      p.x,
      p.y,
      p.w,
      p.h,
    );
  }

  ctx.restore();

  // ÁREA DE COLISÃO (hitbox) - para debug
  // const body = worldToScreen(player.x, player.y, player.w, player.h);
  // ctx.strokeStyle = "rgba(255, 255, 0, 0.8)";
  // ctx.lineWidth = 2;
  // ctx.strokeRect(body.x, body.y, body.w, body.h);
}

function drawGoal() {
  const g = worldToScreen(goal.x, goal.y, goal.w, goal.h);

  if (!catImage.complete) {
    // fallback
    ctx.fillStyle = "purple";
    ctx.fillRect(g.x, g.y, g.w, g.h);
    return;
  }

  ctx.drawImage(catImage, g.x, g.y, g.w, g.h);
}

function drawHud() {
  ctx.fillStyle = "#111";
  ctx.font = "18px Arial";
  ctx.fillText("Setas ou A/D para andar | W, ↑ ou espaço para pular", 20, 30);

  ctx.font = "22px Arial";
  ctx.fillText(`Vidas: ${GAME_STATE.lives}`, 20, 60);

  if (GAME_STATE.gameOver) {
    ctx.fillStyle = "#000";
    ctx.font = "bold 48px Arial";
    ctx.fillText("GAME OVER", canvas.width / 2 - 150, canvas.height / 2);

    ctx.font = "24px Arial";

    ctx.fillText(
      "Pressione Enter para reiniciar",
      canvas.width / 2 - 160,
      canvas.height / 2 + 40,
    );
  }

  if (GAME_STATE.hasWon) {
    ctx.fillStyle = "#000";
    ctx.font = "bold 48px Arial";
    ctx.fillText("YOU WIN!", canvas.width / 2 - 130, canvas.height / 2);

    ctx.font = "24px Arial";
    ctx.fillText(
      "Pressione Enter para reiniciar",
      canvas.width / 2 - 160,
      canvas.height / 2 + 40,
    );
  }
}

// =========================
// REINICIANDO O JOGO
// =========================

function restartGame() {
  GAME_STATE.lives = GAME_STATE.maxLives;
  GAME_STATE.gameOver = false;
  GAME_STATE.isRespawning = false;
  GAME_STATE.hasWon = false;

  input.left = false;
  input.right = false;
  jumpHeld = false;
  jumpPressed = false;
  jumpReleased = false;

  respawnPlayer();
  resumeBackgroundMusicFromScratch();
}

window.addEventListener("keydown", (event) => {
  if ((GAME_STATE.gameOver || GAME_STATE.hasWon) && event.key === "Enter") {
    restartGame();
  }
});

// =========================
// ÁUDIO
// =========================
let audioCtx = null;
let bgmStarted = false;
let bgmTimer = null;
let bgmEnabled = false;

const VOLUME = {
  music: 0.04,
  sfx: 0.05,
};

function createAudioContext() {
  return new (window.AudioContext || window.webkitAudioContext)();
}

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = createAudioContext();
  }
  return audioCtx;
}

function noteToFreq(note) {
  const map = {
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    F4: 349.23,
    G4: 392.0,
    A4: 440.0,
    B4: 493.88,

    C5: 523.25,
    D5: 587.33,
    E5: 659.25,
    F5: 698.46,
    G5: 783.99,
    A5: 880.0,
    B5: 987.77,

    C6: 1046.5,

    REST: 0,
  };

  return map[note] ?? 0;
}

function playTone(ctx, frequency, startTime, duration, volume = 0.02) {
  if (!frequency) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(frequency, startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
  gain.gain.linearRampToValueAtTime(volume * 0.8, startTime + duration * 0.5);
  gain.gain.linearRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

function scheduleMelody(ctx, startTime) {
  const melody = [
    ["C5", 0.2],
    ["E5", 0.2],
    ["G5", 0.2],
    ["A5", 0.3],
    ["G5", 0.2],
    ["E5", 0.2],
    ["D5", 0.3],
    ["REST", 0.1],

    ["E5", 0.2],
    ["G5", 0.2],
    ["A5", 0.2],
    ["C6", 0.3],
    ["A5", 0.2],
    ["G5", 0.2],
    ["E5", 0.3],
    ["REST", 0.1],

    ["D5", 0.2],
    ["F5", 0.2],
    ["A5", 0.2],
    ["G5", 0.3],
    ["F5", 0.2],
    ["D5", 0.2],
    ["C5", 0.3],
    ["REST", 0.1],

    ["E5", 0.2],
    ["D5", 0.2],
    ["C5", 0.2],
    ["D5", 0.2],
    ["E5", 0.2],
    ["G5", 0.3],
    ["E5", 0.3],
    ["REST", 0.2],
  ];

  let t = startTime;

  for (const [note, duration] of melody) {
    const freq = noteToFreq(note);
    playTone(ctx, freq, t, duration, VOLUME.music);
    t += duration;
  }

  return t - startTime;
}

function clearBgmTimer() {
  if (bgmTimer) {
    clearTimeout(bgmTimer);
    bgmTimer = null;
  }
}

function queueBackgroundMusicLoop() {
  if (!bgmEnabled) return;
  if (!audioCtx) return;
  if (document.hidden) return;
  if (audioCtx.state !== "running") return;

  const startTime = audioCtx.currentTime + 0.05;
  const loopDuration = scheduleMelody(audioCtx, startTime);

  clearBgmTimer();

  bgmTimer = window.setTimeout(
    () => {
      queueBackgroundMusicLoop();
    },
    Math.max((loopDuration - 0.2) * 1000, 100),
  );
}

function startBackgroundMusic() {
  if (bgmStarted) return;

  bgmStarted = true;
  bgmEnabled = true;

  audioCtx = createAudioContext();

  audioCtx
    .resume()
    .then(() => {
      queueBackgroundMusicLoop();
    })
    .catch(() => {});
}

function stopAndDestroyAudio() {
  bgmEnabled = false;
  clearBgmTimer();

  if (audioCtx) {
    const ctx = audioCtx;
    audioCtx = null;

    if (ctx.state !== "closed") {
      ctx.close().catch(() => {});
    }
  }
}

function resumeBackgroundMusicFromScratch() {
  if (!bgmStarted) return;
  if (document.hidden) return;

  bgmEnabled = true;

  const ctx = getAudioContext();

  ctx
    .resume()
    .then(() => {
      queueBackgroundMusicLoop();
    })
    .catch(() => {});
}

function unlockAudioAndStartMusic() {
  startBackgroundMusic();
}

function stopBackgroundMusicOnly() {
  bgmEnabled = false;
  clearBgmTimer();
}

window.addEventListener("pointerdown", unlockAudioAndStartMusic, {
  once: true,
});
window.addEventListener("keydown", unlockAudioAndStartMusic, { once: true });

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopAndDestroyAudio();
  } else {
    resumeBackgroundMusicFromScratch();
  }
});

window.addEventListener("blur", () => {
  stopAndDestroyAudio();
});

window.addEventListener("focus", () => {
  resumeBackgroundMusicFromScratch();
});

window.addEventListener("pagehide", () => {
  stopAndDestroyAudio();
});

// =========================
// SOM DE PULO
// =========================
function playJumpSound() {
  const ctx = getAudioContext();

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = "square";

  oscillator.frequency.setValueAtTime(600, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    200,
    ctx.currentTime + 0.15,
  );

  gainNode.gain.setValueAtTime(VOLUME.sfx, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.15);
}

function playLoseLifeSound() {
  const ctx = getAudioContext();

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;

  const notes = [
    { freq: 600, duration: 0.12 },
    { freq: 450, duration: 0.12 },
    { freq: 300, duration: 0.18 },
    { freq: 200, duration: 0.25 },
  ];

  let t = now;

  for (const note of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";

    osc.frequency.setValueAtTime(note.freq, t);

    gain.gain.setValueAtTime(VOLUME.sfx, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + note.duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + note.duration);

    t += note.duration;
  }
}

function playVictorySound() {
  const ctx = getAudioContext();

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;

  const notes = [
    { freq: 523.25, duration: 0.12 }, // C5
    { freq: 659.25, duration: 0.12 }, // E5
    { freq: 783.99, duration: 0.12 }, // G5
    { freq: 1046.5, duration: 0.2 }, // C6
    { freq: 1318.51, duration: 0.4 }, // E6 (mais longa)
  ];

  let t = now;

  for (const note of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(note.freq, t);

    gain.gain.setValueAtTime(VOLUME.sfx, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + note.duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + note.duration);

    t += note.duration;
  }
}

function playGameOverSound() {
  const ctx = getAudioContext();

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;

  const notes = [
    { freq: 392.0, duration: 0.18 }, // G4
    { freq: 329.63, duration: 0.18 }, // E4
    { freq: 261.63, duration: 0.22 }, // C4
    { freq: 196.0, duration: 0.35 }, // G3
  ];

  let t = now;

  for (const note of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(note.freq, t);

    gain.gain.setValueAtTime(VOLUME.sfx, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + note.duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + note.duration);

    t += note.duration;
  }
}

// =========================
// GAME OVER E RESPAWN
// =========================

function respawnPlayer() {
  player.x = GAME_STATE.respawnX;
  player.y = GAME_STATE.respawnY;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;

  camera.x = 0;
}

function loseLife() {
  if (GAME_STATE.gameOver || GAME_STATE.isRespawning) return;

  GAME_STATE.isRespawning = true;
  GAME_STATE.lives -= 1;

  if (GAME_STATE.lives <= 0) {
    GAME_STATE.lives = 0;
    GAME_STATE.gameOver = true;
    GAME_STATE.isRespawning = false;
    player.vx = 0;
    player.vy = 0;

    stopAndDestroyAudio();
    playGameOverSound();
    return;
  }

  stopAndDestroyAudio();
  playLoseLifeSound();

  setTimeout(() => {
    respawnPlayer();
    GAME_STATE.isRespawning = false;
    resumeBackgroundMusicFromScratch();
  }, 700);
}

// =========================
// CONTROLES DE TOQUE
// =========================

function bindHoldButton(button, key) {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    input[key] = true;
  });

  button.addEventListener("pointerup", (event) => {
    event.preventDefault();
    input[key] = false;
  });

  button.addEventListener("pointercancel", () => {
    input[key] = false;
  });

  button.addEventListener("pointerleave", () => {
    input[key] = false;
  });
}

function bindJumpButton(button) {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();

    if (!jumpHeld) {
      jumpPressed = true;
    }

    jumpHeld = true;
  });

  window.addEventListener(
    "pointerdown",
    () => {
      const ctx = getAudioContext();
      if (ctx.state === "suspended") {
        ctx.resume();
      }
    },
    { once: true },
  );

  button.addEventListener("pointerup", (event) => {
    event.preventDefault();
    jumpHeld = false;
    jumpReleased = true;
  });

  button.addEventListener("pointercancel", () => {
    jumpHeld = false;
    jumpReleased = true;
  });

  button.addEventListener("pointerleave", () => {
    jumpHeld = false;
  });
}

bindHoldButton(btnLeft, "left");
bindHoldButton(btnRight, "right");
bindJumpButton(btnJump);

function render() {
  drawBackground();
  drawPlatforms();
  drawGoal();
  drawPlayer();
  drawHud();
}

// =========================
// LOOP
// =========================
function loop(timestamp) {
  const dt = clampDelta((timestamp - lastTime) / 1000);
  lastTime = timestamp;

  update(dt);
  render();

  window.requestAnimationFrame(loop);
}

window.requestAnimationFrame(loop);

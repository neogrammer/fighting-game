const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");
canvas.width = 1024;
canvas.height = 576;

c.fillRect(0, 0, 1024, 576);

const gravity = 0.7;

// Public backend through Caddy/DuckDNS.
const MULTIPLAYER_SERVER_URL = "https://cidfighter.duckdns.org";

const ROUND_TIME_SECONDS = 60;
const HOST_SNAPSHOT_RATE_MS = 50; // 20 snapshots per second

let myRole = "spectator";
let connectedToServer = false;
let multiplayerReady = false;
let matchStarted = false;

let roundTimeRemaining = ROUND_TIME_SECONDS;
let roundStartTime = 0;
let lastSnapshotSentAt = 0;

const socket = io(MULTIPLAYER_SERVER_URL, {
  transports: ["websocket", "polling"]
});

const SPRITE_BASE = {
  scale: 2.5,
  texOffset: {
    x: 90,
    y: 77
  }
};

const PLAYER_SPRITES = {
  [FighterState.IDLE]: {
    imageSrc: './img/kenji/Idle.png',
    numFrames: 4,
    frameFactorX: 4,
    frameDelay: 120,
    loop: true,
    ...SPRITE_BASE
  },

  [FighterState.RUN]: {
    imageSrc: './img/kenji/Run.png',
    numFrames: 8,
    frameFactorX: 8,
    frameDelay: 80,
    loop: true,
    ...SPRITE_BASE
  },

  [FighterState.JUMP]: {
    imageSrc: './img/kenji/Jump.png',
    numFrames: 2,
    frameFactorX: 2,
    frameDelay: 140,
    loop: false,
    ...SPRITE_BASE
  },

  [FighterState.FALL]: {
    imageSrc: './img/kenji/Fall.png',
    numFrames: 2,
    frameFactorX: 2,
    frameDelay: 140,
    loop: false,
    ...SPRITE_BASE
  },

  [FighterState.ATTACK1]: {
    imageSrc: './img/kenji/Attack1.png',
    numFrames: 4,
    frameFactorX: 4,
    frameDelay: 70,
    loop: false,
    ...SPRITE_BASE
  },

  [FighterState.ATTACK2]: {
    imageSrc: './img/kenji/Attack2.png',
    numFrames: 4,
    frameFactorX: 4,
    frameDelay: 70,
    loop: false,
    ...SPRITE_BASE
  },

  [FighterState.TAKE_HIT]: {
    imageSrc: './img/kenji/Take hit.png',
    numFrames: 3,
    frameFactorX: 3,
    frameDelay: 80,
    loop: false,
    ...SPRITE_BASE
  },

  [FighterState.DEATH]: {
    imageSrc: './img/kenji/Death.png',
    numFrames: 7,
    frameFactorX: 7,
    frameDelay: 120,
    loop: false,
    ...SPRITE_BASE
  }
};

const ENEMY_SPRITES = {
  [FighterState.IDLE]: {
    imageSrc: './img/samuraiMack/Idle.png',
    numFrames: 8,
    frameFactorX: 8,
    frameDelay: 120,
    loop: true,
    ...SPRITE_BASE
  },

  [FighterState.RUN]: {
    imageSrc: './img/samuraiMack/Run.png',
    numFrames: 8,
    frameFactorX: 8,
    frameDelay: 80,
    loop: true,
    ...SPRITE_BASE
  },

  [FighterState.JUMP]: {
    imageSrc: './img/samuraiMack/Jump.png',
    numFrames: 2,
    frameFactorX: 2,
    frameDelay: 140,
    loop: false,
    ...SPRITE_BASE
  },

  [FighterState.FALL]: {
    imageSrc: './img/samuraiMack/Fall.png',
    numFrames: 2,
    frameFactorX: 2,
    frameDelay: 140,
    loop: false,
    ...SPRITE_BASE
  },

  [FighterState.ATTACK1]: {
    imageSrc: './img/samuraiMack/Attack1.png',
    numFrames: 6,
    frameFactorX: 6,
    frameDelay: 70,
    loop: false,
    ...SPRITE_BASE
  },

  [FighterState.ATTACK2]: {
    imageSrc: './img/samuraiMack/Attack2.png',
    numFrames: 6,
    frameFactorX: 6,
    frameDelay: 70,
    loop: false,
    ...SPRITE_BASE
  },

  [FighterState.TAKE_HIT]: {
    imageSrc: './img/samuraiMack/Take Hit.png',
    numFrames: 4,
    frameFactorX: 4,
    frameDelay: 80,
    loop: false,
    ...SPRITE_BASE
  },

  [FighterState.DEATH]: {
    imageSrc: './img/samuraiMack/Death.png',
    numFrames: 6,
    frameFactorX: 6,
    frameDelay: 120,
    loop: false,
    ...SPRITE_BASE
  }
};

const player = new Fighter({
  position: {
    x: 100,
    y: 100
  },

  size: {
    w: 20,
    h: 51,
  },

  velocity: {
    x: 0,
    y: 0
  },

  facingRight: false,  
  invertFlipX: true,
  spriteConfigs: PLAYER_SPRITES,

  attackBoxes: {
    [FighterState.ATTACK1]: {
      offset: {
        x: 19,
        y: 73
      },
      size: {
        w: 75,
        h: 51
      },
      activeFrame: 1
    },

    [FighterState.ATTACK2]: {
      offset: {
        x: 15,
        y: 48
      },
      size: {
        w: 84,
        h: 70
      },
      activeFrame: 1
    }
  }
});

const enemy = new Fighter({
  position: {
    x: 850,
    y: 100
  },

  size: {
    w: 20,
    h: 44
  },

  velocity: {
    x: 0,
    y: 0
  },

  facingRight: true,
  invertFlipX: false,
  spriteConfigs: ENEMY_SPRITES,

  attackBoxes: {
    [FighterState.ATTACK1]: {
      offset: {
        x: 83,
        y: 56
      },
      size: {
        w: 106,
        h: 61
      },
      activeFrame: 5
    },

    [FighterState.ATTACK2]: {
      offset: {
        x: 88,
        y: 80
      },
      size: {
        w: 107,
        h: 33
      },
      activeFrame: 5
    }
  }
});

const background = new Sprite({
  position: {
    x: 0,
    y: 0,
  },
  size: {
    w: 1024,
    h: 576,
  },
  imageSrc: './img/background.png',
  scale: 1,
  frameFactorX: 1,
  frameFactorY: 1,
  numFrames: 1,
  frameDelay: 1000,
  texOffset: {
    x: 0,
    y: 0,
  }
});

const shop = new Sprite({
  position: {
    x: 600,
    y: 128,
  },
  size: {
    w: 708,
    h: 128,
  },
  imageSrc: './img/shop.png',
  scale: 2.75,
  frameFactorX: 6,
  frameFactorY: 1,
  numFrames: 6,
  frameDelay: 230,
  texOffset: {
    x: 0,
    y: 0,
  }
});

const keys = {
  a: { pressed: false },
  d: { pressed: false },
  w: { pressed: false },
  l: { pressed: false },
  r: { pressed: false },
  u: { pressed: false },
};

function isHost()
{
  return myRole === "player1";
}

function isPlayerRole(role)
{
  return role === "player1" || role === "player2";
}

function showOverlay(text)
{
  if (gameOver) return;

  const displayText = document.querySelector("#displayText");
  displayText.style.display = "flex";
  displayText.innerHTML = text;
}

function hideOverlay()
{
  if (gameOver) return;

  const displayText = document.querySelector("#displayText");
  displayText.style.display = "none";
}

function updateRoomOverlay()
{
  if (!connectedToServer) {
    showOverlay("Connecting...");
    return;
  }

  if (!multiplayerReady) {
    if (myRole === "player1") {
      showOverlay("You are Player 1<br>Waiting for Player 2");
    }
    else if (myRole === "player2") {
      showOverlay("You are Player 2<br>Waiting for Player 1");
    }
    else {
      showOverlay("Spectating<br>Waiting for both players");
    }

    return;
  }

  if (!matchStarted) {
    showOverlay("Match starting...");
    return;
  }

  hideOverlay();
}

function setTimerDisplay(value)
{
  document.querySelector("#timer").innerHTML = Math.max(0, Math.ceil(value));
}

function updateHealthBars()
{
  document.querySelector('#playerHealth').style.width = player.health + '%';
  document.querySelector('#enemyHealth').style.width = enemy.health + '%';
}

function showWinnerTextFromSnapshot()
{
  const displayText = document.querySelector("#displayText");
  displayText.style.display = "flex";

  if (player.health === enemy.health) {
    displayText.innerHTML = "Tie";
  } else if (player.health > enemy.health) {
    displayText.innerHTML = "Player 1 Wins";
  } else {
    displayText.innerHTML = "Player 2 Wins";
  }
}

socket.on("connect", () => {
  connectedToServer = true;
  console.log("Connected to multiplayer server:", socket.id);
  updateRoomOverlay();
});

socket.on("connect_error", (error) => {
  connectedToServer = false;
  multiplayerReady = false;
  matchStarted = false;
  console.log("Could not connect to multiplayer server:", error.message);
  showOverlay("Cannot reach server<br>Check Pi URL");
});

socket.on("role", (role) => {
  myRole = role;
  console.log("Assigned role:", myRole);
  updateRoomOverlay();
});

socket.on("roomState", (state) => {
  multiplayerReady = state.player1Connected && state.player2Connected;
  console.log("Room state:", state);

  if (!multiplayerReady) {
    matchStarted = false;
    gameOver = false;
    winnerDisplayed = false;
    roundTimeRemaining = ROUND_TIME_SECONDS;
    setTimerDisplay(roundTimeRemaining);
  }

  updateRoomOverlay();
});

socket.on("matchReady", () => {
  multiplayerReady = true;

  if (isHost() && !matchStarted) {
    startHostMatch();
  }

  updateRoomOverlay();
});

socket.on("hostInput", ({ role, input }) => {
  if (!isHost()) return;
  applyRoleInput(role, input);
});

socket.on("snapshot", (snapshot) => {
  if (isHost()) return;
  applySnapshot(snapshot);
});

function startHostMatch()
{
  matchStarted = true;
  gameOver = false;
  winnerDisplayed = false;
  roundStartTime = performance.now();
  roundTimeRemaining = ROUND_TIME_SECONDS;
  setTimerDisplay(roundTimeRemaining);
  hideOverlay();

  sendSnapshot(true);
}

function applyRoleInput(role, input)
{
  const fighter = role === "player1" ? player : enemy;

  if (input.action === "left") {
    if (role === "player1") {
      keys.a.pressed = input.pressed;
    } else {
      keys.l.pressed = input.pressed;
    }
  }
  else if (input.action === "right") {
    if (role === "player1") {
      keys.d.pressed = input.pressed;
    } else {
      keys.r.pressed = input.pressed;
    }
  }
  else if (input.action === "jump") {
    fighter.startJump();
  }
  else if (input.action === "jumpRelease") {
    if (fighter.velocity.y < 0) {
      fighter.velocity.y = 0;
    }
  }
  else if (input.action === "attack") {
    fighter.tryAttack();
  }
}

function sendLocalInput(input)
{
  if (!multiplayerReady) return;
  if (!isPlayerRole(myRole)) return;

  // Host applies immediately. Non-host waits for snapshots.
  if (isHost()) {
    applyRoleInput(myRole, input);
  }

  socket.emit("input", input);
}

function applyMovementInput(fighter, leftPressed, rightPressed)
{
  fighter.velocity.x = 0;

  if (!fighter.canMove()) return;

  if (leftPressed && !rightPressed) {
    fighter.velocity.x = -fighter.movementSpeed;
    fighter.faceLeft();
  }
  else if (rightPressed && !leftPressed) {
    fighter.velocity.x = fighter.movementSpeed;
    fighter.faceRight();
  }

  if (!fighter.canJump) {
    if (fighter.velocity.y < 0) {
      fighter.setMovementState(FighterState.JUMP);
    } else {
      fighter.setMovementState(FighterState.FALL);
    }

    return;
  }

  if (fighter.velocity.x !== 0) {
    fighter.setMovementState(FighterState.RUN);
  } else {
    fighter.setMovementState(FighterState.IDLE);
  }
}

function applyHit(attacker, defender, defenderHealthSelector, consoleText)
{
  if (!attacker.canHit()) return;
  if (!rectangularCollision({ rectangle1: attacker, rectangle2: defender })) return;

  attacker.attackHasHit = true;
  defender.receiveHit(attacker.attackDamage);

  document.querySelector(defenderHealthSelector).style.width = defender.health + '%';
  console.log(consoleText);
}

function bothDeathAnimationsAreReady()
{
  if (player.health <= 0 && !player.hasFinishedDeath()) return false;
  if (enemy.health <= 0 && !enemy.hasFinishedDeath()) return false;
  return player.health <= 0 || enemy.health <= 0;
}

function updateHostTimer(timestamp)
{
  if (!matchStarted || gameOver) return;

  const elapsedSeconds = (timestamp - roundStartTime) / 1000;
  roundTimeRemaining = Math.max(0, ROUND_TIME_SECONDS - elapsedSeconds);
  setTimerDisplay(roundTimeRemaining);

  if (roundTimeRemaining <= 0) {
    determineWinner({ player, enemy });
  }
}

function buildFighterSnapshot(fighter)
{
  return {
    x: fighter.position.x,
    y: fighter.position.y,
    vx: fighter.velocity.x,
    vy: fighter.velocity.y,
    facingRight: fighter.facingRight,
    flipX: fighter.flipX,
    state: fighter.state,
    health: fighter.health,
    canJump: fighter.canJump,
    isAttacking: fighter.isAttacking,
    attackHasHit: fighter.attackHasHit,
    comboWindowOpen: fighter.comboWindowOpen,
    comboWindowOpenedForAttack: fighter.comboWindowOpenedForAttack,
    comboWindowExpiresAt: fighter.comboWindowExpiresAt,
    queuedAttack2: fighter.queuedAttack2,
    deathAnimationFinished: fighter.deathAnimationFinished,
    currentFrame: fighter.currentSprite ? fighter.currentSprite.currentFrame : 0,
    finishedAnimation: fighter.currentSprite ? fighter.currentSprite.finishedAnimation : false
  };
}

function applyFighterSnapshot(fighter, snapshot)
{
  fighter.position.x = snapshot.x;
  fighter.position.y = snapshot.y;
  fighter.velocity.x = snapshot.vx;
  fighter.velocity.y = snapshot.vy;
  fighter.facingRight = snapshot.facingRight;
  fighter.flipX = snapshot.flipX;
  fighter.health = snapshot.health;
  fighter.canJump = snapshot.canJump;
  fighter.isAttacking = snapshot.isAttacking;
  fighter.attackHasHit = snapshot.attackHasHit;
  fighter.comboWindowOpen = snapshot.comboWindowOpen;
  fighter.comboWindowOpenedForAttack = snapshot.comboWindowOpenedForAttack;
  fighter.comboWindowExpiresAt = snapshot.comboWindowExpiresAt;
  fighter.queuedAttack2 = snapshot.queuedAttack2;
  fighter.deathAnimationFinished = snapshot.deathAnimationFinished;

  if (fighter.state !== snapshot.state) {
    fighter.setState(snapshot.state, true);
  }

  if (fighter.currentSprite) {
    fighter.currentSprite.currentFrame = snapshot.currentFrame;
    fighter.currentSprite.finishedAnimation = snapshot.finishedAnimation;
  }

  fighter.updateAttackBox();
}

function buildSnapshot()
{
  return {
    matchStarted,
    gameOver,
    winnerDisplayed,
    roundTimeRemaining,
    player: buildFighterSnapshot(player),
    enemy: buildFighterSnapshot(enemy)
  };
}

function applySnapshot(snapshot)
{
  matchStarted = snapshot.matchStarted;
  roundTimeRemaining = snapshot.roundTimeRemaining;

  applyFighterSnapshot(player, snapshot.player);
  applyFighterSnapshot(enemy, snapshot.enemy);

  gameOver = snapshot.gameOver;
  winnerDisplayed = snapshot.winnerDisplayed;

  setTimerDisplay(roundTimeRemaining);
  updateHealthBars();

  if (gameOver) {
    showWinnerTextFromSnapshot();
  } else {
    updateRoomOverlay();
  }
}

function sendSnapshot(force = false)
{
  const now = performance.now();

  if (!force && now - lastSnapshotSentAt < HOST_SNAPSHOT_RATE_MS) return;

  lastSnapshotSentAt = now;
  socket.emit("hostSnapshot", buildSnapshot());
}

function updateHost(timestamp)
{
  if (!multiplayerReady || !matchStarted) {
    player.velocity.x = 0;
    enemy.velocity.x = 0;
    player.update(timestamp);
    enemy.update(timestamp);
    return;
  }

  updateHostTimer(timestamp);

  if (!gameOver) {
    applyMovementInput(player, keys.a.pressed, keys.d.pressed);
    applyMovementInput(enemy, keys.l.pressed, keys.r.pressed);
  } else {
    player.velocity.x = 0;
    enemy.velocity.x = 0;
  }

  player.update(timestamp);
  enemy.update(timestamp);

  if (!gameOver) {
    applyHit(player, enemy, '#enemyHealth', 'player hit enemy');
    applyHit(enemy, player, '#playerHealth', 'enemy hit player');

    if (bothDeathAnimationsAreReady()) {
      determineWinner({ player, enemy });
    }
  }

  sendSnapshot();
}

function updateRemoteViewer(timestamp)
{
  // Non-hosts do NOT simulate movement, collision, health, or timer.
  // They just draw the latest host-owned snapshot.
  player.draw(timestamp);
  enemy.draw(timestamp);
}

function animate(timestamp) 
{
  window.requestAnimationFrame(animate);

  c.fillStyle = 'black';
  c.fillRect(0, 0, canvas.width, canvas.height);

  background.update(timestamp);
  shop.update(timestamp);

  if (isHost()) {
    updateHost(timestamp);
  } else {
    updateRemoteViewer(timestamp);
  }
}

window.requestAnimationFrame(animate);

let isSpaceDown = false;
let isArrowDown = false;

window.addEventListener('keydown', (event) => {
  if (event.repeat) return;

  switch(event.key)
  {
    case 'd':
      if (myRole === "player1") sendLocalInput({ action: "right", pressed: true });
      break;

    case 'a':
      if (myRole === "player1") sendLocalInput({ action: "left", pressed: true });
      break;

    case 'w':
      if (myRole === "player1") sendLocalInput({ action: "jump" });
      break;

    case 'ArrowRight':
      if (myRole === "player2") sendLocalInput({ action: "right", pressed: true });
      break;

    case 'ArrowLeft':
      if (myRole === "player2") sendLocalInput({ action: "left", pressed: true });
      break;

    case 'ArrowUp':
      if (myRole === "player2") sendLocalInput({ action: "jump" });
      break;

    case " ":
      if (!isSpaceDown && myRole === "player1") sendLocalInput({ action: "attack" });
      isSpaceDown = true;
      break;

    case "ArrowDown":
      if (!isArrowDown && myRole === "player2") sendLocalInput({ action: "attack" });
      isArrowDown = true;
      break;
  }
});

window.addEventListener('keyup', (event) => {
  switch(event.key)
  {
    case 'd':
      if (myRole === "player1") sendLocalInput({ action: "right", pressed: false });
      break;

    case 'a':
      if (myRole === "player1") sendLocalInput({ action: "left", pressed: false });
      break;

    case 'w':
      if (myRole === "player1") sendLocalInput({ action: "jumpRelease" });
      break;

    case 'ArrowRight':
      if (myRole === "player2") sendLocalInput({ action: "right", pressed: false });
      break;

    case 'ArrowLeft':
      if (myRole === "player2") sendLocalInput({ action: "left", pressed: false });
      break;

    case 'ArrowUp':
      if (myRole === "player2") sendLocalInput({ action: "jumpRelease" });
      break;

    case " ":
      isSpaceDown = false;
      break;

    case 'ArrowDown':
      isArrowDown = false;
      break;
  }
});

// Mobile controls

const isTouchDevice =
  navigator.maxTouchPoints > 0 ||
  window.matchMedia("(pointer: coarse)").matches;

const mobileControls = document.querySelector("#mobileControls");
const rotatePrompt = document.querySelector("#rotatePrompt");

function isLandscape() {
  return window.innerWidth > window.innerHeight;
}

function updateMobileUi() {
  if (!isTouchDevice) return;

  mobileControls.style.display = "block";
  rotatePrompt.style.display = isLandscape() ? "none" : "flex";
}

async function tryLockLandscape() {
  try {
    if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }

    if (screen.orientation && screen.orientation.lock) {
      await screen.orientation.lock("landscape");
    }
  } catch (error) {
    console.log("Landscape lock not available:", error);
  }
}

function bindHoldButton(buttonId, onDown, onUp) {
  const button = document.querySelector(buttonId);

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    tryLockLandscape();
    onDown();
  });

  button.addEventListener("pointerup", (event) => {
    event.preventDefault();
    onUp();
  });

  button.addEventListener("pointercancel", (event) => {
    event.preventDefault();
    onUp();
  });

  button.addEventListener("lostpointercapture", () => {
    onUp();
  });
}

function bindTapButton(buttonId, onTap) {
  const button = document.querySelector(buttonId);

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    tryLockLandscape();
    onTap();
  });
}

if (isTouchDevice) {
  updateMobileUi();

  window.addEventListener("resize", updateMobileUi);
  window.addEventListener("orientationchange", updateMobileUi);

  bindHoldButton(
    "#btnLeft",
    () => {
      if (myRole === "player1" || myRole === "player2") {
        sendLocalInput({ action: "left", pressed: true });
      }
    },
    () => {
      if (myRole === "player1" || myRole === "player2") {
        sendLocalInput({ action: "left", pressed: false });
      }
    }
  );

  bindHoldButton(
    "#btnRight",
    () => {
      if (myRole === "player1" || myRole === "player2") {
        sendLocalInput({ action: "right", pressed: true });
      }
    },
    () => {
      if (myRole === "player1" || myRole === "player2") {
        sendLocalInput({ action: "right", pressed: false });
      }
    }
  );

  bindTapButton("#btnJump", () => {
    if (myRole === "player1" || myRole === "player2") {
      sendLocalInput({ action: "jump" });
    }
  });

  bindTapButton("#btnAttack", () => {
    if (myRole === "player1" || myRole === "player2") {
      sendLocalInput({ action: "attack" });
    }
  });
}

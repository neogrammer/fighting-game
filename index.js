const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");
canvas.width = 1024;
canvas.height = 576;

c.fillRect(0, 0, 1024, 576);

const gravity = 0.7;

// While testing on same Wi-Fi, use your Pi's local IP:
const MULTIPLAYER_SERVER_URL = "http://192.168.0.10:3000";

// Later with DuckDNS + HTTPS/Caddy:
// const MULTIPLAYER_SERVER_URL = "https://fightinggame86.netlify.app";

window.multiplayerReady = false;

let connectedToServer = false;
let myRole = "spectator";

const socket = io(MULTIPLAYER_SERVER_URL, {
  transports: ["websocket", "polling"]
});

function isPlayerRole(role) {
  return role === "player1" || role === "player2";
}

function showOverlay(text) {
  if (gameOver) return;

  const displayText = document.querySelector("#displayText");
  displayText.style.display = "flex";
  displayText.innerHTML = text;
}

function hideOverlay() {
  if (gameOver) return;

  const displayText = document.querySelector("#displayText");
  displayText.style.display = "none";
}

function updateRoomOverlay() {
  if (!connectedToServer) {
    showOverlay("Connecting...");
    return;
  }

  if (!window.multiplayerReady) {
    if (myRole === "player1") {
      showOverlay("You are Player 1<br>Waiting for Player 2");
    } else if (myRole === "player2") {
      showOverlay("You are Player 2<br>Waiting for Player 1");
    } else {
      showOverlay("Spectating<br>Waiting for both players");
    }

    return;
  }

  hideOverlay();
}

socket.on("connect", () => {
  connectedToServer = true;
  console.log("Connected:", socket.id);
  updateRoomOverlay();
});

socket.on("connect_error", (error) => {
  connectedToServer = false;
  window.multiplayerReady = false;
  console.log("Server connection failed:", error.message);
  showOverlay("Cannot reach server<br>Check Pi URL");
});

socket.on("role", (role) => {
  myRole = role;
  console.log("Assigned role:", myRole);
  updateRoomOverlay();
});

socket.on("roomState", (state) => {
  window.multiplayerReady = state.player1Connected && state.player2Connected;
  console.log("Room:", state);
  updateRoomOverlay();
});

socket.on("remoteInput", ({ role, input }) => {
  if (!isPlayerRole(role)) return;
  if (role === myRole) return;

  applyRoleInput(role, input);
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
  a: {
    pressed: false
  },
  d: {
    pressed: false
  },
  w: {
    pressed: false
  },
  l: {
    pressed: false
  },
  r: {
    pressed: false
  },
  u: {
    pressed: false
  },
};

function applyRoleInput(role, input) {
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

function sendAndApplyLocalInput(input) {
  if (!window.multiplayerReady) return;
  if (!isPlayerRole(myRole)) return;

  applyRoleInput(myRole, input);
  socket.emit("input", input);
}

function updateHealthBars()
{
  document.querySelector('#playerHealth').style.width = player.health + '%';
  document.querySelector('#enemyHealth').style.width = enemy.health + '%';
}

function applyMovementInput(fighter, leftPressed, rightPressed)
{
  fighter.velocity.x = 0;

  if (!fighter.canMove()) {
    return;
  }

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
  if (!attacker.canHit()) {
    return;
  }

  if (!rectangularCollision({ rectangle1: attacker, rectangle2: defender })) {
    return;
  }

  attacker.attackHasHit = true;
  defender.receiveHit(attacker.attackDamage);

  document.querySelector(defenderHealthSelector).style.width = defender.health + '%';

  console.log(consoleText);
}

function bothDeathAnimationsAreReady()
{
  if (player.health <= 0 && !player.hasFinishedDeath()) {
    return false;
  }

  if (enemy.health <= 0 && !enemy.hasFinishedDeath()) {
    return false;
  }

  return player.health <= 0 || enemy.health <= 0;
}

decreaseTimer();

function animate(timestamp) 
{
  window.requestAnimationFrame(animate);

  if (gameOver) {
    return;
  }

  c.fillStyle = 'black';
  c.fillRect(0, 0, canvas.width, canvas.height);

  background.update(timestamp);
  shop.update(timestamp);

  if (window.multiplayerReady) {
  applyMovementInput(player, keys.a.pressed, keys.d.pressed);
  if (player.facingRight)
    player.flipX = true;
  else
    player.flipX = false;
  applyMovementInput(enemy, keys.l.pressed, keys.r.pressed);
} else {
    player.velocity.x = 0;
  enemy.velocity.x = 0;
}

  player.update(timestamp);
  enemy.update(timestamp);

  if (window.multiplayerReady) {
  applyHit(player, enemy, '#enemyHealth', 'player hit enemy');
  applyHit(enemy, player, '#playerHealth', 'enemy hit player');
}

  if (bothDeathAnimationsAreReady()) {
    determineWinner({ player, enemy });
  }
}

window.requestAnimationFrame(animate);

let isSpaceDown = false;
let isArrowDown = false;

window.addEventListener('keydown', (event) => {
  if (event.repeat) return;

  switch(event.key) {
    case 'd':
      if (myRole === "player1") {
        sendAndApplyLocalInput({ action: "right", pressed: true });
      }
      break;

    case 'a':
      if (myRole === "player1") {
        sendAndApplyLocalInput({ action: "left", pressed: true });
      }
      break;

    case 'w':
      if (myRole === "player1") {
        sendAndApplyLocalInput({ action: "jump" });
      }
      break;

    case " ":
      if (!isSpaceDown && myRole === "player1") {
        sendAndApplyLocalInput({ action: "attack" });
      }
      isSpaceDown = true;
      break;

    case 'ArrowRight':
      if (myRole === "player2") {
        sendAndApplyLocalInput({ action: "right", pressed: true });
      }
      break;

    case 'ArrowLeft':
      if (myRole === "player2") {
        sendAndApplyLocalInput({ action: "left", pressed: true });
      }
      break;

    case 'ArrowUp':
      if (myRole === "player2") {
        sendAndApplyLocalInput({ action: "jump" });
      }
      break;

    case "ArrowDown":
      if (!isArrowDown && myRole === "player2") {
        sendAndApplyLocalInput({ action: "attack" });
      }
      isArrowDown = true;
      break;
  }
});

window.addEventListener('keyup', (event) => {
  switch(event.key) {
    case 'd':
      if (myRole === "player1") {
        sendAndApplyLocalInput({ action: "right", pressed: false });
      }
      break;

    case 'a':
      if (myRole === "player1") {
        sendAndApplyLocalInput({ action: "left", pressed: false });
      }
      break;

    case 'w':
      if (myRole === "player1") {
        sendAndApplyLocalInput({ action: "jumpRelease" });
      }
      break;

    case " ":
      isSpaceDown = false;
      break;

    case 'ArrowRight':
      if (myRole === "player2") {
        sendAndApplyLocalInput({ action: "right", pressed: false });
      }
      break;

    case 'ArrowLeft':
      if (myRole === "player2") {
        sendAndApplyLocalInput({ action: "left", pressed: false });
      }
      break;

    case 'ArrowUp':
      if (myRole === "player2") {
        sendAndApplyLocalInput({ action: "jumpRelease" });
      }
      break;

    case "ArrowDown":
      isArrowDown = false;
      break;
  }
});
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
  () => sendAndApplyLocalInput({ action: "left", pressed: true }),
  () => sendAndApplyLocalInput({ action: "left", pressed: false })
);

bindHoldButton(
  "#btnRight",
  () => sendAndApplyLocalInput({ action: "right", pressed: true }),
  () => sendAndApplyLocalInput({ action: "right", pressed: false })
);

bindTapButton("#btnJump", () => {
  sendAndApplyLocalInput({ action: "jump" });
});

bindTapButton("#btnAttack", () => {
  sendAndApplyLocalInput({ action: "attack" });
});
}

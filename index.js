const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");
canvas.width = 1024;
canvas.height = 576;

c.fillRect(0, 0, 1024, 576);

const gravity = 0.7;

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

  applyMovementInput(player, keys.a.pressed, keys.d.pressed);
  if (player.facingRight)
    player.flipX = true;
  else
    player.flipX = false;
  applyMovementInput(enemy, keys.l.pressed, keys.r.pressed);

  player.update(timestamp);
  enemy.update(timestamp);

  applyHit(player, enemy, '#enemyHealth', 'player hit enemy');
  applyHit(enemy, player, '#playerHealth', 'enemy hit player');

  if (bothDeathAnimationsAreReady()) {
    determineWinner({ player, enemy });
  }
}

window.requestAnimationFrame(animate);

let isSpaceDown = false;
let isArrowDown = false;

window.addEventListener('keydown', (event) => {
  if (event.repeat) {
    return;
  }

  switch(event.key)
  {
    case 'd':
      keys.d.pressed = true;
      break;

    case 'a':
      keys.a.pressed = true;
      break;

    case 'w':
      player.startJump();
      break;

    case 'ArrowRight':
      keys.r.pressed = true;
      break;

    case 'ArrowLeft':
      keys.l.pressed = true;
      break;

    case 'ArrowUp':
      keys.u.pressed = true;
      enemy.startJump();
      break;

    case " ":
      if (!isSpaceDown) {
        player.tryAttack();
      }

      isSpaceDown = true;
      break;

    case "ArrowDown":
      if (!isArrowDown) {
        enemy.tryAttack();
      }

      isArrowDown = true;
      break;
  }
});

window.addEventListener('keyup', (event) => {
  switch(event.key)
  {
    case 'd':
      keys.d.pressed = false;
      break;

    case 'a':
      keys.a.pressed = false;
      break;

    case 'w':
      keys.w.pressed = false;

      if (player.velocity.y < 0) {
        player.velocity.y = 0;
      }
      break;

    case 'ArrowRight':
      keys.r.pressed = false;
      break;

    case 'ArrowLeft':
      keys.l.pressed = false;
      break;

    case 'ArrowUp':
      keys.u.pressed = false;

      if (enemy.velocity.y < 0) {
        enemy.velocity.y = 0;
      }
      break;

    case " ":
      isSpaceDown = false;
      break;

    case 'ArrowDown':
      isArrowDown = false;
      break;
  }
});

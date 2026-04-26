const FighterState = {
  IDLE: 'Idle',
  RUN: 'Run',
  JUMP: 'Jump',
  FALL: 'Fall',
  ATTACK1: 'Attack1',
  ATTACK2: 'Attack2',
  TAKE_HIT: 'TakeHit',
  DEATH: 'Death'
};

class Sprite 
{
  constructor({
    position, 
    size, 
    imageSrc, 
    scale = 1, 
    frameFactorX = 1, 
    frameFactorY = 1, 
    numFrames = 1,
    frameDelay = 100,
    texOffset = {
      x: 0,
      y: 0
    },
    bodyAnchored = false,
    loop = true
  }) 
  {
    this.position = position;
    this.size = size;

    this.image = new Image();
    this.image.src = imageSrc;

    this.scale = scale;
    this.frameFactorX = frameFactorX;
    this.frameFactorY = frameFactorY;

    this.maxFrame = numFrames - 1;
    this.currentFrame = 0;

    this.frameDelay = frameDelay;
    this.lastFrameTime = 0;

    this.texOffset = {
      x: texOffset.x ?? 0,
      y: texOffset.y ?? 0
    };

    this.flipX = false;
    this.bodyAnchored = bodyAnchored;
    this.loop = loop;

    this.drawPosition = {
      x: 0,
      y: 0
    };

    this.drawnFrame = 0;
    this.finishedAnimation = false;
  }

  resetAnimation()
  {
    this.currentFrame = 0;
    this.lastFrameTime = 0;
    this.finishedAnimation = false;
  }

  draw() 
  {
    const frameWidth = this.image.width / this.frameFactorX;
    const frameHeight = this.image.height / this.frameFactorY;

    const drawWidth = frameWidth * this.scale;
    const drawHeight = frameHeight * this.scale;

    const sourceX = frameWidth * this.currentFrame;
    const sourceY = 0;

    let drawX = this.position.x - this.texOffset.x * this.scale;
    let drawY = this.position.y - this.texOffset.y * this.scale;

    if (this.bodyAnchored) {
      const bodyWidth = this.size.w * this.scale;

      const leftPadding = this.texOffset.x * this.scale;
      const rightPadding = drawWidth - leftPadding - bodyWidth;

      if (this.flipX) {
        drawX = this.position.x - rightPadding;
      } else {
        drawX = this.position.x - leftPadding;
      }
    }

    this.drawPosition.x = drawX;
    this.drawPosition.y = drawY;
    this.drawnFrame = this.currentFrame;

    c.save();

    if (this.flipX) {
      c.translate(drawX + drawWidth, drawY);
      c.scale(-1, 1);

      c.drawImage(
        this.image,
        sourceX,
        sourceY,
        frameWidth,
        frameHeight,
        0,
        0,
        drawWidth,
        drawHeight
      );
    } else {
      c.drawImage(
        this.image,
        sourceX,
        sourceY,
        frameWidth,
        frameHeight,
        drawX,
        drawY,
        drawWidth,
        drawHeight
      );
    }

    c.restore();
  }

  update(timestamp) 
  {
    this.draw();

    if (this.lastFrameTime === 0) {
      this.lastFrameTime = timestamp;
      return;
    }

    if (timestamp - this.lastFrameTime < this.frameDelay) {
      return;
    }

    if (this.currentFrame < this.maxFrame) {
      this.currentFrame++;
    } else if (this.loop) {
      this.currentFrame = 0;
    } else {
      this.finishedAnimation = true;
    }

    this.lastFrameTime = timestamp;
  }
}

class Fighter 
{
  constructor({
    position, 
    size, 
    velocity,
    facingRight,
    spriteConfigs = {},
    attackBoxes = {},
    movementSpeed = 5,
    jumpVelocity = -20,
    attackDamage = 5,
    comboWindowMs = 300,
    showDebugBoxes = true
  }) 
  {
    this.position = position;
    this.size = size;
    this.velocity = velocity;

    this.movementSpeed = movementSpeed;
    this.jumpVelocity = jumpVelocity;
    this.attackDamage = attackDamage;

    this.canJump = false;
    this.lastKey = '';

    this.sprites = [];
    this.spriteIndexes = {};
    this.currentSpriteIndex = 0;
    this.currentSprite = null;

    this.facingRight = facingRight;
    this.flipX = !facingRight;

    this.state = FighterState.IDLE;

    this.attackBoxes = attackBoxes;
    this.attackBox = {
      position: {
        x: this.position.x,
        y: this.position.y,
      },
      width: 0,
      height: 0,
    };

    this.isAttacking = false;
    this.attackHasHit = false;

    this.comboWindowMs = comboWindowMs;
    this.comboWindowOpen = false;
    this.comboWindowOpenedForAttack = false;
    this.comboWindowExpiresAt = 0;
    this.queuedAttack2 = false;

    this.health = 100;
    this.deathAnimationFinished = false;

    this.showDebugBoxes = showDebugBoxes;

    this.createSprites(spriteConfigs);
    this.setState(FighterState.IDLE, true);
  }

  createSprites(spriteConfigs) 
  {
    const states = Object.keys(spriteConfigs);

    for (let i = 0; i < states.length; i++) {
      const state = states[i];
      const config = spriteConfigs[state];

      this.spriteIndexes[state] = this.sprites.length;

      this.sprites.push(
        new Sprite({
          position: this.position,
          size: this.size,

          imageSrc: config.imageSrc,

          scale: config.scale ?? 1,
          frameFactorX: config.frameFactorX ?? config.numFrames ?? 1,
          frameFactorY: config.frameFactorY ?? 1,
          numFrames: config.numFrames ?? config.frameFactorX ?? 1,
          frameDelay: config.frameDelay ?? 100,

          texOffset: config.texOffset ?? {
            x: 0,
            y: 0
          },

          bodyAnchored: true,
          loop: config.loop ?? true,
        })
      );
    }
  }

  setState(nextState, force = false) 
  {
    if (!(nextState in this.spriteIndexes)) {
      return;
    }

    if (!force && this.state === nextState) {
      return;
    }

    this.state = nextState;
    this.currentSpriteIndex = this.spriteIndexes[nextState];
    this.currentSprite = this.sprites[this.currentSpriteIndex];

    this.currentSprite.resetAnimation();
  }

  isInState(state)
  {
    return this.state === state;
  }

  isDead()
  {
    return this.state === FighterState.DEATH || this.health <= 0;
  }

  isActionLocked()
  {
    return (
      this.state === FighterState.ATTACK1 ||
      this.state === FighterState.ATTACK2 ||
      this.state === FighterState.TAKE_HIT ||
      this.state === FighterState.DEATH
    );
  }

  canMove()
  {
    return !this.isActionLocked() && !this.isDead();
  }

  faceLeft()
  {
    this.facingRight = false;
    this.flipX = true;
  }

  faceRight()
  {
    this.facingRight = true;
    this.flipX = false;
  }

  setMovementState(nextState)
  {
    if (!this.canMove()) {
      return;
    }

    this.setState(nextState);
  }

  startJump()
  {
    if (!this.canMove()) {
      return;
    }

    if (!this.canJump) {
      return;
    }

    this.canJump = false;
    this.velocity.y = this.jumpVelocity;
    this.setState(FighterState.JUMP);
  }

  updateAttackBox() 
  {
    const attackBoxData = this.attackBoxes[this.state];

    if (!attackBoxData || !this.currentSprite) {
      this.attackBox.width = 0;
      this.attackBox.height = 0;
      return;
    }

    const scale = this.currentSprite.scale;

    const offsetX = attackBoxData.offset.x * scale;
    const offsetY = attackBoxData.offset.y * scale;

    this.attackBox.width = attackBoxData.size.w * scale;
    this.attackBox.height = attackBoxData.size.h * scale;

    const frameWidth = this.currentSprite.image.width / this.currentSprite.frameFactorX;
    const drawWidth = frameWidth * scale;

    if (this.currentSprite.flipX) {
      this.attackBox.position.x =
        this.currentSprite.drawPosition.x + drawWidth - offsetX - this.attackBox.width;
    } else {
      this.attackBox.position.x =
        this.currentSprite.drawPosition.x + offsetX;
    }

    this.attackBox.position.y =
      this.currentSprite.drawPosition.y + offsetY;
  }

  getCurrentAttackBoxData()
  {
    return this.attackBoxes[this.state];
  }

  isAttackBoxActive() 
  {
    const attackBoxData = this.getCurrentAttackBoxData();

    if (!this.isAttacking || !attackBoxData || !this.currentSprite) {
      return false;
    }

    return this.currentSprite.drawnFrame === attackBoxData.activeFrame;
  }

  canHit() 
  {
    return this.isAttackBoxActive() && !this.attackHasHit && !this.isDead();
  }

  tryAttack(now = performance.now()) 
  {
    if (this.state === FighterState.ATTACK1) {
      if (this.comboWindowOpen && now <= this.comboWindowExpiresAt) {
        this.queuedAttack2 = true;
      }

      return;
    }

    if (!this.canJump) {
      return;
    }

    if (this.isActionLocked()) {
      return;
    }

    this.startAttack(FighterState.ATTACK1);
  }

  startAttack(attackState)
  {
    if (this.isDead()) {
      return;
    }

    this.isAttacking = true;
    this.attackHasHit = false;

    this.comboWindowOpen = false;
    this.comboWindowOpenedForAttack = false;
    this.comboWindowExpiresAt = 0;

    if (attackState === FighterState.ATTACK1) {
      this.queuedAttack2 = false;
    }

    if (attackState === FighterState.ATTACK2) {
      this.queuedAttack2 = false;
    }

    this.velocity.x = 0;
    this.setState(attackState, true);
  }

  updateComboWindow(timestamp)
  {
    if (this.state !== FighterState.ATTACK1) {
      this.comboWindowOpen = false;
      return;
    }

    const attackBoxData = this.getCurrentAttackBoxData();

    if (!attackBoxData || !this.currentSprite) {
      return;
    }

    if (
      !this.comboWindowOpenedForAttack &&
      this.currentSprite.drawnFrame === attackBoxData.activeFrame
    ) {
      this.comboWindowOpenedForAttack = true;
      this.comboWindowOpen = true;
      this.comboWindowExpiresAt = timestamp + this.comboWindowMs;
    }

    if (this.comboWindowOpen && timestamp > this.comboWindowExpiresAt) {
      this.comboWindowOpen = false;
    }
  }

  finishAttack()
  {
    this.isAttacking = false;
    this.attackHasHit = false;

    this.comboWindowOpen = false;
    this.comboWindowOpenedForAttack = false;
    this.comboWindowExpiresAt = 0;
    this.queuedAttack2 = false;

    if (!this.canJump) {
      this.setState(FighterState.FALL);
    } else {
      this.setState(FighterState.IDLE);
    }
  }

  receiveHit(damage)
  {
    if (this.isDead()) {
      return false;
    }

    this.health = Math.max(this.health - damage, 0);

    this.isAttacking = false;
    this.attackHasHit = false;
    this.comboWindowOpen = false;
    this.comboWindowOpenedForAttack = false;
    this.comboWindowExpiresAt = 0;
    this.queuedAttack2 = false;

    this.velocity.x = 0;

    if (this.health <= 0) {
      this.die();
    } else {
      this.setState(FighterState.TAKE_HIT, true);
    }

    return true;
  }

  die()
  {
    this.health = 0;
    this.isAttacking = false;
    this.attackHasHit = false;
    this.comboWindowOpen = false;
    this.queuedAttack2 = false;
    this.velocity.x = 0;
    this.setState(FighterState.DEATH, true);
  }

  hasFinishedDeath()
  {
    return this.state === FighterState.DEATH && this.deathAnimationFinished;
  }

  draw(timestamp) 
  {
    if (this.currentSprite) {
      this.currentSprite.flipX = this.flipX;
      this.currentSprite.update(timestamp);
    }

    this.updateAttackBox();

    // if (this.showDebugBoxes) {
    //   c.fillStyle = 'rgba(255, 0, 0, 0.35)';
    //   c.fillRect(
    //     this.position.x,
    //     this.position.y,
    //     this.size.w * this.sprites[this.currentSpriteIndex].scale,
    //     this.size.h * this.sprites[this.currentSpriteIndex].scale,
    //   );

    //   if (this.isAttackBoxActive()) {
    //     c.fillStyle = 'rgba(0, 255, 0, 0.45)';
    //     c.fillRect(
    //       this.attackBox.position.x,
    //       this.attackBox.position.y,
    //       this.attackBox.width,
    //       this.attackBox.height
    //     );
    //   }
    // }
  }

  updatePhysics()
  {
    const currentScale = this.sprites[this.currentSpriteIndex].scale;
    const groundY = canvas.height - 96;

    if (this.position.y + (this.size.h * currentScale) + this.velocity.y >= groundY) {
      this.velocity.y = 0;
      this.position.y = groundY - (this.size.h * currentScale);
      this.canJump = true;
    } else {
      this.velocity.y += gravity;
      this.canJump = false;
    }

    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }

  updateStateAfterAnimation()
  {
    if (!this.currentSprite) {
      return;
    }

    if (this.state === FighterState.ATTACK1 && this.currentSprite.finishedAnimation) {
      if (this.queuedAttack2 && this.canJump && !this.isDead()) {
        this.startAttack(FighterState.ATTACK2);
      } else {
        this.finishAttack();
      }

      return;
    }

    if (this.state === FighterState.ATTACK2 && this.currentSprite.finishedAnimation) {
      this.finishAttack();
      return;
    }

    if (this.state === FighterState.TAKE_HIT && this.currentSprite.finishedAnimation) {
      if (this.canJump) {
        this.setState(FighterState.IDLE);
      } else {
        this.setState(FighterState.FALL);
      }

      return;
    }

    if (this.state === FighterState.DEATH && this.currentSprite.finishedAnimation) {
      this.deathAnimationFinished = true;
    }
  }

  update(timestamp) 
  {
    this.updatePhysics();
    this.draw(timestamp);
    this.updateComboWindow(timestamp);
    this.updateStateAfterAnimation();
  }
};

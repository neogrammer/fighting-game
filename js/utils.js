function rectangularCollision({ rectangle1, rectangle2 }) {
  const rectangle2Scale = rectangle2.sprites[rectangle2.currentSpriteIndex].scale;

  return (
    rectangle1.attackBox.position.x + rectangle1.attackBox.width >= rectangle2.position.x &&
    rectangle1.attackBox.position.x <= rectangle2.position.x + rectangle2.size.w * rectangle2Scale &&
    rectangle1.attackBox.position.y + rectangle1.attackBox.height >= rectangle2.position.y &&
    rectangle1.attackBox.position.y <= rectangle2.position.y + rectangle2.size.h * rectangle2Scale
  );
}

let gameOver = false;
let winnerDisplayed = false;

function determineWinner({ player, enemy })
{
  if (winnerDisplayed) {
    return;
  }

  winnerDisplayed = true;
  document.querySelector('#displayText').style.display = 'flex';

  if (player.health === enemy.health) {
    document.querySelector('#displayText').innerHTML = 'Tie';
  }
  else if (player.health > enemy.health) {
    document.querySelector('#displayText').innerHTML = 'Player 1 Wins';
  }
  else {
    document.querySelector('#displayText').innerHTML = 'Player 2 Wins';
  }

  gameOver = true;
}

let timer = 60;

function decreaseTimer() {
  if (!gameOver)
  {
    if (timer > 0)
    {
      setTimeout(decreaseTimer, 1000);
      timer--;
      document.querySelector('#timer').innerHTML = timer;
    }

    if (timer === 0) {
      determineWinner({ player, enemy });
    }
  }
}

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

function getWinnerText({ player, enemy }) {
  if (player.health === enemy.health) return "Tie";
  if (player.health > enemy.health) return "Player 1 Wins";
  return "Player 2 Wins";
}

function determineWinner({ player, enemy })
{
  if (winnerDisplayed) return;

  winnerDisplayed = true;

  const displayText = document.querySelector('#displayText');
  displayText.style.display = 'flex';
  displayText.innerHTML = getWinnerText({ player, enemy });

  gameOver = true;
}

// element 
const
  game = document.querySelector('.game'),
  canvas = document.querySelector('#canvas'),
  canvasBg = document.querySelector('#bg'),
  ctx = canvas.getContext('2d'),
  ctxBg = canvasBg.getContext('2d'),
  scoreElement = document.querySelector('.score p'),
  pauseBtn = document.querySelector('.pause');

game.style.width = (canvasBg.width = canvas.width = 384) + "px";
game.style.height = (canvasBg.height = canvas.height = 737) + "px";

// variables
let
  gamePause = false,
  gameEnd = false,
  mainGameSpeed = 0,
  gameSpeed = 0,
  score = 0,
  gravity = .8,
  ballMoveSpeed = 3,
  floorSpace = 70,
  floorSpaceBetween = 100,
  floorMoveSpeed = 1,
  floorCount = canvas.height / floorSpaceBetween,
  floorColor = "crimson";
const
  HELF_OF_SCREEN = innerWidth * .5,
  ballStartFloor = 3,
  bg = {};
bg.squareSize = canvas.width / 10;
bg.columns = canvas.width / bg.squareSize;
bg.rows = canvas.height / bg.squareSize;

// create local Storage key
if (!localStorage.getItem("fall-ball-best-score")) localStorage.setItem("fall-ball-best-score", "0");

// classes
class Ball {
  constructor(x, y, radius = 20, color = 'red') {
    this.color = color;
    this.radius = radius;
    this.lw = this.radius / 5;
    this.x = x;
    this.y = y;
    this.frictin = 0.94;
    this.velocity = {
      x: 0,
      y: 0
    };
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.strokeColor = '#3002';
    ctx.lineWidth = this.lw;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();
  }

  update() {
    this.draw();

    this.velocity.y += gravity;
    this.velocity.x *= this.frictin;
    this.velocity.y *= this.frictin;

    this.x += this.velocity.x;
    this.y += this.velocity.y;

    this.y = Math.min(this.y, canvas.height - this.radius);

    this.x = Math.min(Math.max(this.x, this.radius), canvas.width - this.radius);
  }

  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
  }
}

class Floor {
  constructor(space = 50, margin = 100) {
    this.passed = true;
    this.space = space;
    this.margin = margin;
    this.height = 20;
    this.x = 0;
    this.y = 0;
    this.gradient = undefined;
    this.pieces = [
      { x: 0, y: 0, width: 0, height: this.height },
      { x: 0, y: 0, width: 0, height: this.height }
    ];
    this.velocity = {
      x: 0,
      y: 0
    }
    this.putInEnd(floors);
  }

  draw() {
    this.pieces.forEach((piece) => {
      ctx.fillStyle = this.gradient;
      ctx.fillRect(piece.x, piece.y, piece.width, piece.height);
    });
  }

  update() {
    this.draw();

    this.y += this.velocity.y;
    this.pieces.forEach((piece) => piece.y = this.y);

    this.gradient = ctx.createLinearGradient(0, this.y, 0, this.y + this.height);
    this.gradient.addColorStop(0, floorColor);
    this.gradient.addColorStop(0.3, floorColor);
    this.gradient.addColorStop(0.5, "snow");
    this.gradient.addColorStop(0.7, floorColor);
    this.gradient.addColorStop(1, floorColor);
  }

  putInEnd(array) {
    let lastFloor = { y: 0, height: 0 };
    array.forEach(f => { if (f.y > lastFloor.y) lastFloor = f });
    this.passed = false;
    this.y = lastFloor.y + lastFloor.height + this.margin;
    this.x = Math.floor(Math.random() * (canvas.width - this.space * 2)) + this.space;
    this.pieces[0].width = this.x - this.space * .5;
    this.pieces[1].x = this.x + this.space * .5;
    this.pieces[1].width = canvas.width - (this.x + this.space * .5);
  }
}

// objects and arrays
let
  mouse = {
    x: undefined,
    y: undefined,
    pressed: false
  },
  ball,
  floors = [];

// functions
function frame() {
  // clear old frame
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // update floors
  floors.forEach((floor) => {
    // update floors velocity
    floor.velocity.y = -(floorMoveSpeed + gameSpeed);

    floor.update();

    // check floor out from canvas
    if (floor.y + floor.height <= 0) {
      floor.putInEnd(floors);
    } else if (!(floor.passed || ball.y <= floor.y + floor.height)) {
      // increase score
      score++;
      updateScore();

      floor.passed = true;
    } else if (!(floor.passed || ball.y + ball.radius < floor.y)) {
      // check if ball on this floor
      for (const piece of floor.pieces) {
        if (!(ball.x + ball.radius < piece.x ||
          ball.x - ball.radius > piece.x + piece.width ||
          ball.y + ball.radius < piece.y ||
          ball.y - ball.radius > piece.y + piece.height)) {

          if (ball.y - ball.radius <= piece.y) {
            // stop ball from moving
            ball.velocity.y = 0;
            ball.y = Math.min(ball.y, piece.y - ball.radius);
            break;
          }
        }
      }
    }

  });

  // update ball
  ball.update();

  // check if game end
  if (ball.y + ball.radius < 0) gameOver();

  // move the ball
  if (mouse.pressed) {
    const speed = ballMoveSpeed + gameSpeed;
    ball.velocity.x = mouse.x > HELF_OF_SCREEN ? speed : -speed;
  }

  // check if game end or pause
  if (gamePause || gameEnd) {
    ctx.fillStyle = "#0009";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "snow";
    ctx.textAlign = "center";
    ctx.baseLine = "middle";
    ctx.font = "30px monospace";
    if (gameEnd) {
      ctx.fillText(`Score ${score}`, canvas.width * .5, canvas.height * .35);
      ctx.fillText(`BestScore ${localStorage.getItem("fall-ball-best-score")}`, canvas.width * .5, canvas.height * .4);
      ctx.fillText("GameOver", canvas.width * .5, canvas.height * .5);
    } else {
      ctx.fillText("Pause", canvas.width * .5, canvas.height * .5);
    }
  }
  else { requestAnimationFrame(frame); }
}

function drawBackground(ctx, lightColor, darkColor) {
  ctx.fillStyle = lightColor;
  ctx.fillRect(0, 0, canvasBg.width, canvasBg.height);

  // Draw checkerboard pattern
  ctx.fillStyle = darkColor;
  for (let y = 0; y < bg.rows; y++) {
    for (let x = 0; x < bg.columns; x++) {
      if ((y + x) % 2 == 0) {
        ctx.roundRect(x * bg.squareSize, y * bg.squareSize, bg.squareSize, bg.squareSize, 6);
      }
    }
  }
  ctx.fill();
}

function theme(num) {
  console.log(num);
  switch (num) {
    case 2:
      floorColor = "darkorange";
      drawBackground(ctxBg, "hsl(45, 95%, 55%)", "hsla(0, 0%, 0%, 0.07)");
      break;
    case 3:
      floorColor = "brown";
      drawBackground(ctxBg, "hsl(130 , 95%, 40%)", "hsla(0, 0%, 0%, 0.07)");
      break;
    case 4:
      floorColor = "gold";
      drawBackground(ctxBg, "hsl(345, 95%, 55%)", "hsla(0, 0%, 0%, 0.07)");
      break;
    case 5:
      floorColor = "black";
      drawBackground(ctxBg, "hsl(230, 20%, 95%)", "hsla(0, 0%, 0%, 0.07)");
      break;
    case 6:
      floorColor = "deepskyblue";
      drawBackground(ctxBg, "hsl(270, 95%, 65%)", "hsla(0, 0%, 0%, 0.07)");
      break;
    case 7:
      floorColor = "deeppink";
      drawBackground(ctxBg, "hsl(220, 95%, 65%)", "hsla(0, 0%, 0%, 0.07)");
      break;

    default:
      floorColor = "crimson";
      drawBackground(ctxBg, "hsl(190, 95%, 55%)", "hsla(0, 0%, 0%, 0.07)");
  }
}

function handleDown(event) {
  try {
    const e = event.touches[0] || event;
    mouse.pressed = true;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  } catch (e) {}
}
function handleMove(event) {
  try {
    const e = event.touches[0] || event;
    if (mouse.pressed) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }
  } catch (e) {}
}
function handleUp() {
  mouse.pressed = false;
}

function handleKeyDown(event) {
  switch (event.key) {
    case 'ArrowLeft':
      mouse.pressed = true;
      mouse.x = HELF_OF_SCREEN - 1;
      break;
    case 'ArrowRight':
      mouse.pressed = true;
      mouse.x = HELF_OF_SCREEN + 1;
      break;
    case 'a':
      mouse.pressed = true;
      mouse.x = HELF_OF_SCREEN - 1;
      break;
    case 'd':
      mouse.pressed = true;
      mouse.x = HELF_OF_SCREEN + 1;
      break;
  }
}
function handleKeyUp(event) {
  switch (event.key) {
    case 'ArrowLeft':
      mouse.pressed = false;
      break;
    case 'ArrowRight':
      mouse.pressed = false;
      break;
    case 'a':
      mouse.pressed = false;
      break;
    case 'd':
      mouse.pressed = false;
      break;
  }
}

function newGame() {
  ball = new Ball(canvas.width * .5, ballStartFloor * floorSpaceBetween - 30, 14, 'orangered');
  floors.length = 0;
  score = 0;
  gameSpeed = 0;
  updateScore();

  for (let i = 0; i < floorCount; i++) {
    const newFloor = new Floor(Math.floor(floorSpace, floorSpaceBetween));
    if (i + 1 < ballStartFloor) newFloor.passed = true;
    floors.push(newFloor);
  }

  theme(1);
  frame();
}

function pause(condition) {
  gamePause = condition;
  if (!(condition && gameEnd)) {
    frame();
  }
}

function gameOver() {
  gameEnd = true;
  updateScore();
}

function updateScore() {
  if (score > parseInt(localStorage.getItem("fall-ball-best-score"))) {
    localStorage.setItem("fall-ball-best-score", score.toString());
  }

  scoreElement.textContent = score.toString();

  let OGS = Math.floor(gameSpeed);
  gameSpeed = score / 30 + mainGameSpeed;
  if (Math.floor(gameSpeed) > OGS) {
    theme(Math.floor(gameSpeed - mainGameSpeed + 1));
  }
}

// events
addEventListener("touchstart", handleDown);
canvas.addEventListener("touchmove", handleMove);
addEventListener("touchend", handleUp);
addEventListener("mousedown", handleDown);
canvas.addEventListener("mousemove", handleMove);
addEventListener("mouseup", handleUp);
addEventListener("keydown", handleKeyDown);
addEventListener("keyup", handleKeyUp);
pauseBtn.addEventListener("click", (e) => {
  if (!gameEnd) {
    e.target.classList.toggle("p");
    pause(!gamePause);
  } else {
    e.target.classList.add("p");
    pause(false);
    gameEnd = false;
    newGame();
  }
});

// start
newGame();

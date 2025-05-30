const BUILDING_WIDTH = 25;
const BUILDING_STEP = 10;
const PLANE_WIDTH = 50;
const PLANE_HEIGHT = 25;
const PLANE_STEP = 20;
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 600;

let currentLevel = 0;
let animationStep = 0.5;
let sparsity = 0.7;
let score = 0;
let nLives = 3;

class Building {
  constructor(x, y, width, height, color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height; 
    this.color = color;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    // check if the bomb is dropping and if it is, check if it is hitting the building
    if (bomb.isDropping && bomb.x >= this.x && bomb.x < this.x + this.width && bomb.y >= this.y && bomb.y <= CANVAS_HEIGHT) {
      ctx.fillStyle = 'red';
      this.y += BUILDING_STEP;
      this.height -= BUILDING_STEP;
      score += BUILDING_STEP;
    }

    // check if the plane is hitting the building
    if (!plane.isDone && plane.x + PLANE_WIDTH >= this.x && plane.x < this.x + this.width && plane.y + PLANE_HEIGHT >= this.y) {
      console.log('x', plane.x, this.x, this.x + this.width);
      console.log('y', plane.y, this.y, CANVAS_HEIGHT);
      plane.isDone = true;
      if (this.y < CANVAS_HEIGHT) {
        plane.dispatchEvent(new Event('fail'));
      } else {
        plane.dispatchEvent(new Event('success'));
      }
    }

    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

class Plane extends EventTarget{
  constructor(x, y) {
    super();
    this.x = x;
    this.y = y;
    this.width = PLANE_WIDTH;
    this.height = PLANE_HEIGHT;
    this.color = '#aaa';
    this.isDone = false;
  }

  move() {
    if (!this.isDone) {
      this.x += animationStep;
      if (this.x > CANVAS_WIDTH) {
        this.x = 0;
        this.y += PLANE_STEP;
      }
    }
  }

  down() {
    if (this.y + PLANE_HEIGHT < CANVAS_HEIGHT) {
      this.y += BUILDING_STEP;
      this.x -= PLANE_STEP/2;
    } else {
      this.isDone = true;
      console.log('success!');
      this.dispatchEvent(new Event('success'));
    }
    console.log(this.y);
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x, this.y + this.height);
    ctx.lineTo(this.x + this.width, this.y + this.height);
    ctx.lineTo(this.x + this.width - 15, this.y + this.height - 10);
    ctx.lineTo(this.x + 10, this.y + this.height - 10);
    ctx.closePath();
    ctx.fill();
  }
}

class Bomb {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 5;
    this.color = 'red';
    this.isDropping = false;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x + 12, this.y + 12, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  move() {
    if (this.isDropping) {
      this.y += animationStep;
      if (this.y > CANVAS_HEIGHT) {
        this.isDropping = false;
      }
    }
  }

  drop(x, y) {
    // calculate the center point of the buildings
    let centerX = Math.floor(x / BUILDING_WIDTH) * BUILDING_WIDTH + BUILDING_WIDTH;
    if (centerX >= CANVAS_WIDTH) {
      centerX = 0;
    }
    const centerY = y + 25;
    console.log(centerX, centerY);
    this.x = centerX;
    this.y = centerY;
    this.isDropping = true;
  }
}

function increaseLevel() {
  currentLevel++;
  let sparseMap = [0, 0.8, 0.5]
  sparsity = sparseMap[currentLevel % 3];

  if (currentLevel % 3 == 1)
    animationStep++;

  console.log('level', currentLevel, sparsity, animationStep);
}

function getRandomColor() {
  return '#' + Math.floor(Math.random()*16777215).toString(16);
}

function setValueinDOM(classElem, val) {
  const elem = document.getElementsByClassName(classElem)[0];
  if (elem) {
    elem.innerHTML = val;
  }
}

function setLives() {
  const elem = document.getElementsByClassName('lives')[0];
  if (elem) {
    let html = '';
    for (let i = 0; i < nLives; i++) {
      html += '<i class="fa fa-plane"></i>';
    }
    elem.innerHTML = html;
  }
}

function redrawScore() {
  setValueinDOM('score', score);
  setValueinDOM('level', currentLevel);
  setLives();
}

let prevTime = 0;

function redraw(ctx, time) {
  if (prevTime == 0) {
    prevTime = time;
  }
  const deltaTime = time - prevTime;
  prevTime = time;
  //console.log('deltaTime', deltaTime, ' fps:', 1000 / deltaTime);
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  for (let i = 0; i<40; i++) {
    buildings[i].draw(ctx);
  }

  plane.draw(ctx);
  plane.move()

  if (bomb.isDropping) {
    bomb.draw(ctx);
    bomb.move();
  } else {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 10, 10);
  }

  ctx.beginPath();
  ctx.moveTo(0, CANVAS_HEIGHT);
  ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.strokeStyle = '#888';
  ctx.stroke();

  redrawScore();

  setTimeout(() => {
    redraw(ctx);
  }, 1000 / 200);

  //requestAnimationFrame((time) => redraw(ctx, time));
}

let buildings = [];
let plane = null;
let bomb = null;

function createNewPlane() {
  plane = new Plane(0, 45);
  plane.addEventListener('success', () => {
    window.setTimeout(() => {
      init();
    }, 1000);
  });

  plane.addEventListener('fail', () => {
    console.log('event fail!');
    nLives--;
    setLives();
    if (nLives > 0) {
      window.setTimeout(() => {
        createNewPlane();
      }, 1000);
    } else {
      console.log('game over!');
    }
  });
}

function init() {
  increaseLevel();
  console.log('init', currentLevel);
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  buildings = [];

  for (let i = 0; i < 40; i++) {

    const height =  (Math.random() > sparsity) ? Math.floor((Math.random() * 19 + 2) * BUILDING_STEP) : 0;
    //const height = 0;
    const x = i * BUILDING_WIDTH;
    const y = CANVAS_HEIGHT - height;
    const width = BUILDING_WIDTH;
    const color = getRandomColor();
    buildings.push(new Building(x, y, width, height, color));
  }

  bomb = new Bomb(0, 0);
  createNewPlane();
  return ctx;

}

window.addEventListener('keydown', (e) => {
  if (e.key === ' ' && !bomb.isDropping) {
    bomb.drop(plane.x, plane.y);
  } else if ((e.key === 'D' || e.key === 'd') && !plane.isDone) {
    plane.down();
  }

  if (e.key == 'l') {
    window.setTimeout(() => {
      init();
    }, 1000);
  }
});

let ctx = init();
redraw(ctx);

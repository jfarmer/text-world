let process = require('process');
let fs = require('fs').promises;
let termkit = require('terminal-kit');

async function loadMap(mapFile) {
  console.log(mapFile);
  let map = await fs.readFile(mapFile, 'utf8');

  return map.trim().split('\n').map(s => Array.from(s));
}

function color(term, text, dist) {
  let shade = Math.floor(0xFF * (1 - dist));
  return term.colorRgb.str(shade, shade, shade, text);
}

function isRayOutOfBounds(rayX, rayY, mapWidth, mapHeight) {
  return rayX < 0 || rayX >= mapWidth || rayY < 0 || rayY >= mapHeight;
}

function mapIsWall(map, mapWidth, x, y) {
  return map[x][y] === '#';
}

function renderScreen(term, screen) {
  term.moveTo(1, 1);
  term(makeScreen(screen));
}

async function main(mapFile) {
  let term = termkit.terminal;

  term.fullscreen();
  term.hideCursor();
  term.grabInput(true);

  let screenWidth = term.width;
  let screenHeight = term.height;
  let playerX = 16.0;
  let playerY = 16.0;
  let playerAngle = 0.0;
  let fovAngle = Math.PI / 4;
  let renderDepth = 24.0;

  let mapHeight = 32;
  let mapWidth = 32;

  if (!mapFile) {
    console.error('Error: No map file supplied');
    process.exit(1);
  }

  term.on('key', (name, matches, data) => {
    if (name === 'CTRL_C') {
      term.processExit();
    } else if (name === 'a') {
      playerAngle -= 0.05;
    } else if (name === 'd') {
      playerAngle += 0.05;
    } else if (name === 'w') {
      playerX += Math.sin(playerAngle) * 0.25;
      playerY += Math.cos(playerAngle) * 0.25;
    } else if (name === 's') {
      playerX -= Math.sin(playerAngle) * 0.25;
      playerY -= Math.cos(playerAngle) * 0.25;
    }
  });

  let map = await loadMap(mapFile);

  let screen = Array(screenHeight).fill(undefined).map(() => Array(screenHeight).fill('%'));

  setInterval(() => {
    for (let x = 0; x < screenWidth; x++) {
      let rayAngle = (playerAngle - fovAngle / 2.0) + (x / screenWidth) * fovAngle;
      let distanceToWall = 0.0;
      let hasHitWall = false;
      let isBoundary = false;
      let eyeX = Math.sin(rayAngle);
      let eyeY = Math.cos(rayAngle);
      let stepSize = 0.005;

      while (!hasHitWall && distanceToWall < renderDepth) {
        distanceToWall += stepSize;

        let testX = Math.floor(playerX + eyeX * distanceToWall);
        let testY = Math.floor(playerY + eyeY * distanceToWall);

        if (isRayOutOfBounds(testX, testY, mapWidth, mapHeight)) {
          hasHitWall = true;
          distanceToWall = renderDepth;
        } else if (mapIsWall(map, mapWidth, testX, testY)) {
          hasHitWall = true;
          distanceToWall *= Math.cos(playerAngle - rayAngle);

          let corners = [];

          for (let tx = 0; tx < 2; tx++) {
            for (let ty = 0; ty < 2; ty++) {
              let vy = testY + ty - playerY;
              let vx = testX + tx - playerX;
              let d = Math.sqrt(vx ** 2 + vy ** 2);
              let dot = (eyeX * vx / d) + (eyeY * vy / d);

              corners.push([d, dot]);
            }
          }

          corners.sort(([x, _a], [y, _b]) => x - y);

          let cornerBound = 0.005;
          if (Math.acos(corners[0][1]) < cornerBound || Math.acos(corners[1][1]) < cornerBound || Math.acos(corners[2][1]) < cornerBound) {
            isBoundary = true;
          }
        }
      }

      let numCeilingTiles = Math.floor(screenHeight / 2 - screenHeight / distanceToWall);
      let numFloorTiles = screenHeight - numCeilingTiles;

      for (let y = 0; y < screenHeight; y++) {
        if (y < numCeilingTiles) {
          screen[y][x] = ' ';
        } else if (y <= numFloorTiles) {
          let wallTile;

          // wallTile = color(term, '█', dist);
          if (isBoundary) {
            wallTile = '·';
          } else if (distanceToWall <= renderDepth / 4) {
            wallTile = '█'; // color(term, '█', dist);
          } else if (distanceToWall < renderDepth / 3) {
            wallTile = '▓'; // '▓';
          } else if (distanceToWall <= renderDepth / 2) {
            wallTile = '▒'; // '▒';
          } else if (distanceToWall <= renderDepth) {
            wallTile = '░'; // '░';
          } else {
            wallTile = ' ';
          }

          wallTile = color(term, wallTile, distanceToWall / renderDepth);

          screen[y][x] = wallTile;
        } else {
          let floorTile;
          let floorDist = 1.0 - ((y - screenHeight / 2) / (screenHeight / 2));

          let shade = Math.floor(0xFF * (1 - floorDist ** 0.35));
          if (floorDist < 0.25) {
            floorTile = '·';
          } else if (floorDist < 0.5) {
            floorTile = '·';
          } else if (floorDist < 0.75) {
            floorTile = '·';
          } else if (floorDist < 0.9) {
            floorTile = '·';
          } else {
            floorTile = ' ';
          }

          screen[y][x] = term.colorRgb.str(0x00, shade, 0x00, floorTile);
        }
      }
    }

    renderScreen(term, screen);
  }, 50);
}

function makeScreen(screen) {
  return screen.map(s => s.join('')).join('\n');
}

let userArgs = process.argv.slice(2);
main(...userArgs);

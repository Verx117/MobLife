import { TileTypes, type TileType } from "../assets/tileType";

export interface Tile {
  type: TileType;
  fixedEntity?: string;
  mobileEntities?: string[];
}

function createEmptyMap(height: number, width: number): Tile[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({
      type: TileTypes.Plains,
    }))
  );
}

function inBounds(height: number, width: number, y: number, x: number) {
  return y >= 0 && y < height && x >= 0 && x < width;
}

function neighbors(y: number, x: number) {
  return [
    [y - 1, x],
    [y + 1, x],
    [y, x - 1],
    [y, x + 1],
  ];
}

/**
 * Genera un blocco di mare compatto (almeno minSize tile).
 */
function generateSea(
  map: Tile[][],
  height: number,
  width: number,
  minSize: number
): { tiles: [number, number][] } {
  const startY = Math.floor(Math.random() * height);
  const startX = Math.floor(Math.random() * width);

  const seaTiles: [number, number][] = [];
  const frontier: [number, number][] = [[startY, startX]];

  while (seaTiles.length < minSize && frontier.length > 0) {
    const [y, x] = frontier.pop()!;
    if (!inBounds(height, width, y, x)) continue;
    if (map[y][x].type === TileTypes.Sea) continue;

    map[y][x].type = TileTypes.Sea;
    seaTiles.push([y, x]);

    neighbors(y, x).forEach(([ny, nx]) => {
      if (
        inBounds(height, width, ny, nx) &&
        map[ny][nx].type === TileTypes.Plains
      ) {
        if (Math.random() < 0.75) frontier.push([ny, nx]); // espansione compatta
      }
    });
  }

  return { tiles: seaTiles };
}

/**
 * Genera un fiume che parte da una montagna e finisce in un mare.
 * Ogni montagna può generare al massimo un fiume.
 */
function generateRiver(
  map: Tile[][],
  height: number,
  width: number,
  seaTiles: [number, number][],
  usedMountains: Set<string>
) {
  // scegli una montagna che non ha ancora generato un fiume
  const mountains: [number, number][] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (
        map[y][x].type === TileTypes.Mountains &&
        !usedMountains.has(`${y},${x}`)
      ) {
        mountains.push([y, x]);
      }
    }
  }
  if (mountains.length === 0 || seaTiles.length === 0) return;

  const [startY, startX] =
    mountains[Math.floor(Math.random() * mountains.length)];

  usedMountains.add(`${startY},${startX}`);

  let y = startY;
  let x = startX;

  // percorso casuale verso il mare
  for (let steps = 0; steps < height * width; steps++) {
    if (map[y][x].type === TileTypes.Sea) break;
    map[y][x].type = TileTypes.River;

    // scegli direzione verso un mare
    const [seaY, seaX] = seaTiles[Math.floor(Math.random() * seaTiles.length)];
    const dy = Math.sign(seaY - y);
    const dx = Math.sign(seaX - x);

    const options: [number, number][] = [];
    if (dy !== 0) options.push([y + dy, x]);
    if (dx !== 0) options.push([y, x + dx]);
    // aggiungi piccola deviazione
    if (Math.random() < 0.2)
      options.push([y + (Math.random() < 0.5 ? 1 : -1), x]);
    if (Math.random() < 0.2)
      options.push([y, x + (Math.random() < 0.5 ? 1 : -1)]);

    let moved = false;
    for (const [ny, nx] of options) {
      if (inBounds(height, width, ny, nx)) {
        const type = map[ny][nx].type;
        if (
          type === TileTypes.Plains ||
          type === TileTypes.Hills ||
          type === TileTypes.Sea
        ) {
          y = ny;
          x = nx;
          moved = true;
          break;
        }
      }
    }
    if (!moved) break;
  }
}

function generateMountainsAndHills(
  map: Tile[][],
  height: number,
  width: number
) {
  const totalTiles = height * width;
  const maxMountains = Math.floor(totalTiles * 0.2); // max 20% montagne
  let mountainCount = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (Math.random() < 0.02 && mountainCount < maxMountains) {
        // trovato un seed di montagna
        createMountainCluster(map, y, x, height, width);
        // aggiorna conteggio montagne
        mountainCount = map
          .flat()
          .filter((t) => t.type === TileTypes.Mountains).length;
      }
    }
  }
}

function createMountainCluster(
  map: Tile[][],
  y: number,
  x: number,
  height: number,
  width: number
) {
  const clusterSize = 5; // minimo 5 montagne
  const hillSize = 10; // minimo 10 colline

  let placedMountains = 0;
  let placedHills = 0;

  const queue: [number, number][] = [[y, x]];

  while (
    queue.length > 0 &&
    (placedMountains < clusterSize || placedHills < hillSize)
  ) {
    const [cy, cx] = queue.shift()!;
    if (!inBounds(height, width, cy, cx)) continue;

    const tile = map[cy][cx];
    if (tile.type !== TileTypes.Plains) continue; // non sovrascrive mare/fiume

    if (placedMountains < clusterSize) {
      tile.type = TileTypes.Mountains;
      placedMountains++;
    } else if (placedHills < hillSize) {
      tile.type = TileTypes.Hills;
      placedHills++;
    }

    // espandi nei vicini
    const nbs = neighbors(cy, cx);
    for (const [ny, nx] of nbs) {
      if (inBounds(height, width, ny, nx) && Math.random() < 0.6) {
        queue.push([ny, nx]);
      }
    }
  }
}

export function generateMap(height: number, width: number): Tile[][] {
  const map = createEmptyMap(height, width);

  // 1. Genera montagne e colline con logica "cluster"
  generateMountainsAndHills(map, height, width);

  // 2. Genera mari (almeno 1/5 della mappa)
  const totalTiles = height * width;
  const minSeaSize = Math.floor(totalTiles / 5);
  const maxSeas = Math.max(1, Math.floor(totalTiles / 600)); // proporzionale
  const seaAreas: [number, number][][] = [];

  for (let i = 0; i < maxSeas; i++) {
    const { tiles } = generateSea(map, height, width, minSeaSize);
    seaAreas.push(tiles);
  }

  // 3. Genera fiumi: ogni mare ha almeno 1 fiume +1 ogni 100 tile
  const usedMountains = new Set<string>();
  for (const sea of seaAreas) {
    const neededRivers = 1 + Math.floor(sea.length / 100);
    for (let i = 0; i < neededRivers; i++) {
      generateRiver(map, height, width, sea, usedMountains);
    }
  }

  return map;
}

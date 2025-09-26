import { TileTypes, type TileType, type FixedEntity } from "../assets/tileType";

export interface Tile {
  type: TileType;
  fixedEntityId?: string;
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

// GENERAZIONE MARE

// seed solo su plains/hills
function pickSeaSeed(map: Tile[][], height: number, width: number) {
  const tries = 200;
  for (let i = 0; i < tries; i++) {
    const y = Math.floor(Math.random() * height);
    const x = Math.floor(Math.random() * width);
    const t = map[y][x].type;
    if (t === TileTypes.Plains || t === TileTypes.Hills)
      return [y, x] as [number, number];
  }
  return [
    Math.floor(Math.random() * height),
    Math.floor(Math.random() * width),
  ] as [number, number];
}

function generateSea(
  map: Tile[][],
  height: number,
  width: number,
  minSize: number
): { tiles: [number, number][] } {
  const [startY, startX] = pickSeaSeed(map, height, width);

  const seaTiles: [number, number][] = [];
  const frontier: [number, number][] = [[startY, startX]];

  while (seaTiles.length < minSize && frontier.length > 0) {
    const [y, x] = frontier.pop()!;
    if (!inBounds(height, width, y, x)) continue;
    if (map[y][x].type === TileTypes.Sea) continue;
    if (map[y][x].type === TileTypes.Mountains) continue;

    map[y][x].type = TileTypes.Sea;
    seaTiles.push([y, x]);

    for (const [ny, nx] of neighbors(y, x)) {
      if (!inBounds(height, width, ny, nx)) continue;
      const t = map[ny][nx].type;
      if (t === TileTypes.Plains && Math.random() < 0.9)
        frontier.push([ny, nx]);
      else if (t === TileTypes.Hills && Math.random() < 0.4)
        frontier.push([ny, nx]);
    }
  }

  return { tiles: seaTiles };
}

function dissolveSmallSeaComponents(
  map: Tile[][],
  height: number,
  width: number,
  minSize: number
) {
  const visited = new Set<string>();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (map[y][x].type !== TileTypes.Sea) continue;
      const key = `${y},${x}`;
      if (visited.has(key)) continue;

      const comp: [number, number][] = [];
      const q: [number, number][] = [[y, x]];
      visited.add(key);

      while (q.length) {
        const [cy, cx] = q.shift()!;
        comp.push([cy, cx]);
        for (const [ny, nx] of neighbors(cy, cx)) {
          const k = `${ny},${nx}`;
          if (!inBounds(height, width, ny, nx)) continue;
          if (visited.has(k)) continue;
          if (map[ny][nx].type !== TileTypes.Sea) continue;
          visited.add(k);
          q.push([ny, nx]);
        }
      }

      if (comp.length < minSize) {
        for (const [sy, sx] of comp) {
          map[sy][sx].type = TileTypes.Plains;
        }
      }
    }
  }
}

// GENERAZIONE FIUMI

function mountainEdges(
  map: Tile[][],
  height: number,
  width: number
): [number, number][] {
  const edges: [number, number][] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (map[y][x].type !== TileTypes.Mountains) continue;
      const hasNonMountainNeighbor = neighbors(y, x).some(
        ([ny, nx]) =>
          inBounds(height, width, ny, nx) &&
          map[ny][nx].type !== TileTypes.Mountains
      );
      if (hasNonMountainNeighbor) edges.push([y, x]);
    }
  }
  return edges;
}

function bfsPathToTarget(
  map: Tile[][],
  height: number,
  width: number,
  src: [number, number],
  targetSet: Set<string>,
  allowed: Set<TileType>
): [number, number][] | null {
  const q: [number, number][] = [src];
  const prev = new Map<string, string | null>();
  prev.set(`${src[0]},${src[1]}`, null);

  while (q.length) {
    const [y, x] = q.shift()!;
    const key = `${y},${x}`;
    if (targetSet.has(key)) {
      const path: [number, number][] = [];
      let cur: string | null = key;
      while (cur) {
        const [cy, cx] = cur.split(",").map(Number) as [number, number];
        path.push([cy, cx]);
        cur = prev.get(cur) ?? null;
      }
      path.reverse();
      return path;
    }

    for (const [ny, nx] of neighbors(y, x)) {
      if (!inBounds(height, width, ny, nx)) continue;
      const nkey = `${ny},${nx}`;
      if (prev.has(nkey)) continue;
      if (!allowed.has(map[ny][nx].type)) continue;
      prev.set(nkey, key);
      q.push([ny, nx]);
    }
  }
  return null;
}

function generateRiver(
  map: Tile[][],
  height: number,
  width: number,
  seaTiles: [number, number][],
  usedMountains: Set<string>
) {
  const seaSet = new Set<string>(seaTiles.map(([y, x]) => `${y},${x}`));
  const edges = mountainEdges(map, height, width).filter(
    ([y, x]) => !usedMountains.has(`${y},${x}`)
  );
  if (edges.length === 0) return;

  const [sy, sx] = edges[Math.floor(Math.random() * edges.length)];
  usedMountains.add(`${sy},${sx}`);

  const allowed = new Set<TileType>([
    TileTypes.Plains,
    TileTypes.Hills,
    TileTypes.River,
    TileTypes.Sea,
  ]);

  const path = bfsPathToTarget(map, height, width, [sy, sx], seaSet, allowed);
  if (!path) return;

  for (const [y, x] of path) {
    if (map[y][x].type === TileTypes.Sea) break;
    map[y][x].type = TileTypes.River;
  }
}

// GENERAZIONE MONTAGNE & COLLINE
function generateMountainsAndHills(
  map: Tile[][],
  height: number,
  width: number
) {
  const totalTiles = height * width;
  const maxMountains = Math.floor(totalTiles * 0.2);
  let mountainCount = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (Math.random() < 0.02 && mountainCount < maxMountains) {
        createMountainCluster(map, y, x, height, width);
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
  const clusterSize = 5;
  const hillSize = 10;

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
    if (tile.type !== TileTypes.Plains) continue;

    if (placedMountains < clusterSize) {
      tile.type = TileTypes.Mountains;
      placedMountains++;
    } else if (placedHills < hillSize) {
      tile.type = TileTypes.Hills;
      placedHills++;
    }

    for (const [ny, nx] of neighbors(cy, cx)) {
      if (inBounds(height, width, ny, nx) && Math.random() < 0.6) {
        queue.push([ny, nx]);
      }
    }
  }
}

// FORESTE

function generateForests(map: Tile[][], height: number, width: number) {
  const totalTiles = height * width;
  const targetForests = Math.floor(totalTiles * 0.1);
  let forestCount = 0;

  // crea lista di tutte le coordinate e mischiala
  const coords: [number, number][] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      coords.push([y, x]);
    }
  }
  coords.sort(() => Math.random() - 0.5);

  for (const [y, x] of coords) {
    if (forestCount >= targetForests) break;

    if (
      map[y][x].type === TileTypes.Plains ||
      map[y][x].type === TileTypes.Hills
    ) {
      const nbs = neighbors(y, x);
      const hasForestOrRiver = nbs.some(
        ([ny, nx]) =>
          inBounds(height, width, ny, nx) &&
          (map[ny][nx].type === TileTypes.Forest ||
            map[ny][nx].type === TileTypes.River)
      );

      if (hasForestOrRiver || Math.random() < 0.02) {
        createForestCluster(map, y, x, height, width);
        forestCount = map
          .flat()
          .filter((t) => t.type === TileTypes.Forest).length;
      }
    }
  }
}

function createForestCluster(
  map: Tile[][],
  y: number,
  x: number,
  height: number,
  width: number
) {
  const clusterSize = 10 + Math.floor(Math.random() * 15);
  const frontier: [number, number][] = [[y, x]];
  let placed = 0;

  while (frontier.length > 0 && placed < clusterSize) {
    const [cy, cx] = frontier.pop()!;
    if (!inBounds(height, width, cy, cx)) continue;

    const tile = map[cy][cx];
    if (tile.type !== TileTypes.Plains && tile.type !== TileTypes.Hills)
      continue;

    tile.type = TileTypes.Forest;
    placed++;

    neighbors(cy, cx).forEach(([ny, nx]) => {
      if (
        inBounds(height, width, ny, nx) &&
        (map[ny][nx].type === TileTypes.Plains ||
          map[ny][nx].type === TileTypes.Hills)
      ) {
        if (Math.random() < 0.5) frontier.push([ny, nx]);
      }
    });
  }
}

// DESERTI

function generateDeserts(map: Tile[][], height: number, width: number) {
  const totalTiles = height * width;
  const targetDeserts = Math.floor(totalTiles * 1);
  let desertCount = 0;

  function farFromRivers(y: number, x: number): boolean {
    const radius = 10;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const ny = y + dy;
        const nx = x + dx;
        if (inBounds(height, width, ny, nx)) {
          if (map[ny][nx].type === TileTypes.River) return false;
        }
      }
    }
    return true;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (
        desertCount < targetDeserts &&
        map[y][x].type === TileTypes.Plains &&
        farFromRivers(y, x) &&
        Math.random() < 0.01
      ) {
        createDesertCluster(map, y, x, height, width);
        desertCount = map
          .flat()
          .filter((t) => t.type === TileTypes.Desert).length;
      }
    }
  }
}

function createDesertCluster(
  map: Tile[][],
  y: number,
  x: number,
  height: number,
  width: number
) {
  const clusterSize = 8 + Math.floor(Math.random() * 12);
  const frontier: [number, number][] = [[y, x]];
  let placed = 0;

  while (frontier.length > 0 && placed < clusterSize) {
    const [cy, cx] = frontier.pop()!;
    if (!inBounds(height, width, cy, cx)) continue;

    const tile = map[cy][cx];
    if (tile.type !== TileTypes.Plains) continue;

    tile.type = TileTypes.Desert;
    placed++;

    neighbors(cy, cx).forEach(([ny, nx]) => {
      if (inBounds(height, width, ny, nx)) {
        if (map[ny][nx].type === TileTypes.Plains && Math.random() < 0.5) {
          frontier.push([ny, nx]);
        }
      }
    });
  }
}

// POSIZIONAMENTO ENTITÀ FISSE

export function placeFixedEntities(
  map: Tile[][],
  config: { cities: number; towns: number; dungeons: number }
): Record<string, FixedEntity> {
  const height = map.length;
  const width = map[0].length;

  const entities: Record<string, FixedEntity> = {};

  function randomFreeTile(
    validFn: (tile: Tile, y: number, x: number) => boolean
  ): [number, number] | null {
    const tries = 200;
    for (let i = 0; i < tries; i++) {
      const y = Math.floor(Math.random() * height);
      const x = Math.floor(Math.random() * width);
      const tile = map[y][x];
      if (!tile.fixedEntityId && validFn(tile, y, x)) {
        return [y, x];
      }
    }
    return null;
  }

  // Città → non su montagne o mari
  for (let i = 0; i < config.cities; i++) {
    const pos = randomFreeTile(
      (tile) => tile.type !== TileTypes.Mountains && tile.type !== TileTypes.Sea
    );
    if (!pos) continue;
    const [y, x] = pos;
    const id = `city-${i}`;
    map[y][x].fixedEntityId = id;
    entities[id] = {
      id,
      type: "city",
      position: { y, x },
      name: `City ${i + 1}`,
      population: 500 + Math.floor(Math.random() * 2000),
      structures: ["market", "barracks"],
      resources: ["grain"],
    };
  }

  // Paesi → idem, ma più piccoli
  for (let i = 0; i < config.towns; i++) {
    const pos = randomFreeTile(
      (tile) => tile.type !== TileTypes.Mountains && tile.type !== TileTypes.Sea
    );
    if (!pos) continue;
    const [y, x] = pos;
    const id = `town-${i}`;
    map[y][x].fixedEntityId = id;
    entities[id] = {
      id,
      type: "town",
      position: { y, x },
      name: `Town ${i + 1}`,
      resources: ["wood"],
    };
  }

  // Dungeon → preferibilmente vicino a montagne
  for (let i = 0; i < config.dungeons; i++) {
    const pos = randomFreeTile((tile, y, x) => {
      if (tile.type === TileTypes.Mountains) return true;
      // vicino a montagne
      return [
        [y - 1, x],
        [y + 1, x],
        [y, x - 1],
        [y, x + 1],
      ].some(
        ([ny, nx]) =>
          ny >= 0 &&
          ny < height &&
          nx >= 0 &&
          nx < width &&
          map[ny][nx].type === TileTypes.Mountains
      );
    });
    if (!pos) continue;
    const [y, x] = pos;
    const id = `dungeon-${i}`;
    map[y][x].fixedEntityId = id;
    entities[id] = {
      id,
      type: "dungeon",
      position: { y, x },
      difficulty: 1 + Math.floor(Math.random() * 5),
      monsters: ["goblin", "skeleton"],
    };
  }

  return entities;
}

//GENERA MAPPA COMPLETA

export function generateMap(
  height: number,
  width: number,
  mode: "normal" | "islands" | "continents" = "normal"
): Tile[][] {
  const map = createEmptyMap(height, width);

  // Montagne + colline
  generateMountainsAndHills(map, height, width);

  // Mari
  const totalTiles = height * width;
  let minSeaSize = Math.floor(Math.pow(totalTiles, 0.75) / 5);
  let maxSeas = Math.max(1, Math.floor(totalTiles / 600));

  if (mode === "islands") {
    minSeaSize = Math.floor(Math.pow(totalTiles, 0.9) / 2);
    maxSeas = Math.max(2, Math.floor(totalTiles / 300));
  } else if (mode === "continents") {
    minSeaSize = Math.floor(Math.pow(totalTiles, 0.8) / 8);
    maxSeas = Math.max(1, Math.floor(totalTiles / 400));
  }

  const seaAreas: [number, number][][] = [];
  for (let i = 0; i < maxSeas; i++) {
    const { tiles } = generateSea(map, height, width, minSeaSize);
    seaAreas.push(tiles);
  }

  dissolveSmallSeaComponents(map, height, width, minSeaSize);

  // Fiumi
  const usedMountains = new Set<string>();
  for (const sea of seaAreas) {
    const neededRivers = 1 + Math.floor(sea.length / 100);
    for (let i = 0; i < neededRivers; i++) {
      generateRiver(map, height, width, sea, usedMountains);
    }
  }

  // Foreste
  generateForests(map, height, width);

  // Deserti
  generateDeserts(map, height, width);

  return map;
}

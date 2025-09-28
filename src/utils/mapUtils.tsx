import type { Tile } from "../utils/mapGenerator";

// Riceve la mappa, dimensioni, posizione iniziale, set di target, e opzionale set di tile bloccati
export function bfsPathToTarget(
  map: Tile[][],
  height: number,
  width: number,
  start: { y: number; x: number },
  targetSet: Set<string>, // "y,x" dei target
  walkableTiles: Set<string> // tipi di tile camminabili
): [number, number][] | null {
  const queue: { pos: { y: number; x: number }; path: [number, number][] }[] = [
    { pos: start, path: [] },
  ];
  const visited = new Set<string>();
  visited.add(`${start.y},${start.x}`);

  const directions = [
    { dy: -1, dx: 0 },
    { dy: 1, dx: 0 },
    { dy: 0, dx: -1 },
    { dy: 0, dx: 1 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const { pos, path } = current;
    const posKey = `${pos.y},${pos.x}`;

    if (targetSet.has(posKey)) {
      return path; // percorso verso target
    }

    for (const { dy, dx } of directions) {
      const ny = pos.y + dy;
      const nx = pos.x + dx;

      if (ny < 0 || ny >= height || nx < 0 || nx >= width) continue;
      const tile = map[ny][nx];
      if (!walkableTiles.has(tile.type)) continue;

      const nextKey = `${ny},${nx}`;
      if (!visited.has(nextKey)) {
        visited.add(nextKey);
        queue.push({ pos: { y: ny, x: nx }, path: [...path, [ny, nx]] });
      }
    }
  }

  return null; // nessun percorso trovato
}

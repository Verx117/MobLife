import { TileTypes, type TileType } from "../assets/tileType";

export interface Tile {
  type: TileType;
  fixedEntity?: string;
  mobileEntities?: string[];
}

export function generateMap(height: number, width: number): Tile[][] {
  const map: Tile[][] = [];

  for (let y = 0; y < height; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < width; x++) {
      const rand = Math.random();
      let type: TileType;

      if (rand < 0.1) type = TileTypes.Sea;
      else if (rand < 0.2) type = TileTypes.River;
      else if (rand < 0.35) type = TileTypes.Mountains;
      else if (rand < 0.55) type = TileTypes.Hills;
      else type = TileTypes.Plains;

      row.push({ type });
    }
    map.push(row);
  }

  return map;
}

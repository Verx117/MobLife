// Tipi di terreno
export const TileTypes = {
  Plains: "Plains",
  Hills: "Hills",
  Mountains: "Mountains",
  River: "River",
  Sea: "Sea",
  Forest: "Forest",
  Desert: "Desert",
} as const;

export type TileType = (typeof TileTypes)[keyof typeof TileTypes];

export const tileColors: Record<TileType, string> = {
  Plains: "#a3d977",
  Hills: "#c2b280",
  Mountains: "#888888",
  River: "#4db1ff",
  Sea: "#1d4ed8",
  Forest: "#2C570A",
  Desert: "#E0D42F",
};

// ENTITÀ FISSE

export type FixedEntityType = "city" | "town" | "dungeon";

export interface BaseEntity {
  id: string;
  type: FixedEntityType;
  position: { y: number; x: number };
}

export interface City extends BaseEntity {
  type: "city";
  name: string;
  population: number;
  structures: string[];
  resources: string[];
}

export interface Town extends BaseEntity {
  type: "town";
  name: string;
  resources: string[];
}

export interface Dungeon extends BaseEntity {
  type: "dungeon";
  difficulty: number;
  monsters: string[];
}

export type FixedEntity = City | Town | Dungeon;

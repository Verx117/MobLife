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

//la velocità in cui camminano sulle caselle è segnata qui
export const tileCosts: Record<TileType, number> = {
  Plains: 1,
  Hills: 3,
  Mountains: 4,
  River: 3, //.5
  Sea: 5,
  Forest: 2, //.5
  Desert: 1, //.5
};

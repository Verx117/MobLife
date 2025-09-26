//export type TileType = "plains" | "hill" | "mountain" | "river" | "sea";
export const TileTypes = {
  Plains: "Plains",
  Hills: "Hills",
  Mountains: "Mountains",
  River: "River",
  Sea: "Sea",
} as const;

export type TileType = (typeof TileTypes)[keyof typeof TileTypes];

export const tileColors: Record<TileType, string> = {
  Plains: "#a3d977",
  Hills: "#c2b280",
  Mountains: "#888888",
  River: "#4db1ff",
  Sea: "#1d4ed8",
};

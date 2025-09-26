import type { Tile } from "../utils/mapGenerator";
import { tileColors } from "../assets/tileType";

interface MapGridProps {
  map: Tile[][];
}

export default function MapGrid({ map }: MapGridProps) {
  if (!map.length) return <p>Generando mappa...</p>;

  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: `repeat(${map[0].length}, 20px)` }}
    >
      {map.flat().map((tile, i) => (
        <div
          key={i}
          className="w-6 h-6"
          style={{ backgroundColor: tileColors[tile.type] }}
          title={`${tile.type} ${
            tile.fixedEntityId ? `(${tile.fixedEntityId})` : ""
          }`}
        />
      ))}
    </div>
  );
}

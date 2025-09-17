import { useMemo } from "react";
import { generateMap, type Tile } from "../utils/mapGenerator";
import { tileColors } from "../assets/tileType";

interface GamePageProps {
  config: {
    height: number;
    width: number;
    cities: number;
    towns: number;
    dungeons: number;
  };
}

export default function GamePage({ config }: GamePageProps) {
  const map: Tile[][] = useMemo(
    () => generateMap(config.height, config.width),
    [config]
  );

  return (
    <div className="flex h-screen flex-col">
      {/* Sidebar sopra */}
      <div className="flex h-16 items-center bg-gray-800 p-4 text-white">
        <h1 className="text-xl font-bold">Partita</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar sinistra */}
        <div className="w-64 bg-gray-900 p-4 text-white">
          <p className="mb-2">Azioni</p>
          <button className="mb-2 w-full rounded bg-blue-600 px-3 py-2 hover:bg-blue-500">
            Azione 1
          </button>
          <button className="w-full rounded bg-blue-600 px-3 py-2 hover:bg-blue-500">
            Azione 2
          </button>
        </div>

        {/* Centro mappa */}
        <div className="flex flex-1 items-center justify-center overflow-auto bg-gray-700 p-4">
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${config.width}, 24px)`,
              gridTemplateRows: `repeat(${config.height}, 24px)`,
              gap: "0px",
            }}
          >
            {map.flat().map((tile, i) => (
              <div
                key={i}
                className="border"
                style={{
                  backgroundColor: tileColors[tile.type],
                  width: 24,
                  height: 24,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar sotto */}
      <div className="h-16 bg-gray-800"></div>
    </div>
  );
}

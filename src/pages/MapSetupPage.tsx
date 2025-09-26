import { useState } from "react";
import GamePage from "./GamePage";
import { generateMap, type Tile } from "../utils/mapGenerator";
import { tileColors } from "../assets/tileType";

export default function MapSetupPage() {
  const [started, setStarted] = useState(false);

  const [height, setHeight] = useState(30);
  const [width, setWidth] = useState(30);
  const [cities, setCities] = useState(3);
  const [towns, setTowns] = useState(7);
  const [dungeons, setDungeons] = useState(4);

  const [map, setMap] = useState<Tile[][] | null>(null);

  const handleGenerate = () => {
    const newMap = generateMap(height, width);
    setMap(newMap);
  };

  if (started) {
    return (
      <GamePage
        config={{
          height,
          width,
          cities,
          towns,
          dungeons,
        }}
      />
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Barra sopra */}
      <div className="flex h-16 items-center bg-gray-800 p-4 text-white">
        <h1 className="text-xl font-bold">Setup Mappa</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar sinistra */}
        <div className="w-64 bg-gray-900 p-4 text-white">
          <p className="mb-4 text-lg font-semibold">Azioni</p>

          <button
            onClick={handleGenerate}
            className="mb-4 w-full rounded bg-blue-600 px-4 py-2 hover:bg-blue-500"
          >
            Genera mappa
          </button>

          <button
            onClick={() => setStarted(true)}
            className="w-full rounded bg-green-600 px-4 py-2 hover:bg-green-500"
          >
            Inizia Partita
          </button>
        </div>

        {/* Centro */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="space-y-6">
            <div>
              <h2 className="mb-2 font-bold">Size</h2>
              <div className="flex gap-4">
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-24 rounded border px-2"
                />
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="w-24 rounded border px-2"
                />
              </div>
            </div>

            <div>
              <h2 className="mb-2 font-bold">Rules</h2>
              <div className="flex flex-col gap-2">
                <input
                  type="number"
                  value={cities}
                  onChange={(e) => setCities(Number(e.target.value))}
                  className="w-40 rounded border px-2"
                  placeholder="Number of Cities"
                />
                <input
                  type="number"
                  value={towns}
                  onChange={(e) => setTowns(Number(e.target.value))}
                  className="w-40 rounded border px-2"
                  placeholder="Number of Towns"
                />
                <input
                  type="number"
                  value={dungeons}
                  onChange={(e) => setDungeons(Number(e.target.value))}
                  className="w-40 rounded border px-2"
                  placeholder="Number of Dungeons"
                />
              </div>
            </div>
          </div>

          {/* Render della mappa se esiste */}
          {map && (
            <div className="mt-8 flex justify-center">
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${width}, 20px)`,
                  gridTemplateRows: `repeat(${height}, 20px)`,
                  gap: "0px",
                }}
              >
                {map.flat().map((tile, i) => (
                  <div
                    key={i}
                    className="border"
                    style={{
                      backgroundColor: tileColors[tile.type],
                      width: 20,
                      height: 20,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Barra sotto */}
      <div className="h-16 bg-gray-800"></div>
    </div>
  );
}

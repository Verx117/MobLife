import { useState } from "react";
import GamePage from "./GamePage";
import {
  generateMap,
  placeFixedEntities,
  type Tile,
} from "../utils/mapGenerator";
import { tileColors, type FixedEntity } from "../assets/tileType";

export default function MapSetupPage() {
  const [started, setStarted] = useState(false);

  const [height, setHeight] = useState(30);
  const [width, setWidth] = useState(30);
  const [cities, setCities] = useState(3);
  const [towns, setTowns] = useState(7);
  const [dungeons, setDungeons] = useState(4);

  const [mode, setMode] = useState<"normal" | "islands" | "continents">(
    "normal"
  );

  const [map, setMap] = useState<Tile[][] | null>(null);
  const [entities, setEntities] = useState<Record<string, FixedEntity>>({});

  const handleGenerate = () => {
    const newMap = generateMap(height, width);
    const ents = placeFixedEntities(newMap, { cities, towns, dungeons });
    setMap(newMap);
    setEntities(ents);
  };

  if (started && map) {
    return (
      <GamePage
        config={{
          height,
          width,
          cities,
          towns,
          dungeons,
        }}
        map={map}
        entities={entities}
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
            className="w-full rounded bg-green-600 px-4 py-2 hover:bg-green-500 disabled:opacity-50"
            disabled={!map}
          >
            Inizia Partita
          </button>
        </div>

        {/* Centro */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="gap-6 flex flex-row">
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
              <div className="mt-6">
                <h2 className="mb-2 font-bold">Terrain form</h2>
                <select
                  value={mode}
                  onChange={(e) =>
                    setMode(
                      e.target.value as "normal" | "islands" | "continents"
                    )
                  }
                  className="w-full rounded border px-2 py-1 text-black"
                >
                  <option value="normal">Normal</option>
                  <option value="islands">Islands</option>
                  <option value="continents">Continents</option>
                </select>
              </div>
            </div>

            <div>
              <h2 className="mb-2 font-bold">Rules</h2>
              <div className="flex flex-col gap-2">
                <label htmlFor="cities">Cities</label>
                <input
                  type="number"
                  value={cities}
                  id="cities"
                  onChange={(e) => setCities(Number(e.target.value))}
                  className="w-40 rounded border px-2"
                  placeholder="Number of Cities"
                />
                <label htmlFor="towns">Towns</label>
                <input
                  type="number"
                  value={towns}
                  id="towns"
                  onChange={(e) => setTowns(Number(e.target.value))}
                  className="w-40 rounded border px-2"
                  placeholder="Number of Towns"
                />
                <label htmlFor="dungeons">Dungeons</label>
                <input
                  type="number"
                  value={dungeons}
                  id="dungeons"
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
                className={`grid`}
                style={{
                  gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${height}, minmax(0, 1fr))`,
                }}
              >
                {map.flat().map((tile, i) => {
                  const entityId = tile.fixedEntityId;
                  const entity = entityId ? entities[entityId] : null;

                  return (
                    <div
                      key={i}
                      className="border border-black flex items-center justify-center text-[10px] font-bold"
                      style={{
                        backgroundColor: tileColors[tile.type],
                        width: "20px",
                        height: "20px",
                        color: "white",
                      }}
                      title={
                        entity ? `${entity.type} (${entity.id})` : tile.type
                      }
                    >
                      {entity
                        ? entity.type === "city"
                          ? "C"
                          : entity.type === "town"
                          ? "T"
                          : "D"
                        : ""}
                    </div>
                  );
                })}
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

import { useState } from "react";
import GamePage from "./GamePage";

export default function MapSetupPage() {
  const [started, setStarted] = useState(false);

  const [height, setHeight] = useState(30);
  const [width, setWidth] = useState(30);
  const [cities, setCities] = useState(3);
  const [towns, setTowns] = useState(7);
  const [dungeons, setDungeons] = useState(4);

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
      {/* Sidebar sopra */}
      <div className="flex h-16 items-center bg-gray-800 p-4 text-white">
        <h1 className="text-xl font-bold">Setup Mappa</h1>
      </div>

      <div className="flex flex-1">
        {/* Sidebar sinistra */}
        <div className="w-64 bg-gray-900 p-4 text-white">
          <p className="mb-4 text-lg font-semibold">Azioni</p>
          <button
            onClick={() => setStarted(true)}
            className="w-full rounded bg-green-600 px-4 py-2 hover:bg-green-500"
          >
            Inizia Partita
          </button>
        </div>

        {/* Centro */}
        <div className="flex-1 p-6">
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
        </div>
      </div>

      {/* Sidebar sotto */}
      <div className="h-16 bg-gray-800"></div>
    </div>
  );
}

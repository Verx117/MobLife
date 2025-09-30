import { useEffect, useMemo, useState } from "react";
import { generateMap, type Tile } from "../utils/mapGenerator";
import { tileColors, type FixedEntity } from "../assets/tileType";
import type { MobileEntity } from "../assets/entitiesType";

import SidebarBottom from "../components/Sidebarbottom";
import {
  assignMissionIfNeeded,
  assignMissionsToFixedEntities,
} from "../system/missionSystem";
import { updateMovement } from "../system/movementSystem";
import { createMobileEntities } from "../system/entityFactory";

interface GamePageProps {
  config: {
    height: number;
    width: number;
    cities: number;
    towns: number;
    dungeons: number;
  };
  map?: Tile[][];
  entities?: Record<string, FixedEntity>;
}

export default function GamePage({
  config,
  map: initialMap,
  entities: initialEntities = {},
}: GamePageProps) {
  const map: Tile[][] = useMemo(
    () => initialMap ?? generateMap(config.height, config.width),
    [initialMap, config]
  );

  const [selectedCell, setSelectedCell] = useState<{
    y: number;
    x: number;
  } | null>(null);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [mobileEntities, setMobileEntities] = useState<
    Record<string, MobileEntity>
  >({});
  const [fixedEntities, setFixedEntities] =
    useState<Record<string, FixedEntity>>(initialEntities);

  // Tick globale
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Inizializzazione entità mobili al tick 1
  useEffect(() => {
    if (time === 1 && initialEntities) {
      setMobileEntities(createMobileEntities(initialEntities));
    }
  }, [time, initialEntities]);

  // Generazione missioni fisse ogni 30 tick
  useEffect(() => {
    setFixedEntities((prev) => assignMissionsToFixedEntities(prev, map, time));
  }, [time, map]);

  // Movimento e missioni con fasi pickup/execute/return
  useEffect(() => {
    setMobileEntities((prev) => {
      const next: Record<string, MobileEntity> = {};

      Object.values(prev).forEach((m) => {
        let updated = { ...m, missions: m.missions ?? [] };

        // 1. Assegnazione missioni dai giver
        updated = assignMissionIfNeeded(updated, fixedEntities, map, time);

        // 2. Movimento missioni attive
        updated = updateMovement(updated, fixedEntities, map, time);

        next[updated.id] = updated;
      });

      return next;
    });
  }, [time, fixedEntities, map]);

  return (
    <div className="flex h-screen flex-col">
      {/* Barra sopra */}
      <div className="flex h-16 items-center bg-gray-800 p-4 text-white">
        <h1 className="text-xl font-bold">Partita</h1>
        <div className="ml-auto flex flex-row gap-1">
          <button
            className="w-full rounded bg-red-600 px-3 py-2 hover:bg-red-500"
            onClick={() => setIsRunning(false)}
          >
            Pause
          </button>
          <button
            className="w-full rounded bg-green-600 px-3 py-2 hover:bg-green-500"
            onClick={() => setIsRunning(true)}
          >
            Play
          </button>
          {time}s
        </div>
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
          <div className="relative">
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${config.width}, 24px)`,
                gridTemplateRows: `repeat(${config.height}, 24px)`,
              }}
            >
              {map.flat().map((tile, i) => {
                const y = Math.floor(i / config.width);
                const x = i % config.width;

                const entity = tile.fixedEntityId
                  ? fixedEntities[tile.fixedEntityId]
                  : undefined;
                const mobilesHere = Object.values(mobileEntities).filter(
                  (m) => m.position.y === y && m.position.x === x
                );

                return (
                  <div
                    key={i}
                    className={`w-6 h-6 border flex items-center justify-center relative cursor-pointer ${
                      selectedCell?.y === y && selectedCell?.x === x
                        ? "ring-2 ring-yellow-400"
                        : ""
                    }`}
                    style={{ backgroundColor: tileColors[tile.type] }}
                    onClick={() => setSelectedCell({ y, x })}
                  >
                    {entity && (
                      <span className="text-[10px] font-bold text-white absolute top-0.5 left-0.5">
                        {entity.type === "city"
                          ? "C"
                          : entity.type === "town"
                          ? "T"
                          : "D"}
                      </span>
                    )}
                    {mobilesHere.length > 0 && (
                      <div className="flex gap-0.5">
                        {mobilesHere.map((m) => (
                          <span
                            key={m.id}
                            className="text-[10px] font-bold text-black"
                          >
                            {m.type === "hero"
                              ? "h"
                              : m.type === "adventurer"
                              ? "a"
                              : m.type === "civilian"
                              ? "c"
                              : "m"}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Overlay SVG per linee */}
            <svg
              className="absolute top-0 left-0 pointer-events-none"
              width={config.width * 24}
              height={config.height * 24}
            >
              {Object.values(mobileEntities).flatMap((m) =>
                (m.missions ?? [])
                  .filter(
                    (mission) =>
                      !mission.completedAt &&
                      mission.path &&
                      mission.path.length > 0
                  )
                  .map((mission) => {
                    const [ny, nx] = mission.path![0];
                    const startX = m.position.x * 24 + 12;
                    const startY = m.position.y * 24 + 12;
                    const endX = nx * 24 + 12;
                    const endY = ny * 24 + 12;
                    return (
                      <line
                        key={m.id + mission.id}
                        x1={startX}
                        y1={startY}
                        x2={endX}
                        y2={endY}
                        stroke="black"
                        strokeWidth={2}
                      />
                    );
                  })
              )}
            </svg>
          </div>
        </div>
      </div>

      <SidebarBottom
        tile={selectedCell ? map[selectedCell.y][selectedCell.x] : undefined}
        tilePosition={selectedCell || undefined}
        fixedEntities={
          selectedCell
            ? Object.values(fixedEntities).filter(
                (e) =>
                  e.position.y === selectedCell.y &&
                  e.position.x === selectedCell.x
              )
            : []
        }
        mobileEntities={
          selectedCell
            ? Object.values(mobileEntities).filter(
                (m) =>
                  m.position.y === selectedCell.y &&
                  m.position.x === selectedCell.x
              )
            : []
        }
        time={time}
      />
    </div>
  );
}

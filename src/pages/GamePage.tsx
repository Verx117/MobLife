// pages/GamePage.tsx
import { useEffect, useMemo, useState } from "react";
import { generateMap, type Tile } from "../utils/mapGenerator";
import { tileColors } from "../assets/tileType";
import type {
  MobileEntity,
  Mission,
  FixedEntity,
} from "../assets/entitiesType";

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
  const [missionRegistry, setMissionRegistry] = useState<
    Record<string, Mission>
  >({});

  // tick loop
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // inizializza entità mobili
  useEffect(() => {
    if (time === 1 && initialEntities) {
      setMobileEntities(createMobileEntities(initialEntities));
    }
  }, [time, initialEntities]);

  // genera missioni per entità fisse
  useEffect(() => {
    const { updatedEntities, updatedRegistry } = assignMissionsToFixedEntities(
      fixedEntities,
      missionRegistry,
      map,
      time
    );
    setFixedEntities(updatedEntities);
    setMissionRegistry(updatedRegistry);
  }, [time]);

  // muove entità e aggiorna missioni
  useEffect(() => {
    setMobileEntities((prev) => {
      const next: Record<string, MobileEntity> = {};
      let updatedRegistry = { ...missionRegistry };
      let updatedFixed = { ...fixedEntities };

      Object.values(prev).forEach((m) => {
        let current = { ...m };

        const moveResult = updateMovement(
          current,
          updatedFixed,
          updatedRegistry,
          map,
          time
        );
        current = moveResult.updatedMobile;
        updatedRegistry = moveResult.updatedRegistry;

        if (time % 10 === 0) {
          const assignResult = assignMissionIfNeeded(
            current,
            updatedFixed,
            updatedRegistry,
            map,
            time
          );
          current = assignResult.updatedMobile;
          updatedFixed = assignResult.updatedEntities;
          updatedRegistry = assignResult.updatedRegistry;
        }

        next[current.id] = current;
      });

      setFixedEntities(updatedFixed);
      setMissionRegistry(updatedRegistry);
      return next;
    });
  }, [time]);

  return (
    <div className="flex h-screen flex-col">
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

import { useEffect, useMemo, useState } from "react";
import { generateMap, type Tile } from "../utils/mapGenerator";
import {
  tileColors,
  tileCosts,
  type FixedEntity,
  type TileType,
  MissionCatalog,
  type Mission,
} from "../assets/tileType";
import type { MobileEntity } from "../assets/entitiesType";
import { bfsPathToTarget } from "../utils/mapUtils";
import SidebarBottom from "../components/Sidebarbottom";

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
  entities = {},
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
  const [isRunning, setIsRunning] = useState(true); // controllo pausa/play
  const [mobileEntities, setMobileEntities] = useState<
    Record<string, MobileEntity>
  >({});

  // Tick globale
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Inizializzazione entità mobili al tick 1
  useEffect(() => {
    if (time === 1 && entities) {
      const newEntities: Record<string, MobileEntity> = {};

      const firstCity = Object.values(entities).find((e) => e.type === "city");
      if (firstCity) {
        const id = "hero-party-1";
        newEntities[id] = {
          id,
          type: "hero",
          position: firstCity.position,
          missions: [],
        };
      }

      Object.values(entities)
        .filter((e) => e.type === "city")
        .forEach((city, i) => {
          const id = `adventurer-party-${i + 1}`;
          newEntities[id] = {
            id,
            type: "adventurer",
            position: city.position,
            missions: [],
          };
        });

      Object.values(entities)
        .filter((e) => e.type === "town")
        .forEach((town, i) => {
          const id = `civilian-party-${i + 1}`;
          newEntities[id] = {
            id,
            type: "civilian",
            position: town.position,
            missions: [],
          };
        });

      Object.values(entities)
        .filter((e) => e.type === "dungeon")
        .forEach((dungeon, i) => {
          for (let j = 0; j < 2; j++) {
            const id = `monsters-party-${i + 1}-${j + 1}`;
            newEntities[id] = {
              id,
              type: "monsters",
              position: dungeon.position,
              missions: [],
            };
          }
        });

      setMobileEntities(newEntities);
    }
  }, [time, entities]);

  // Movimento e missioni con fasi pickup/execute/return
  useEffect(() => {
    setMobileEntities((prev) => {
      const next: Record<string, MobileEntity> = {};

      Object.values(prev).forEach((m) => {
        // Copia l'entità e assicura che missions sia sempre un array
        const newM: MobileEntity = {
          ...m,
          missions:
            m.missions?.map((ms) => ({ ...ms, phase: ms.phase ?? "pickup" })) ??
            [],
        };

        // Controlla se c'è una missione attiva
        const hasActiveMission = newM.missions.some((ms) => !ms.completedAt);

        // Assegna missione solo se non ce n'è una attiva e ogni 30 tick
        if (time % 30 === 0 && !hasActiveMission) {
          const giver = Object.values(entities).find((e) =>
            Object.values(MissionCatalog).some(
              (mission) =>
                mission.allowedGivers.includes(e.type) &&
                mission.allowedRecipients.includes(newM.type)
            )
          );

          if (giver) {
            const missionTemplate = Object.values(MissionCatalog).find(
              (mission) =>
                mission.allowedGivers.includes(giver.type) &&
                mission.allowedRecipients.includes(newM.type)
            );

            if (missionTemplate) {
              const possibleTargets = Object.values(entities).filter(
                (e) => e.type === "town" || e.type === "city"
              );

              if (possibleTargets.length > 0) {
                const target =
                  possibleTargets[
                    Math.floor(Math.random() * possibleTargets.length)
                  ];

                const path = bfsPathToTarget(
                  map,
                  map.length,
                  map[0].length,
                  newM.position,
                  new Set([`${target.position.y},${target.position.x}`]),
                  new Set(Object.keys(tileCosts) as TileType[])
                );

                if (path) {
                  const mission: Mission & {
                    phase?: "pickup" | "execute" | "return";
                  } = {
                    id: `${missionTemplate.type}-${Date.now()}`,
                    type: missionTemplate.type,
                    giverId: giver.id,
                    target: target.position,
                    duration: missionTemplate.baseDuration,
                    assignedTo: newM.id,
                    path,
                    progress: 0,
                    phase: "pickup", // fase iniziale: pickup dal giver
                  };

                  newM.missions.push(mission);

                  const giverEntity = entities[giver.id];
                  if (giverEntity) {
                    giverEntity.missions ??= [];
                    giverEntity.missions.push(mission);
                  }
                }
              }
            }
          }
        }

        // Movimento missioni attive
        newM.missions.forEach((mission) => {
          if (mission.completedAt || !mission.path || mission.path.length === 0)
            return;

          // Determina destinazione in base alla fase
          if (mission.phase === "pickup" || mission.phase === "return") {
            const giver = entities[mission.giverId];
            if (!giver) return;
          }

          const [ny, nx] = mission.path[0];
          const cost = tileCosts[map[ny][nx].type] ?? 1;
          mission.progress = (mission.progress ?? 0) + 1;

          if (mission.progress >= cost) {
            newM.position = { y: ny, x: nx };
            mission.path = mission.path.slice(1);
            mission.progress = 0;

            // Quando arriva a destinazione cambia fase
            if (mission.path.length === 0) {
              if (mission.phase === "pickup") {
                // Ora va al target della missione
                mission.phase = "execute";
                const pathToTarget = bfsPathToTarget(
                  map,
                  map.length,
                  map[0].length,
                  newM.position,
                  new Set([`${mission.target.y},${mission.target.x}`]),
                  new Set(Object.keys(tileCosts) as TileType[])
                );
                mission.path = pathToTarget ?? [];
              } else if (mission.phase === "execute") {
                // Missione completata, torna dal giver
                mission.phase = "return";
                const giver = entities[mission.giverId];
                if (giver) {
                  const pathToGiver = bfsPathToTarget(
                    map,
                    map.length,
                    map[0].length,
                    newM.position,
                    new Set([`${giver.position.y},${giver.position.x}`]),
                    new Set(Object.keys(tileCosts) as TileType[])
                  );
                  mission.path = pathToGiver ?? [];
                }
              } else if (mission.phase === "return") {
                // Missione consegnata
                mission.completedAt = time;
              }
            }
          }
        });

        next[newM.id] = newM;
      });

      return next;
    });
  }, [time, entities, map]);

  return (
    <div className="flex h-screen flex-col">
      {/* Barra sopra */}
      <div className="flex h-16 items-center bg-gray-800 p-4 text-white">
        <h1 className="text-xl font-bold">Partita</h1>
        <button>Pause</button>
        <button>Play</button>
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
                  ? entities[tile.fixedEntityId]
                  : undefined;
                const mobilesHere = Object.values(mobileEntities).filter(
                  (m) => m.position.y === y && m.position.x === x
                );

                const tooltip = [
                  tile.type,
                  entity?.type?.toUpperCase(),
                  mobilesHere.length
                    ? mobilesHere
                        .map((m) =>
                          m.type === "hero"
                            ? "h"
                            : m.type === "adventurer"
                            ? "a"
                            : m.type === "civilian"
                            ? "c"
                            : "m"
                        )
                        .join(", ")
                    : null,
                ]
                  .filter(Boolean)
                  .join(" | ");

                return (
                  <div
                    key={i}
                    className={`w-6 h-6 border flex items-center justify-center relative cursor-pointer ${
                      selectedCell?.y === Math.floor(i / config.width) &&
                      selectedCell?.x === i % config.width
                        ? "ring-2 ring-yellow-400"
                        : ""
                    }`}
                    style={{ backgroundColor: tileColors[tile.type] }}
                    title={tooltip}
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

      {/* Sidebar bottom */}
      <SidebarBottom
        tile={selectedCell ? map[selectedCell.y][selectedCell.x] : undefined}
        tilePosition={selectedCell || undefined}
        fixedEntities={
          selectedCell
            ? Object.values(entities).filter(
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
        time={time} // passiamo il tick corrente per missioni concluse, ti servirà
      />
    </div>
  );
}

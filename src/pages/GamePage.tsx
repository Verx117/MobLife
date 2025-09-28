import { useEffect, useMemo, useState } from "react";
import { generateMap, type Tile } from "../utils/mapGenerator";
import {
  tileColors,
  tileCosts,
  type FixedEntity,
  type TileType,
} from "../assets/tileType";
import type { MobileEntity } from "../assets/entitiesType";
import { bfsPathToTarget } from "../utils/mapUtils"; // funzione BFS già presente o da creare

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

  const [time, setTime] = useState(0);
  const [mobileEntities, setMobileEntities] = useState<
    Record<string, MobileEntity>
  >({});

  // Tick globale
  useEffect(() => {
    const interval = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Inizializzazione entità mobili al tick 1
  useEffect(() => {
    if (time === 1 && entities) {
      const newEntities: Record<string, MobileEntity> = {};

      // Hero party → 1 sola volta, in una città
      const firstCity = Object.values(entities).find((e) => e.type === "city");
      if (firstCity) {
        const id = "hero-party-1";
        newEntities[id] = { id, type: "hero", position: firstCity.position };
      }

      // Adventurer party → 1 per ogni città
      Object.values(entities)
        .filter((e) => e.type === "city")
        .forEach((city, i) => {
          const id = `adventurer-party-${i + 1}`;
          newEntities[id] = { id, type: "adventurer", position: city.position };
        });

      // Civilian party → 1 per ogni paese
      Object.values(entities)
        .filter((e) => e.type === "town")
        .forEach((town, i) => {
          const id = `civilian-party-${i + 1}`;
          newEntities[id] = { id, type: "civilian", position: town.position };
        });

      // Monsters party → 2 per ogni dungeon
      Object.values(entities)
        .filter((e) => e.type === "dungeon")
        .forEach((dungeon, i) => {
          for (let j = 0; j < 2; j++) {
            const id = `monsters-party-${i + 1}-${j + 1}`;
            newEntities[id] = {
              id,
              type: "monsters",
              position: dungeon.position,
            };
          }
        });

      console.log("Inizializzate entità mobili:", newEntities);
      setMobileEntities(newEntities);
    }
  }, [time, entities]);

  // Movimento e missioni
  useEffect(() => {
    setMobileEntities((prev) => {
      const next: Record<string, MobileEntity> = { ...prev };

      Object.values(next).forEach((m) => {
        // Assegna missione ogni 30 tick se è un mostro senza missione
        if (time % 30 === 0 && m.type === "monsters" && !m.mission) {
          const dungeon = Object.values(entities).find(
            (e) => e.type === "dungeon"
          );
          const targetTown = Object.values(entities).find(
            (e) => e.type === "town"
          );
          if (dungeon && targetTown) {
            const path = bfsPathToTarget(
              map,
              map.length,
              map[0].length,
              m.position,
              new Set([`${targetTown.position.y},${targetTown.position.x}`]),
              new Set(Object.keys(tileCosts) as TileType[])
            );
            if (path) {
              m.mission = { target: targetTown.position, path, progress: 0 };
              console.log(
                `Missione assegnata a ${m.id}: verso ${targetTown.id}`
              );
            }
          }
        }

        // Movimento entità
        if (m.mission && m.mission.path.length > 0) {
          const [ny, nx] = m.mission.path[0];
          const cost = tileCosts[map[ny][nx].type] ?? 1;
          m.mission.progress += 1;

          if (m.mission.progress >= cost) {
            m.position = { y: ny, x: nx };
            m.mission.path = m.mission.path.slice(1);
            m.mission.progress = 0;
            console.log(`${m.id} si muove a ${ny},${nx}`);
          }
        }
      });

      return { ...next };
    });
  }, [time]);

  return (
    <div className="flex h-screen flex-col">
      {/* Barra sopra */}
      <div className="flex h-16 items-center bg-gray-800 p-4 text-white">
        <h1 className="text-xl font-bold">Partita</h1>
        <div className="ml-auto">{time}s</div>
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
            }}
          >
            {map.flat().map((tile, i) => {
              const entity = tile.fixedEntityId && entities[tile.fixedEntityId];
              const mobilesHere = Object.values(mobileEntities).filter(
                (m) =>
                  m.position.x === i % config.width &&
                  m.position.y === Math.floor(i / config.width)
              );

              const tooltip = [
                tile.type,
                entity ? entity.type.toUpperCase() : null,
                mobilesHere.length > 0
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
                  className="w-6 h-6 border flex items-center justify-center relative"
                  style={{ backgroundColor: tileColors[tile.type] }}
                  title={tooltip}
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

      <div className="h-16 bg-gray-800"></div>
    </div>
  );
}

import { bfsPathToTarget } from "../utils/mapUtils";
import { tileCosts, type TileType, type FixedEntity } from "../assets/tileType";
import type { MobileEntity } from "../assets/entitiesType";
import type { Tile } from "../utils/mapGenerator";

// Aggiorna lo stato di movimento e fasi missioni per un'entità mobile con gestione immutabile per evitare problemi di React rendering
export function updateMovement(
  m: MobileEntity,
  entities: Record<string, FixedEntity>,
  map: Tile[][],
  time: number
): MobileEntity {
  let newPosition = { ...m.position };

  const updatedMissions = (m.missions ?? []).map((mission) => {
    // Skip se completata o senza path
    if (mission.completedAt || !mission.path || mission.path.length === 0) {
      return { ...mission };
    }

    // Prossima cella da raggiungere
    const [ny, nx] = mission.path[0];
    const cost = tileCosts[map[ny][nx].type] ?? 1;
    const newProgress = (mission.progress ?? 0) + 1;

    if (newProgress >= cost) {
      // L'entità si sposta
      newPosition = { y: ny, x: nx };

      let newPhase = mission.phase;
      let newPath = mission.path.slice(1);
      let completedAt = mission.completedAt;

      // Se il path è terminato → cambia fase o completa
      if (newPath.length === 0) {
        if (mission.phase === "pickup") {
          newPhase = "execute";
          const pathToTarget = bfsPathToTarget(
            map,
            map.length,
            map[0].length,
            newPosition,
            new Set([`${mission.target.y},${mission.target.x}`]),
            new Set(Object.keys(tileCosts) as TileType[])
          );
          newPath = pathToTarget ?? [];
        } else if (mission.phase === "execute") {
          newPhase = "return";
          const giver = entities[mission.giverId];
          if (giver) {
            const pathToGiver = bfsPathToTarget(
              map,
              map.length,
              map[0].length,
              newPosition,
              new Set([`${giver.position.y},${giver.position.x}`]),
              new Set(Object.keys(tileCosts) as TileType[])
            );
            newPath = pathToGiver ?? [];
          }
        } else if (mission.phase === "return") {
          completedAt = time;
        }
      }

      return {
        ...mission,
        progress: 0,
        path: newPath,
        phase: newPhase,
        completedAt,
      };
    }

    // Non ha ancora raggiunto la prossima cella
    return {
      ...mission,
      progress: newProgress,
    };
  });

  return {
    ...m,
    position: newPosition,
    missions: updatedMissions,
  };
}

import { bfsPathToTarget } from "../utils/mapUtils";
import { tileCosts, type TileType } from "../assets/tileType";
import type {
  MobileEntity,
  Mission,
  FixedEntity,
} from "../assets/entitiesType";
import type { Tile } from "../utils/mapGenerator";

const PICKUP_DURATION = 5;
const RETURN_DURATION = 10;

// Aggiorna il movimento e lo stato della missione nel registry
export function updateMovement(
  mobile: MobileEntity,
  entities: Record<string, FixedEntity>,
  missionRegistry: Record<string, Mission>,
  map: Tile[][],
  time: number
): {
  updatedMobile: MobileEntity;
  updatedRegistry: Record<string, Mission>;
} {
  const updatedMobile = { ...mobile };
  const updatedRegistry = { ...missionRegistry };
  let newPosition = { ...mobile.position };

  for (const mid of updatedMobile.missionIds) {
    const mission = updatedRegistry[mid];
    if (!mission || mission.completedAt) continue;

    let {
      phase = "pickup",
      phaseProgress = 0,
      path = [],
      progress = 0,
    } = mission;
    let completedAt = mission.completedAt;

    // Se fermo (path vuoto)
    if (!path || path.length === 0) {
      if (phase === "pickup") {
        if (phaseProgress + 1 >= PICKUP_DURATION) {
          phase = "execute";
          phaseProgress = 0;
          const pathToTarget = bfsPathToTarget(
            map,
            map.length,
            map[0].length,
            newPosition,
            new Set([`${mission.target.y},${mission.target.x}`]),
            new Set(Object.keys(tileCosts) as TileType[])
          );
          path = pathToTarget ?? [];
        } else {
          phaseProgress++;
        }
      } else if (phase === "execute") {
        if (phaseProgress + 1 >= (mission.duration ?? 10)) {
          phase = "return";
          phaseProgress = 0;
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
            path = pathToGiver ?? [];
          }
        } else {
          phaseProgress++;
        }
      } else if (phase === "return") {
        if (phaseProgress + 1 >= RETURN_DURATION) {
          completedAt = time;
          phaseProgress = 0;
        } else {
          phaseProgress++;
        }
      }
    } else {
      // Movimento lungo il path della missione
      const [ny, nx] = path[0];
      const tile = map[ny]?.[nx];

      if (!tile) continue;

      const cost = tileCosts[tile.type] ?? 1;
      progress++;

      if (progress >= cost) {
        newPosition = { y: ny, x: nx };
        path = path.slice(1);
        progress = 0;
        if (path.length === 0) phaseProgress = 0;
      }
    }

    // Aggiorna missione nel registry
    updatedRegistry[mid] = {
      ...mission,
      phase,
      phaseProgress,
      path,
      progress,
      completedAt,
    };
  }

  updatedMobile.position = newPosition;

  return {
    updatedMobile,
    updatedRegistry,
  };
}

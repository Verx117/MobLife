import { bfsPathToTarget } from "../utils/mapUtils";
import { tileCosts, type TileType } from "../assets/tileType";
import {
  type MobileEntity,
  MissionCatalog,
  type Mission,
  type FixedEntity,
} from "../assets/entitiesType";
import type { Tile } from "../utils/mapGenerator";

/**
 * Genera o aggiorna le missioni dei FixedEntity e le salva nel registry centrale
 */
export function assignMissionsToFixedEntities(
  entities: Record<string, FixedEntity>,
  missionRegistry: Record<string, Mission>,
  map: Tile[][],
  time: number
): {
  updatedEntities: Record<string, FixedEntity>;
  updatedRegistry: Record<string, Mission>;
} {
  const updatedEntities = { ...entities };
  const updatedRegistry = { ...missionRegistry };

  for (const fixed of Object.values(updatedEntities)) {
    if (!fixed.missionIds) fixed.missionIds = [];

    // genera una nuova missione ogni 25 tick se ha meno di 6 attive
    if (time % 25 === 0 && fixed.missionIds.length < 6) {
      const defs = Object.values(MissionCatalog).filter((def) =>
        def.allowedGivers.includes(fixed.type)
      );

      if (defs.length > 0) {
        const def = defs[Math.floor(Math.random() * defs.length)];
        const id = `${def.type}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

        const mission: Mission = {
          id,
          type: def.type,
          giverId: fixed.id,
          target: fixed.position,
          duration: def.baseDuration,
        };

        updatedRegistry[id] = mission;
        fixed.missionIds.push(id);
      }
    }

    // pulizia missioni vecchie completate da troppo tempo
    fixed.missionIds = fixed.missionIds.filter((mid) => {
      const ms = updatedRegistry[mid];
      if (!ms) return false;
      if (ms.completedAt && time - ms.completedAt > 60) {
        delete updatedRegistry[mid];
        return false;
      }
      return true;
    });
  }

  return { updatedEntities, updatedRegistry };
}

/**
 * Assegna una missione disponibile a un'entità mobile se ne ha bisogno
 */
export function assignMissionIfNeeded(
  mobile: MobileEntity,
  entities: Record<string, FixedEntity>,
  missionRegistry: Record<string, Mission>,
  map: Tile[][],
  time: number
): {
  updatedMobile: MobileEntity;
  updatedEntities: Record<string, FixedEntity>;
  updatedRegistry: Record<string, Mission>;
} {
  const updatedMobile = { ...mobile };
  const updatedEntities = { ...entities };
  const updatedRegistry = { ...missionRegistry };

  const activeMissions = updatedMobile.missionIds.filter((id) => {
    const m = updatedRegistry[id];
    return m && !m.completedAt;
  });

  if (activeMissions.length > 0)
    return { updatedMobile, updatedEntities, updatedRegistry };

  // trova missioni disponibili compatibili
  const available = Object.values(updatedRegistry).filter(
    (m) =>
      !m.assignedTo &&
      !m.completedAt &&
      MissionCatalog[m.type].allowedRecipients.includes(updatedMobile.type)
  );

  if (available.length === 0)
    return { updatedMobile, updatedEntities, updatedRegistry };

  const chosen = available[Math.floor(Math.random() * available.length)];
  const giver = updatedEntities[chosen.giverId];
  if (!giver) return { updatedMobile, updatedEntities, updatedRegistry };

  const path =
    mobile.position.y === chosen.target.y &&
    mobile.position.x === chosen.target.x
      ? []
      : bfsPathToTarget(
          map,
          map.length,
          map[0].length,
          mobile.position,
          new Set([`${chosen.target.y},${chosen.target.x}`]),
          new Set(Object.keys(tileCosts) as TileType[])
        ) ?? [];

  updatedRegistry[chosen.id] = {
    ...chosen,
    assignedTo: updatedMobile.id,
    path,
    progress: 0,
    phase: "pickup",
    phaseProgress: 0,
  };

  giver.missionIds = giver.missionIds.filter((id) => id !== chosen.id);
  giver.missionIds.push(chosen.id);
  updatedMobile.missionIds.push(chosen.id);

  return { updatedMobile, updatedEntities, updatedRegistry };
}

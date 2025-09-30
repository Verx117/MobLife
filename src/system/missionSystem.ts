import { bfsPathToTarget } from "../utils/mapUtils";
import {
  tileCosts,
  MissionCatalog,
  type TileType,
  type Mission,
  type FixedEntity,
} from "../assets/tileType";
import type { MobileEntity } from "../assets/entitiesType";
import type { Tile } from "../utils/mapGenerator";

// GENERAZIONE / GESTIONE MISSIONI DALLE ENTITA' FISSE
export function assignMissionsToFixedEntities(
  entities: Record<string, FixedEntity>,
  map: Tile[][],
  time: number
): Record<string, FixedEntity> {
  const updated: Record<string, FixedEntity> = { ...entities };

  for (const e of Object.values(entities)) {
    if (!e.missions) e.missions = [];

    // Ogni 30 tick genera una nuova missione se ha meno di 3 attive
    if (
      time > 0 &&
      time % 30 === 0 &&
      e.missions.filter((m) => !m.completedAt).length < 3
    ) {
      const possibleDefs = Object.values(MissionCatalog).filter((def) =>
        def.allowedGivers.includes(e.type)
      );
      if (possibleDefs.length > 0) {
        const def =
          possibleDefs[Math.floor(Math.random() * possibleDefs.length)];

        const mission: Mission = {
          id: `${def.type}-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`,
          type: def.type,
          giverId: e.id,
          target: e.position, // per ora target = posizione del giver
          duration: def.baseDuration,
        };

        e.missions.push(mission);
      }
    }

    // Ripulisce missioni troppo vecchie (60 tick dopo completamento)
    e.missions = e.missions.filter(
      (m) => !m.completedAt || time - m.completedAt <= 60
    );

    updated[e.id] = { ...e };
  }

  return updated;
}

// ASSEGNAZIONE MISSIONI ALLE ENTITA' MOBILI
export function assignMissionIfNeeded(
  m: MobileEntity,
  entities: Record<string, FixedEntity>,
  map: Tile[][],
  time: number
): MobileEntity {
  const hasActiveMission = m.missions.some((ms) => !ms.completedAt);
  if (hasActiveMission) return m;

  // Cerca missioni disponibili da entità fisse compatibili
  const availableMissions: Mission[] = [];
  for (const giver of Object.values(entities)) {
    if (!giver.missions) continue;

    const defs = Object.values(MissionCatalog).filter(
      (def) =>
        def.allowedGivers.includes(giver.type) &&
        def.allowedRecipients.includes(m.type)
    );

    giver.missions.forEach((mission) => {
      if (!mission.assignedTo) {
        const def = defs.find((d) => d.type === mission.type);
        if (def) availableMissions.push(mission);
      }
    });
  }

  if (availableMissions.length === 0) return m;

  // Prende una missione random
  const chosen =
    availableMissions[Math.floor(Math.random() * availableMissions.length)];
  const giver = entities[chosen.giverId];
  if (!giver) return m;

  // Calcola path verso il target
  const path = bfsPathToTarget(
    map,
    map.length,
    map[0].length,
    m.position,
    new Set([`${chosen.target.y},${chosen.target.x}`]),
    new Set(Object.keys(tileCosts) as TileType[])
  );

  if (!path) return m;

  const assigned: Mission = {
    ...chosen,
    assignedTo: m.id,
    path,
    progress: 0,
    phase: "pickup",
  };

  // Marca la missione sul giver come assegnata
  giver.missions = giver?.missions?.map((ms) =>
    ms.id === chosen.id ? assigned : ms
  );

  return {
    ...m,
    missions: [...m.missions, assigned],
  };
}

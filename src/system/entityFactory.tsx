import type { MobileEntity, FixedEntity } from "../assets/entitiesType";

// Genera tutte le entità mobili iniziali partendo dalle entità fisse
export function createMobileEntities(
  entities: Record<string, FixedEntity>
): Record<string, MobileEntity> {
  const newEntities: Record<string, MobileEntity> = {};

  // Hero party: il primo viene generato nella prima città trovata
  const firstCity = Object.values(entities).find((e) => e.type === "city");
  if (firstCity) {
    const id = "hero-party-1";
    newEntities[id] = {
      id,
      type: "hero",
      position: { ...firstCity.position },
      missionIds: [],
    };
  }

  // Adventurer parties: uno per ogni città
  Object.values(entities)
    .filter((e) => e.type === "city")
    .forEach((city, i) => {
      const id = `adventurer-party-${i + 1}`;
      newEntities[id] = {
        id,
        type: "adventurer",
        position: { ...city.position },
        missionIds: [],
      };
    });

  // Civilian parties: uno per ogni villaggio
  Object.values(entities)
    .filter((e) => e.type === "town")
    .forEach((town, i) => {
      const id = `civilian-party-${i + 1}`;
      newEntities[id] = {
        id,
        type: "civilian",
        position: { ...town.position },
        missionIds: [],
      };
    });

  // Monster parties: due per ogni dungeon
  Object.values(entities)
    .filter((e) => e.type === "dungeon")
    .forEach((dungeon, i) => {
      for (let j = 0; j < 2; j++) {
        const id = `monsters-party-${i + 1}-${j + 1}`;
        newEntities[id] = {
          id,
          type: "monsters",
          position: { ...dungeon.position },
          missionIds: [],
        };
      }
    });

  return newEntities;
}

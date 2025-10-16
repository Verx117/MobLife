//ENTITA' MOBILI

export type MobileEntityType = "hero" | "adventurer" | "civilian" | "monsters";

export interface BaseMobileEntity {
  id: string;
  type: MobileEntityType;
  position: { y: number; x: number };
  missionIds: string[]; // elenco missioni dell entità mobile
  // Campi dinamici di movimento
  path?: [number, number][] | null; // percorso attuale
  progress?: number; // avanzamento sulla casella corrente
  phase?: "pickup" | "execute" | "return"; // fase della missione corrente
}

export interface HeroParty extends BaseMobileEntity {
  type: "hero";
}

export interface AdventurerParty extends BaseMobileEntity {
  type: "adventurer";
}

export interface CivilianParty extends BaseMobileEntity {
  type: "civilian";
}

export interface MonstersParty extends BaseMobileEntity {
  type: "monsters";
}

export type MobileEntity =
  | HeroParty
  | AdventurerParty
  | CivilianParty
  | MonstersParty;

// ENTITÀ FISSE

export type FixedEntityType = "city" | "town" | "dungeon";

export interface BaseEntity {
  id: string;
  type: FixedEntityType;
  position: { y: number; x: number };
  missionIds: string[];
  name: string[];
}

export interface City extends BaseEntity {
  type: "city";
}

export interface Town extends BaseEntity {
  type: "town";
}

export interface Dungeon extends BaseEntity {
  type: "dungeon";
}

export type FixedEntity = City | Town | Dungeon;

// MISSIONI

export type MissionType =
  | "miasma-corruption"
  | "prepare-farming"
  | "trade-route"
  | "defend-town"
  | "explore-wilderness";

export interface MissionDefinition {
  type: MissionType;
  allowedGivers: FixedEntityType[]; // chi può generarla
  allowedRecipients: string[]; // tipi di mobile entity che la possono ricevere
  baseDuration: number; // durata standard in tick
}

export const MissionCatalog: Record<MissionType, MissionDefinition> = {
  "miasma-corruption": {
    type: "miasma-corruption",
    allowedGivers: ["dungeon"],
    allowedRecipients: ["monsters"],
    baseDuration: 10,
  },
  "prepare-farming": {
    type: "prepare-farming",
    allowedGivers: ["town"],
    allowedRecipients: ["civilian"],
    baseDuration: 8,
  },
  "trade-route": {
    type: "trade-route",
    allowedGivers: ["city", "town"],
    allowedRecipients: ["civilian", "adventurer"],
    baseDuration: 12,
  },
  "defend-town": {
    type: "defend-town",
    allowedGivers: ["city"],
    allowedRecipients: ["hero", "adventurer", "civilian"],
    baseDuration: 6,
  },
  "explore-wilderness": {
    type: "explore-wilderness",
    allowedGivers: ["city", "town"],
    allowedRecipients: ["hero", "adventurer", "civilian"],
    baseDuration: 15,
  },
};

export interface Mission {
  id: string;
  type: MissionType;
  giverId: string; // entità che ha creato la missione
  target: { y: number; x: number };
  duration: number; // quanto dura prima che scada
  assignedTo?: string; // id dell'entità mobile che la esegue
  path?: [number, number][] | null; // percorso calcolato
  progress?: number; // avanzamento sul costo della casella
  phase?: "pickup" | "execute" | "return"; // fase della missione
  phaseProgress?: number; //avanzamento fase missione
  completedAt?: number; // tick in cui la missione è stata completata
}

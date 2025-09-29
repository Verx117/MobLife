// Tipi di terreno
export const TileTypes = {
  Plains: "Plains",
  Hills: "Hills",
  Mountains: "Mountains",
  River: "River",
  Sea: "Sea",
  Forest: "Forest",
  Desert: "Desert",
} as const;

export type TileType = (typeof TileTypes)[keyof typeof TileTypes];

export const tileColors: Record<TileType, string> = {
  Plains: "#a3d977",
  Hills: "#c2b280",
  Mountains: "#888888",
  River: "#4db1ff",
  Sea: "#1d4ed8",
  Forest: "#2C570A",
  Desert: "#E0D42F",
};

//la velocità in cui camminano sulle caselle è segnata qui
export const tileCosts: Record<TileType, number> = {
  Plains: 10,
  Hills: 30,
  Mountains: 40,
  River: 35,
  Sea: 50,
  Forest: 25,
  Desert: 15,
};

// ENTITÀ FISSE

export type FixedEntityType = "city" | "town" | "dungeon";

export interface BaseEntity {
  id: string;
  type: FixedEntityType;
  position: { y: number; x: number };
  missions?: Mission[];
}

export interface City extends BaseEntity {
  type: "city";
  name: string;
  population: number;
  structures: string[];
  resources: string[];
}

export interface Town extends BaseEntity {
  type: "town";
  name: string;
  resources: string[];
}

export interface Dungeon extends BaseEntity {
  type: "dungeon";
  difficulty: number;
  monsters: string[];
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
    baseDuration: 100,
  },
  "prepare-farming": {
    type: "prepare-farming",
    allowedGivers: ["town"],
    allowedRecipients: ["civilian"],
    baseDuration: 80,
  },
  "trade-route": {
    type: "trade-route",
    allowedGivers: ["city", "town"],
    allowedRecipients: ["civilian", "adventurer"],
    baseDuration: 120,
  },
  "defend-town": {
    type: "defend-town",
    allowedGivers: ["city"],
    allowedRecipients: ["hero", "adventurer"],
    baseDuration: 60,
  },
  "explore-wilderness": {
    type: "explore-wilderness",
    allowedGivers: ["city", "town"],
    allowedRecipients: ["hero", "adventurer"],
    baseDuration: 150,
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
  completedAt?: number; // tick in cui la missione è stata completata
}

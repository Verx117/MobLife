export type MobileEntityType = "hero" | "adventurer" | "civilian" | "monsters";

export interface BaseMobileEntity {
  id: string;
  type: MobileEntityType;
  position: { y: number; x: number };
  mission?: {
    target: { y: number; x: number };
    origin?: { y: number; x: number }; // dungeon di partenza
    path: [number, number][]; // percorso calcolato a priori
    progress: number; // quanti tick mancanti per avanzare
    duration?: number; // durata totale della missione
  };
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

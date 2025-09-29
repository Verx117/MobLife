import type { Mission } from "./tileType";

export type MobileEntityType = "hero" | "adventurer" | "civilian" | "monsters";

export interface BaseMobileEntity {
  id: string;
  type: MobileEntityType;
  position: { y: number; x: number };
  missions: Mission[]; // elenco missioni dell entità mobile
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

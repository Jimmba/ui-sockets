import { SHIP_TYPES } from "../constants";

export interface IPosition {
  x: number;
  y: number;
}
export interface IUserShip {
  position: IPosition;
  direction: boolean;
  length: number;
  type: SHIP_TYPES;
}
export interface IShip extends IUserShip {
  hits: number[];
}

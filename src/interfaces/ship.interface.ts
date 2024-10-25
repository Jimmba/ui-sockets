import { SHIP_TYPES } from "../constants";

export interface IShip {
  position: {
    x: number;
    y: number;
  };
  direction: boolean;
  length: number;
  type: SHIP_TYPES;
}

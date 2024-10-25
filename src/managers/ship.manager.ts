import { IShip } from "../interfaces";

export class ShipsManager {
  gameId: number;
  ships: IShip;
  indexPlayer: number;

  constructor(gameId: number, ships: IShip, indexPlayer: number) {
    this.gameId = gameId;
    this.ships = ships;
    this.indexPlayer = indexPlayer;
  }
}

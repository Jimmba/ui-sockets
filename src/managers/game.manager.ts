import { IShip } from "../interfaces";

interface IGame {
  [index: number]: IShip | null;
}

export class GameManager {
  games: { [gameId: number]: IGame } = {};
  id: number;

  constructor() {
    this.id = 1;
  }

  newGame(index1: number, index2: number): number {
    const game = {
      [index1]: null,
      [index2]: null,
    };
    this.games[this.id] = game;
    console.log(this.games);
    return this.id++;
  }

  isStartGame(gameId: number) {
    const game = this.games[gameId];
    return Object.values(game).indexOf(null) === -1;
  }

  addShips(gameId: number, playerId: number, ships: IShip) {
    this.games[gameId][playerId] = ships;
    console.log(this.games);
  }
}

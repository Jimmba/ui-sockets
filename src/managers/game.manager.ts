import { ATTACK_RESULTS } from "../constants";
import { IPosition, IShip, IUserShip } from "../interfaces";
export class Player {
  private index: number;
  private ships: IShip[];
  private aliveShips: number = 0;
  private surroundingCells: IPosition[] = [];

  constructor(index: number) {
    this.index = index;
    this.ships = [];
  }

  addShips(ships: IUserShip[]) {
    const modifiedShips: IShip[] = ships.map((ship) => {
      return {
        ...ship,
        hits: [],
      };
    });
    this.ships = modifiedShips;
    this.aliveShips = ships.length;
  }

  getShips(): IUserShip[] {
    return this.ships.map((ship) => {
      const { hits, ...rest } = ship;
      return {
        ...rest,
      };
    });
  }

  getIndex() {
    return this.index;
  }

  private markSurroundingCells(ship: IShip): void {
    const surroundingCells: IPosition[] = [];
    const { position, direction, length } = ship;

    for (let i = -1; i <= length; i++) {
      for (let j = -1; j <= 1; j++) {
        const x = direction ? position.x + j : position.x + i;
        const y = direction ? position.y + i : position.y + j;

        if (i >= 0 && i < length && j === 0) continue;
        surroundingCells.push({ x, y });
      }
    }

    this.surroundingCells = surroundingCells;
  }

  getSurroundingCellsAndReset() {
    const cells = [...this.surroundingCells];
    this.surroundingCells = [];
    return cells;
  }

  checkShot(x: number, y: number): ATTACK_RESULTS {
    for (const ship of this.ships) {
      const hitResult = this.isHit(ship, x, y);
      if (hitResult === ATTACK_RESULTS.SHOT) {
        return ATTACK_RESULTS.SHOT;
      } else if (hitResult === ATTACK_RESULTS.KILLED) {
        this.aliveShips -= 1;
        this.markSurroundingCells(ship);
        return ATTACK_RESULTS.KILLED;
      }
    }
    return ATTACK_RESULTS.MISS;
  }

  private isHit(ship: IShip, x: number, y: number): ATTACK_RESULTS {
    const { position, direction, length, hits } = ship;

    for (let i = 0; i < length; i++) {
      const segmentX = direction ? position.x : position.x + i;
      const segmentY = direction ? position.y + i : position.y;

      if (segmentX === x && segmentY === y) {
        if (hits.includes(i)) {
          return ATTACK_RESULTS.MISS;
        }

        hits.push(i);

        return hits.length === length
          ? ATTACK_RESULTS.KILLED
          : ATTACK_RESULTS.SHOT;
      }
    }

    return ATTACK_RESULTS.MISS;
  }

  isAllShipsKilled(): boolean {
    return this.aliveShips === 0;
  }
}

export class Game {
  private player1: Player;
  private player2: Player;
  private activePlayerIndex: number;

  constructor(index1: number, index2: number) {
    this.player1 = new Player(index1);
    this.player2 = new Player(index2);
    this.activePlayerIndex = Math.random() < 0.5 ? index1 : index2;
  }

  isReadyToStart(): boolean {
    return !!(this.player1.getShips().length && this.player2.getShips().length);
  }

  getActivePlayerIndex() {
    return this.activePlayerIndex;
  }

  changeActivePlayer(): void {
    const index1 = this.player1.getIndex();
    const index2 = this.player2.getIndex();
    this.activePlayerIndex =
      this.activePlayerIndex !== index1 ? index1 : index2;
  }

  getPlayers() {
    return {
      player1: this.player1,
      player2: this.player2,
    };
  }

  getEnemy(): Player {
    const index1 = this.player1.getIndex();
    return this.activePlayerIndex !== index1 ? this.player1 : this.player2;
  }
}

export class GameManager {
  games: { [gameId: number]: Game } = {};
  id: number;

  constructor() {
    this.id = 1;
  }

  newGame(index1: number, index2: number): number {
    const game = new Game(index1, index2);

    this.games[this.id] = game;
    console.log(this.games);
    return this.id++;
  }

  isStartGame(gameId: number) {
    const game = this.games[gameId];
    const res = game.isReadyToStart();
    return res;
  }

  private getPlayer(gameId: number, playerId: number): Player {
    const game = this.games[gameId];
    const { player1, player2 } = game.getPlayers();
    return playerId === player1.getIndex() ? player1 : player2;
  }

  addPlayerShips(gameId: number, playerId: number, ships: IUserShip[]) {
    const player = this.getPlayer(gameId, playerId);
    player.addShips(ships);
  }

  getPlayerShips(gameId: number, playerId: number) {
    const player = this.getPlayer(gameId, playerId);
    return player.getShips();
  }
}

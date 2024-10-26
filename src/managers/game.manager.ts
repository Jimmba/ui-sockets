import { ATTACK_RESULTS, BOT_ID, GAME_FIELD, SHIP_TYPES } from "../constants";
import { generateShips } from "../helpers/ship_generator.helper";

import { IPosition, IShip, IUserShip } from "../interfaces";
export class Player {
  private index: number;
  private ships: IShip[];
  private aliveShips: number = 0;
  private surroundingCells: IPosition[] = [];
  private gameMap: number[][] = [];

  constructor(index: number) {
    this.index = index;
    this.ships = [];
  }

  private createGameMap() {
    const row = new Array(10).fill(GAME_FIELD.UNKNOWN);
    this.gameMap = new Array(10).fill([]).map((el) => [...row]);
  }

  randomAttack() {
    const availableFields = this.gameMap.flat().filter((el) => !el).length;
    const randomField = Math.floor(Math.random() * availableFields);

    let k = 0;
    for (let i1 = 0; i1 < this.gameMap.length; i1++) {
      for (let i2 = 0; i2 < this.gameMap[i1].length; i2++) {
        if (this.gameMap[i1][i2] === GAME_FIELD.UNKNOWN) {
          if (randomField === k) {
            return { x: i2, y: i1 }; // row is y
          }
          k += 1;
        }
      }
    }
    return { x: 0, y: 0 }; // default values
  }

  private markShipAsKilled(y: number, x: number) {
    const isFieldExist = (x: number, y: number) => {
      return x >= 0 && x < 10 && y >= 0 && y < 10;
    };

    const setField = (x: number, y: number, value: GAME_FIELD) => {
      if (isFieldExist(x, y)) this.gameMap[x][y] = value;
    };

    this.gameMap[x][y] = GAME_FIELD.KILLED;

    let k = 1;
    while (isFieldExist(x + k, y)) {
      setField(x + k, y - 1, GAME_FIELD.MISS);
      setField(x + k, y + 1, GAME_FIELD.MISS);
      const value = this.gameMap[x + k][y];
      if (value !== GAME_FIELD.SHOT) {
        this.gameMap[x + k][y] = GAME_FIELD.MISS;
        break;
      }
      this.gameMap[x + k][y] = GAME_FIELD.KILLED;
      k += 1;
    }

    k = -1;
    while (isFieldExist(x + k, y)) {
      setField(x + k, y - 1, GAME_FIELD.MISS);
      setField(x + k, y + 1, GAME_FIELD.MISS);
      const value = this.gameMap[x + k][y];
      if (value !== GAME_FIELD.SHOT) {
        this.gameMap[x + k][y] = GAME_FIELD.MISS;
        break;
      }
      this.gameMap[x + k][y] = GAME_FIELD.KILLED;
      k -= 1;
    }

    k = 1;
    while (isFieldExist(x, y + k)) {
      setField(x - 1, y + k, GAME_FIELD.MISS);
      setField(x + 1, y + k, GAME_FIELD.MISS);
      const value = this.gameMap[x][y + k];
      if (value !== GAME_FIELD.SHOT) {
        this.gameMap[x][y + k] = GAME_FIELD.MISS;
        break;
      }
      this.gameMap[x][y + k] = GAME_FIELD.KILLED;
      k += 1;
    }

    k = -1;
    while (isFieldExist(x, y + k)) {
      setField(x - 1, y + k, GAME_FIELD.MISS);
      setField(x + 1, y + k, GAME_FIELD.MISS);
      const value = this.gameMap[x][y + k];
      if (value !== GAME_FIELD.SHOT) {
        this.gameMap[x][y + k] = GAME_FIELD.MISS;
        break;
      }
      this.gameMap[x][y + k] = GAME_FIELD.KILLED;
      k -= 1;
    }
  }

  updateGameMap(hitResult: ATTACK_RESULTS, x: number, y: number) {
    let fieldValue = GAME_FIELD.MISS;
    if (hitResult === ATTACK_RESULTS.SHOT) fieldValue = GAME_FIELD.SHOT;
    if (hitResult === ATTACK_RESULTS.KILLED) {
      fieldValue = GAME_FIELD.KILLED;
      this.markShipAsKilled(x, y);
    }
    console.log(hitResult, x, y);
    this.gameMap[y][x] = fieldValue;
    console.log(this.gameMap);
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
    this.createGameMap();
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
  private activePlayerIndex!: number;

  constructor(index1: number, index2: number) {
    this.player1 = new Player(index1);
    this.player2 = new Player(index2);
    this.selectActivePlayer(index1, index2);
  }

  private selectActivePlayer(index1: number, index2: number) {
    if (index2 === BOT_ID) {
      this.activePlayerIndex = index1;
      return;
    }
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

  randomAttack() {
    const player = this.getEnemy();
    return player.randomAttack();
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

  playWithBot(userId: number) {
    const gameId = this.newGame(userId, BOT_ID);
    const botShips = generateShips();

    this.addPlayerShips(gameId, BOT_ID, botShips);
    return gameId;
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

import { ATTACK_RESULTS, GAME_FIELD_STATUS } from "../constants";
import { markShipAsKilled } from "../helpers";
import { ICellStatus, IPosition, IShip, IUserShip } from "../interfaces";

export class Player {
  private index: number;
  private ships: IShip[];
  private aliveShips: number = 0;
  private killedShipCells: ICellStatus[] = [];
  private gameMap: number[][] = [];

  constructor(index: number) {
    this.index = index;
    this.ships = [];
  }

  private createGameMap(): void {
    const row = new Array(10).fill(GAME_FIELD_STATUS.UNKNOWN);
    this.gameMap = new Array(10).fill([]).map((el) => [...row]);
  }

  randomAttack(): IPosition {
    const availableFields = this.gameMap.flat().filter((el) => !el).length;
    const randomField = Math.floor(Math.random() * availableFields);

    let k = 0;
    for (let i1 = 0; i1 < this.gameMap.length; i1++) {
      for (let i2 = 0; i2 < this.gameMap[i1].length; i2++) {
        if (this.gameMap[i1][i2] === GAME_FIELD_STATUS.UNKNOWN) {
          if (randomField === k) {
            return { x: i2, y: i1 }; // row is y
          }
          k += 1;
        }
      }
    }
    return { x: 0, y: 0 };
  }

  updateGameMap(hitResult: ATTACK_RESULTS, x: number, y: number): void {
    let fieldValue = GAME_FIELD_STATUS.MISS;
    if (hitResult === ATTACK_RESULTS.SHOT) fieldValue = GAME_FIELD_STATUS.SHOT;
    if (hitResult === ATTACK_RESULTS.KILLED) {
      fieldValue = GAME_FIELD_STATUS.KILLED;
      markShipAsKilled(this.gameMap, x, y);
    }
    this.gameMap[y][x] = fieldValue;
  }

  addShips(ships: IUserShip[]): void {
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

  getIndex(): number {
    return this.index;
  }

  private markKilledShipCells(ship: IShip): void {
    const killedShipCells: ICellStatus[] = [];
    const { position, direction, length } = ship;

    for (let i = -1; i <= length; i++) {
      for (let j = -1; j <= 1; j++) {
        const x = direction ? position.x + j : position.x + i;
        const y = direction ? position.y + i : position.y + j;

        if (i >= 0 && i < length && j === 0) {
          killedShipCells.push({ x, y, status: ATTACK_RESULTS.KILLED });
        } else {
          killedShipCells.push({ x, y, status: ATTACK_RESULTS.MISS });
        }
      }
    }

    this.killedShipCells = killedShipCells;
  }

  getKilledShipCellsAndReset(): ICellStatus[] {
    const cells = [...this.killedShipCells];
    this.killedShipCells = [];
    return cells;
  }

  checkShot(x: number, y: number): ATTACK_RESULTS {
    for (const ship of this.ships) {
      const hitResult = this.isHit(ship, x, y);
      if (hitResult === ATTACK_RESULTS.SHOT) {
        return ATTACK_RESULTS.SHOT;
      } else if (hitResult === ATTACK_RESULTS.KILLED) {
        this.aliveShips -= 1;
        this.markKilledShipCells(ship);
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

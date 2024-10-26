import { SHIP_TYPES } from "../constants";
import { IPosition, IUserShip } from "../interfaces";

const SHIPS_DATA = [
  { type: SHIP_TYPES.HUGE, length: 4, count: 1 },
  { type: SHIP_TYPES.LARGE, length: 3, count: 2 },
  { type: SHIP_TYPES.MEDIUM, length: 2, count: 3 },
  { type: SHIP_TYPES.SMALL, length: 1, count: 4 },
];

const MAP_SIZE = 10;

const generateRandomPosition = (): IPosition => {
  return {
    x: Math.floor(Math.random() * MAP_SIZE),
    y: Math.floor(Math.random() * MAP_SIZE),
  };
};

const canPlaceShip = (
  gameMap: number[][],
  position: IPosition,
  length: number,
  direction: boolean
): boolean => {
  const { x, y } = position;

  for (let i = 0; i < length; i++) {
    const checkX = direction ? x : x + i;
    const checkY = direction ? y + i : y;

    if (
      checkX >= gameMap.length ||
      checkY >= gameMap[0].length ||
      gameMap[checkX][checkY] === 1 ||
      hasAdjacentShip(gameMap, checkX, checkY)
    ) {
      return false;
    }
  }
  return true;
};

const hasAdjacentShip = (
  gameMap: number[][],
  x: number,
  y: number
): boolean => {
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const adjX = x + dx;
      const adjY = y + dy;

      if (
        adjX >= 0 &&
        adjX < gameMap.length &&
        adjY >= 0 &&
        adjY < gameMap[0].length &&
        gameMap[adjX][adjY] === 1
      ) {
        return true;
      }
    }
  }
  return false;
};

const placeShip = (gameMap: number[][], ship: IUserShip) => {
  const { x, y } = ship.position;
  const { length, direction } = ship;

  for (let i = 0; i < length; i++) {
    const placeX = direction ? x : x + i;
    const placeY = direction ? y + i : y;
    gameMap[placeX][placeY] = 1;
  }
};

export const generateShips = (): IUserShip[] => {
  const gameMap = Array.from({ length: MAP_SIZE }, () =>
    Array(MAP_SIZE).fill(0)
  );
  const ships: IUserShip[] = [];

  for (const { type, length, count } of SHIPS_DATA) {
    for (let i = 0; i < count; i++) {
      let placed = false;

      while (!placed) {
        const direction = Math.random() < 0.5;
        const position = generateRandomPosition();

        if (canPlaceShip(gameMap, position, length, direction)) {
          const ship: IUserShip = { position, direction, type, length };
          placeShip(gameMap, ship);
          ships.push(ship);
          placed = true;
        }
      }
    }
  }

  return ships;
};

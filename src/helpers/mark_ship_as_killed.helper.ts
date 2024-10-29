import { GAME_FIELD_STATUS } from "../constants";

const isFieldExist = (x: number, y: number) => {
  return x >= 0 && x < 10 && y >= 0 && y < 10;
};

const setField = (
  gameMap: number[][],
  x: number,
  y: number,
  value: GAME_FIELD_STATUS
) => {
  if (isFieldExist(x, y)) gameMap[x][y] = value;
};

export const markShipAsKilled = (
  gameMap: number[][],
  y: number,
  x: number
): void => {
  gameMap[x][y] = GAME_FIELD_STATUS.KILLED;

  let k = 1;
  while (isFieldExist(x + k, y)) {
    setField(gameMap, x + k, y - 1, GAME_FIELD_STATUS.MISS);
    setField(gameMap, x + k, y + 1, GAME_FIELD_STATUS.MISS);
    const value = gameMap[x + k][y];
    if (value !== GAME_FIELD_STATUS.SHOT) {
      gameMap[x + k][y] = GAME_FIELD_STATUS.MISS;
      break;
    }
    gameMap[x + k][y] = GAME_FIELD_STATUS.KILLED;
    k += 1;
  }

  k = -1;
  while (isFieldExist(x + k, y)) {
    setField(gameMap, x + k, y - 1, GAME_FIELD_STATUS.MISS);
    setField(gameMap, x + k, y + 1, GAME_FIELD_STATUS.MISS);
    const value = gameMap[x + k][y];
    if (value !== GAME_FIELD_STATUS.SHOT) {
      gameMap[x + k][y] = GAME_FIELD_STATUS.MISS;
      break;
    }
    gameMap[x + k][y] = GAME_FIELD_STATUS.KILLED;
    k -= 1;
  }

  k = 1;
  while (isFieldExist(x, y + k)) {
    setField(gameMap, x - 1, y + k, GAME_FIELD_STATUS.MISS);
    setField(gameMap, x + 1, y + k, GAME_FIELD_STATUS.MISS);
    const value = gameMap[x][y + k];
    if (value !== GAME_FIELD_STATUS.SHOT) {
      gameMap[x][y + k] = GAME_FIELD_STATUS.MISS;
      break;
    }
    gameMap[x][y + k] = GAME_FIELD_STATUS.KILLED;
    k += 1;
  }

  k = -1;
  while (isFieldExist(x, y + k)) {
    setField(gameMap, x - 1, y + k, GAME_FIELD_STATUS.MISS);
    setField(gameMap, x + 1, y + k, GAME_FIELD_STATUS.MISS);
    const value = gameMap[x][y + k];
    if (value !== GAME_FIELD_STATUS.SHOT) {
      gameMap[x][y + k] = GAME_FIELD_STATUS.MISS;
      break;
    }
    gameMap[x][y + k] = GAME_FIELD_STATUS.KILLED;
    k -= 1;
  }
};

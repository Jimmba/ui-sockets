export enum SHIP_TYPES {
  "SMALL" = "small",
  "MEDIUM" = "medium",
  "LARGE" = "large",
  "HUGE" = "huge",
}

export const SHIPS_DATA = [
  { type: SHIP_TYPES.HUGE, length: 4, count: 1 },
  { type: SHIP_TYPES.LARGE, length: 3, count: 2 },
  { type: SHIP_TYPES.MEDIUM, length: 2, count: 3 },
  { type: SHIP_TYPES.SMALL, length: 1, count: 4 },
];

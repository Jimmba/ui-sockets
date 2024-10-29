export interface IRoomPlayer {
  name: string;
  index: number;
}

export interface IRoom {
  roomId: number | string;
  roomUsers: IRoomPlayer[];
}

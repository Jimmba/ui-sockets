import WebSocket from "ws";
import { IPlayer, IPlayerRequest, IPlayerResponse } from "../interfaces";

export interface IRoomPlayer {
  //! replace interfaces
  name: string;
  index: number; //! types
}

interface IRoom {
  roomId: number | string;
  roomUsers: IRoomPlayer[];
}

export class RoomsManager {
  rooms: IRoom[];
  id: number;

  constructor() {
    this.rooms = [];
    this.id = 1;
  }

  updateRoom() {
    return this.rooms; //! exclude himself
  }

  createRoom(player: IRoomPlayer) {
    const room = {
      roomId: this.id++,
      roomUsers: [player],
    };
    this.rooms.push(room);
  }

  getRoomToStartGame(index: number, player: IRoomPlayer): IRoom {
    const [roomToAdd] = this.rooms.filter((room) => {
      const { roomId } = room;
      return roomId === index;
    });
    roomToAdd.roomUsers.push(player);

    this.rooms = this.rooms.filter((room) => {
      //! refactor
      const { roomId } = room;
      return roomId !== index;
    });
    return roomToAdd;
  }
}

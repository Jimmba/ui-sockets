//! replace interfaces
export interface IRoomPlayer {
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
    return this.rooms;
  }

  isRoomExistByUserId(index: number) {
    const userRooms = this.rooms.filter((room) => {
      const { roomUsers } = room;
      for (let i = 0; i < roomUsers.length; i += 1) {
        const { index: savedIndex } = roomUsers[i];
        if (index === savedIndex) return true;
        return false;
      }
    });
    return userRooms.length ? true : false;
  }

  createRoom(player: IRoomPlayer) {
    const room = {
      roomId: this.id++,
      roomUsers: [player],
    };
    this.rooms.push(room);
  }

  removeRoomByUserId(index: number) {
    this.rooms = this.rooms.filter((room) => {
      const { roomUsers } = room;
      for (let i = 0; i < roomUsers.length; i += 1) {
        const { index: savedIndex } = roomUsers[i];
        if (index === savedIndex) return false;
        return true;
      }
    });
  }

  isNewUser(index: number, player: IRoomPlayer): boolean {
    const [roomToAdd] = this.rooms.filter((room) => {
      const { roomId } = room;
      return roomId === index;
    });
    const [waitPlayer] = roomToAdd.roomUsers;
    return player.index !== waitPlayer.index;
  }

  getRoomToStartGame(index: number, player: IRoomPlayer): IRoom {
    const [roomToAdd] = this.rooms.filter((room) => {
      const { roomId } = room;
      return roomId === index;
    });
    roomToAdd.roomUsers.push(player);

    this.rooms = this.rooms.filter((room) => {
      const { roomId } = room;
      return roomId !== index;
    });
    return roomToAdd;
  }
}

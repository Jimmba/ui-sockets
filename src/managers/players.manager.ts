import WebSocket from "ws";
import { IPlayer, IPlayerRequest, IPlayerResponse } from "../interfaces";

export class PlayersManager {
  players: IPlayer[];
  id: number;

  constructor() {
    this.players = [];
    this.id = 1;
  }

  private getData(player: IPlayer, errorText?: string): IPlayerResponse {
    const { name, id } = player;
    return {
      name,
      index: id,
      error: errorText ? true : false,
      errorText: errorText || "",
    };
  }

  handleRequest(ws: WebSocket, data: IPlayerRequest): IPlayerResponse {
    const { name, password } = data;

    const savedPlayers = this.players.filter((player) => {
      const { name: savedName } = player;
      return name === savedName;
    });
    if (!savedPlayers.length) {
      const newPlayer = {
        id: this.id++,
        socket: ws,
        name,
        password,
      };

      this.players.push(newPlayer);
      return this.getData(newPlayer);
    }

    const [savedPlayer] = savedPlayers;
    const { password: savedPassword } = savedPlayer;

    if (password !== savedPassword) {
      return this.getData(
        savedPlayer,
        "Player already exists. Password is incorrect" //! refactor
      );
    }

    return this.getData(savedPlayer);
  }

  disconnect(ws: WebSocket): void {
    this.players = this.players.filter((player) => {
      const { socket } = player;
      return ws !== socket;
    });
  }
}

import WebSocket from "ws";
import {
  IPlayer,
  IPlayerRequest,
  IPlayerResponse,
  IWinner,
} from "../interfaces";
import { USER_MESSAGES } from "../constants";

export class PlayersStorage {
  private players: IPlayer[];
  private id: number;

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

  getPlayers() {
    return this.players;
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
        wins: 0,
      };

      this.players.push(newPlayer);
      return this.getData(newPlayer);
    }

    const [savedPlayer] = savedPlayers;
    const { password: savedPassword } = savedPlayer;

    if (password !== savedPassword) {
      return this.getData(savedPlayer, USER_MESSAGES.INCORRECT_PASSWORD);
    }

    savedPlayer.socket = ws;
    return this.getData(savedPlayer);
  }

  getPlayerBySocket(ws: WebSocket): IPlayer {
    const [player] = this.players.filter((player) => {
      const { socket } = player;
      return ws === socket;
    });
    return player;
  }

  getPlayerByName(name: string): IPlayer {
    const [player] = this.players.filter((player) => {
      const { name: savedName } = player;
      return savedName === name;
    });
    return player;
  }

  getPlayerByIndex(index: number): IPlayer {
    const [player] = this.players.filter((player) => {
      const { id } = player;
      return index === id;
    });
    return player;
  }

  addWin(playerId: number): void {
    this.players.forEach((player) => {
      const { id } = player;
      if (playerId === id) {
        player.wins += 1;
        return;
      }
    });
  }

  getWinners(): IWinner[] {
    return this.players
      .map((player) => {
        const { name, wins } = player;
        return { name, wins };
      })
      .sort((player1, player2) => {
        const { wins: wins1 } = player1;
        const { wins: wins2 } = player2;
        if (wins1 > wins2) return -1;
        if (wins1 < wins2) return 1;
        return 0;
      });
  }

  removeSocket(index: number): void {
    const user = this.getPlayerByIndex(index);
    user.socket = null;
  }
}

import { WebSocket } from "ws";

export interface IPlayer {
  id: number;
  socket: WebSocket | null;
  name: string;
  password: string;
  wins: number;
}

export interface IPlayerRequest {
  name: string;
  password: string;
}

export interface IPlayerResponse {
  name: string;
  index: number | string;
  error: boolean;
  errorText: string;
}

export interface IWinner {
  name: string;
  wins: number;
}

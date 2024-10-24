import { WebSocket } from "ws";

export interface IPlayer {
  id: number; //! which should be?
  socket: WebSocket;
  name: string;
  password: string; //! encode?
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

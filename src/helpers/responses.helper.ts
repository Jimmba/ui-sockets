import { WebSocket } from "ws";
import { MESSAGE_TYPES } from "../constants";
import { IData } from "../interfaces";

export const getResponse = <T>(type: MESSAGE_TYPES, data: T): string => {
  const response: IData<string> = {
    type,
    data: JSON.stringify(data),
    id: 0,
  };
  return JSON.stringify(response);
};

export const sendResponse = <T>(
  ws: WebSocket,
  type: MESSAGE_TYPES,
  data: T
) => {
  const response = getResponse(type, data);
  console.warn(`SEND TYPE: ${type}, MESSAGE ${response}`);

  ws.send(response);
};

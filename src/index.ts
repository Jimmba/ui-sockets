import { WebSocket, WebSocketServer } from "ws";
import { PlayersManager } from "./managers";
import { IData, IPlayerRequest } from "./interfaces";
import { MESSAGE_TYPES } from "./constants";
import { sendResponse } from "./helpers";

const PORT = 3000; //! .env?

const wss = new WebSocketServer({ port: PORT });
const playersManager = new PlayersManager();

const handleRegRequest = (ws: WebSocket, parsedData: IPlayerRequest): void => {
  const type = MESSAGE_TYPES.REG;
  const data = playersManager.handleRequest(ws, parsedData as IPlayerRequest);
  return sendResponse(ws, type, data);
};

const handleMessage = (ws: WebSocket, regRequest: IData<string>): void => {
  const { type, data } = regRequest;
  console.warn(`GET TYPE: ${type}, MESSAGE ${data}`);

  const parsedData = JSON.parse(data);

  if (type === MESSAGE_TYPES.REG) {
    handleRegRequest(ws, parsedData);
    return;
  }

  ws.send("Type is not found"); //! refactor
};

wss.on("connection", function connection(ws: WebSocket) {
  ws.on("error", console.error);

  ws.on("message", function message(request: string) {
    const data = JSON.parse(request);
    return handleMessage(ws, data);
  });

  ws.on("disconnect", () => {
    console.log("OOOPS! Cliend disconnected"); //! remove?
  });

  ws.on("close", () => {
    playersManager.disconnect(ws);
    console.log("Cliend disconnected");
  });
});

console.log(`Server is started at port ${PORT}`);

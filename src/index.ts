import { WebSocket, WebSocketServer } from "ws";
import { IRoomPlayer, PlayersManager, RoomsManager } from "./managers";
import { IData, IPlayerRequest, IPlayerResponse, IShip } from "./interfaces";
import { MESSAGE_TYPES } from "./constants";
import { sendResponse } from "./helpers";
import { GameManager } from "./managers/game.manager";

const PORT = 3000; //! .env?

const wss = new WebSocketServer({ port: PORT });
const playersManager = new PlayersManager();
const roomsManager = new RoomsManager();
const gameManager = new GameManager();

const handleRegRequest = (
  ws: WebSocket,
  parsedData: IPlayerRequest
): IPlayerResponse => {
  const type = MESSAGE_TYPES.REG;
  const data = playersManager.handleRequest(ws, parsedData as IPlayerRequest);
  sendResponse(ws, type, data);
  return data;
};

const handleUpdateRoomRequest = (ws: WebSocket): void => {
  const type = MESSAGE_TYPES.UPDATE_ROOM;
  const data = roomsManager.updateRoom();
  console.log(`update room data `, data);
  return sendResponse(ws, type, data);
};

const handleCreateRoomRequest = (ws: WebSocket, player: IRoomPlayer): void => {
  // const type = MESSAGE_TYPES.CREATE_ROOM;
  roomsManager.createRoom(player); //! show message?
  // return sendResponse(ws, type, data);
};

const handleAddPlayerToRoomRequest = (
  ws: WebSocket,
  indexRoom: number,
  player: IRoomPlayer
): void => {
  // const type = MESSAGE_TYPES.CREATE_ROOM;
  const { roomUsers } = roomsManager.getRoomToStartGame(indexRoom, player); //! show message?
  const type = MESSAGE_TYPES.CREATE_GAME;

  const [{ index: index1 }, { index: index2 }] = roomUsers;
  const gameId = gameManager.newGame(index1, index2);

  roomUsers.forEach((roomUser) => {
    const { name, index } = roomUser;
    const { socket } = playersManager.getPlayerByName(name);
    sendResponse(socket, type, {
      idGame: gameId,
      idPlayer: index,
    });
  });
  // return sendResponse(ws, type, data);
};

const handleMessage = (ws: WebSocket, regRequest: IData<string>): void => {
  const { type, data } = regRequest;
  console.warn(`[GET] TYPE: ${type}, MESSAGE ${data}`);

  const parsedData = data.length ? JSON.parse(data) : "";

  if (type === MESSAGE_TYPES.REG) {
    handleRegRequest(ws, parsedData);
    handleUpdateRoomRequest(ws);
    return;
  }

  if (type === MESSAGE_TYPES.CREATE_ROOM) {
    const { name, id: index } = playersManager.getPlayerBySocket(ws);

    handleCreateRoomRequest(ws, { name, index });
    handleUpdateRoomRequest(ws);
    return;
  }

  if (type === MESSAGE_TYPES.ADD_USER_TO_ROOM) {
    const { name, id: index } = playersManager.getPlayerBySocket(ws);
    const { indexRoom } = parsedData as {
      indexRoom: number; //! type
    };
    handleAddPlayerToRoomRequest(ws, indexRoom, { name, index });
    return;
  }

  if (type === MESSAGE_TYPES.ADD_SHIPS) {
    const { gameId, ships, indexPlayer } = parsedData;
    gameManager.addShips(gameId, indexPlayer, ships);
    const isStartGame = gameManager.isStartGame(gameId);
    if (!isStartGame) return;

    const game = gameManager.games[gameId];
    const playersIndexes = Object.keys(game);
    playersIndexes.forEach((index) => {
      const playerId = parseInt(index);
      const { socket } = playersManager.getPlayerSocketByIndex(playerId);
      const data = game[playerId];
      sendResponse(socket, MESSAGE_TYPES.START_GAME, {
        ships: data,
        currentPlayerIndex: parseInt(playersIndexes[0]),
      });
    });
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

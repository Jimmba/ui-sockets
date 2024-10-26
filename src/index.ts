import { WebSocket, WebSocketServer } from "ws";
import {
  Game,
  GameManager,
  IRoomPlayer,
  PlayersManager,
  RoomsManager,
} from "./managers";
import { IData, IPlayerRequest, IPlayerResponse } from "./interfaces";
import { ATTACK_RESULTS, BOT_ID, MESSAGE_TYPES } from "./constants";
import { sendResponse } from "./helpers";

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

const handleUpdateRoomRequest = (): void => {
  const type = MESSAGE_TYPES.UPDATE_ROOM;
  const data = roomsManager.updateRoom();
  playersManager.players.forEach((player) => {
    const { socket } = player;
    return sendResponse(socket, type, data);
  });
};

const handleAddPlayerToRoomRequest = (
  indexRoom: number,
  player: IRoomPlayer
): void => {
  const isNewUser = roomsManager.isNewUser(indexRoom, player);
  if (!isNewUser) return;

  const { index: id } = player;
  roomsManager.removeRoomByUserId(id);

  const { roomUsers } = roomsManager.getRoomToStartGame(indexRoom, player); //! show message?

  handleUpdateRoomRequest();
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
};

const handleUpdateWinners = () => {
  const winners = playersManager.getWinners();
  const type = MESSAGE_TYPES.UPDATE_WINNERS;
  playersManager.players.forEach((player) => {
    const { socket } = player;
    sendResponse(socket, type, winners);
  });
};

const startGame = (gameId: number) => {
  const game: Game = gameManager.games[gameId];

  const { player1, player2 } = game.getPlayers();
  const playersIndexes = [player1.getIndex(), player2.getIndex()];
  const turnData = {
    currentPlayer: game.getActivePlayerIndex(),
  };

  playersIndexes
    .filter((index) => index !== BOT_ID)
    .forEach((playersIndex) => {
      const { socket } = playersManager.getPlayerByIndex(playersIndex);
      const data = gameManager.getPlayerShips(gameId, playersIndex);
      sendResponse(socket, MESSAGE_TYPES.START_GAME, {
        ships: data,
        currentPlayerIndex: game.getActivePlayerIndex(),
      });
      sendResponse(socket, MESSAGE_TYPES.TURN, turnData);
    });
};

const handleAttack = (game: Game, x: number, y: number) => {
  const enemy = game.getEnemy();
  const shootResult = enemy.checkShot(x, y);
  enemy.updateGameMap(shootResult, x, y);

  const getAttackData = (x: number, y: number, shootResult: ATTACK_RESULTS) => {
    return {
      position: {
        x,
        y,
      },
      currentPlayer: game.getActivePlayerIndex(),
      status: shootResult,
    };
  };

  const isMissed = shootResult === ATTACK_RESULTS.MISS;

  const attackData = getAttackData(x, y, shootResult);
  if (isMissed) game.changeActivePlayer();
  const currentPlayer = game.getActivePlayerIndex();

  const turnData = {
    currentPlayer,
  };

  const isKilled = shootResult === ATTACK_RESULTS.KILLED;
  const isFinished = isKilled && enemy.isAllShipsKilled();

  const { player1, player2 } = game.getPlayers();
  const playersIndexes = [player1.getIndex(), player2.getIndex()];
  const surroundingCells = isKilled ? enemy.getSurroundingCellsAndReset() : [];

  const playerId = game.getActivePlayerIndex();
  playersIndexes
    .filter((index) => index !== BOT_ID)
    .forEach((playersIndex) => {
      const { socket } = playersManager.getPlayerByIndex(playersIndex);
      sendResponse(socket, MESSAGE_TYPES.TURN, turnData);
      sendResponse(socket, MESSAGE_TYPES.ATTACK, attackData);

      if (isKilled) {
        surroundingCells.forEach((position) => {
          const { x, y } = position;
          sendResponse(
            socket,
            MESSAGE_TYPES.ATTACK,
            getAttackData(x, y, ATTACK_RESULTS.MISS)
          );
        });
      }

      if (isFinished) {
        sendResponse(socket, MESSAGE_TYPES.FINISH, {
          winPlayer: playerId,
        });
      }
    });

  if (isFinished) {
    playersManager.addWin(playerId);
    handleUpdateWinners();
  }

  if (currentPlayer === BOT_ID) {
    const { x, y } = game.randomAttack();
    handleAttack(game, x, y);
  }
};

const handleMessage = (ws: WebSocket, regRequest: IData<string>): void => {
  const { type, data } = regRequest;
  console.warn(`[GET] TYPE: ${type}, MESSAGE ${data}`);

  const parsedData = data.length ? JSON.parse(data) : "";

  if (type === MESSAGE_TYPES.REG) {
    handleRegRequest(ws, parsedData);
    handleUpdateRoomRequest();
    handleUpdateWinners();
    return;
  }

  if (type === MESSAGE_TYPES.CREATE_ROOM) {
    const { name, id: index } = playersManager.getPlayerBySocket(ws);
    const isRoomExist = roomsManager.isRoomExistByUserId(index);
    if (isRoomExist) return;
    roomsManager.createRoom({ name, index }); //! show message?
    handleUpdateRoomRequest();
    return;
  }

  if (type === MESSAGE_TYPES.ADD_USER_TO_ROOM) {
    const { name, id: index } = playersManager.getPlayerBySocket(ws);
    const { indexRoom } = parsedData;
    handleAddPlayerToRoomRequest(indexRoom, { name, index });
    return;
  }

  if (type === MESSAGE_TYPES.ADD_SHIPS) {
    const { gameId, ships, indexPlayer } = parsedData;
    gameManager.addPlayerShips(gameId, indexPlayer, ships);
    const isStartGame = gameManager.isStartGame(gameId);
    if (!isStartGame) return;
    startGame(gameId);
    return;
  }

  if (type === MESSAGE_TYPES.ATTACK) {
    const { gameId, x, y, indexPlayer } = parsedData;
    const game: Game = gameManager.games[gameId];
    const activePlayer = game.getActivePlayerIndex();
    if (activePlayer !== indexPlayer) return;

    handleAttack(game, x, y);
    return;
  }

  if (type === MESSAGE_TYPES.RANDOM_ATTACK) {
    const { gameId, indexPlayer } = parsedData;
    const game: Game = gameManager.games[gameId];
    const activePlayer = game.getActivePlayerIndex();
    if (activePlayer !== indexPlayer) return;

    const { x, y } = game.randomAttack();
    handleAttack(game, x, y);
    return;
  }

  if (type === MESSAGE_TYPES.PLAY_WITH_BOT) {
    const { id } = playersManager.getPlayerBySocket(ws);
    roomsManager.removeRoomByUserId(id);
    const gameId = gameManager.playWithBot(id);
    handleUpdateRoomRequest();
    sendResponse(ws, MESSAGE_TYPES.CREATE_GAME, {
      idGame: gameId,
      idPlayer: id,
    });
    return;
  }

  ws.send("Type is not found");
};

wss.on("connection", function connection(ws: WebSocket) {
  ws.on("error", console.error);

  ws.on("message", function message(request: string) {
    const data = JSON.parse(request);
    return handleMessage(ws, data);
  });

  ws.on("close", () => {
    const player = playersManager.getPlayerBySocket(ws);
    if (!player) return;
    const { id } = player;
    roomsManager.removeRoomByUserId(id);
    // gameManager.finishUserGame(id);
    handleUpdateRoomRequest();

    playersManager.removeSocket(id);
    console.log("Cliend disconnected");
  });
});

console.log(`Server is started at port ${PORT}`);

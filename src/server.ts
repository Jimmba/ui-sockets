import { WebSocket, WebSocketServer } from "ws";
import { Game } from "./managers";
import {
  IData,
  IPlayerRequest,
  IPlayerResponse,
  IRoomPlayer,
} from "./interfaces";
import { ATTACK_RESULTS, BOT_ID, MESSAGE_TYPES } from "./constants";
import { sendResponse } from "./helpers";
import { GamesStorage, PlayersStorage, RoomsStorage } from "./storages";

export const startServer = (port: number) => {
  const wss = new WebSocketServer({ port });
  const playersStorage = new PlayersStorage();
  const roomsStorage = new RoomsStorage();
  const gamesStorage = new GamesStorage();

  const handleRegRequest = (
    ws: WebSocket,
    parsedData: IPlayerRequest
  ): IPlayerResponse => {
    const type = MESSAGE_TYPES.REG;
    const data = playersStorage.handleRequest(ws, parsedData as IPlayerRequest);
    sendResponse(ws, type, data);
    return data;
  };

  const handleUpdateRoomRequest = (): void => {
    const type = MESSAGE_TYPES.UPDATE_ROOM;
    const data = roomsStorage.updateRoom();
    const players = playersStorage.getPlayers();
    players.forEach((player) => {
      const { socket } = player;
      return sendResponse(socket, type, data);
    });
  };

  const handleAddPlayerToRoomRequest = (
    indexRoom: number,
    player: IRoomPlayer
  ): void => {
    const isNewUser = roomsStorage.isNewUser(indexRoom, player);
    if (!isNewUser) return;

    const { index: id } = player;
    roomsStorage.removeRoomByUserId(id);

    const { roomUsers } = roomsStorage.getRoomToStartGame(indexRoom, player);

    handleUpdateRoomRequest();
    const type = MESSAGE_TYPES.CREATE_GAME;

    const [{ index: index1 }, { index: index2 }] = roomUsers;
    const gameId = gamesStorage.newGame(index1, index2);

    roomUsers.forEach((roomUser) => {
      const { name, index } = roomUser;
      const { socket } = playersStorage.getPlayerByName(name);
      sendResponse(socket, type, {
        idGame: gameId,
        idPlayer: index,
      });
    });
  };

  const handleUpdateWinners = () => {
    const winners = playersStorage.getWinners();
    const type = MESSAGE_TYPES.UPDATE_WINNERS;
    const players = playersStorage.getPlayers();
    players.forEach((player) => {
      const { socket } = player;
      sendResponse(socket, type, winners);
    });
  };

  const startGame = (gameId: number) => {
    const game: Game = gamesStorage.getGame(gameId);

    const { player1, player2 } = game.getPlayers();
    const playersIndexes = [player1.getIndex(), player2.getIndex()];
    const turnData = {
      currentPlayer: game.getActivePlayerIndex(),
    };

    playersIndexes
      .filter((index) => index !== BOT_ID)
      .forEach((playersIndex) => {
        const { socket } = playersStorage.getPlayerByIndex(playersIndex);
        const data = gamesStorage.getPlayerShips(gameId, playersIndex);
        sendResponse(socket, MESSAGE_TYPES.START_GAME, {
          ships: data,
          currentPlayerIndex: game.getActivePlayerIndex(),
        });
        sendResponse(socket, MESSAGE_TYPES.TURN, turnData);
      });
  };

  const handleAttack = (game: Game, x: number, y: number): ATTACK_RESULTS => {
    const enemy = game.getEnemy();
    const shootResult = enemy.checkShot(x, y);
    enemy.updateGameMap(shootResult, x, y);

    const getAttackData = (
      x: number,
      y: number,
      shootResult: ATTACK_RESULTS
    ) => {
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
    const cellsToSend = isKilled ? enemy.getKilledShipCellsAndReset() : [];

    const playerId = game.getActivePlayerIndex();
    playersIndexes
      .filter((index) => index !== BOT_ID)
      .forEach((playersIndex) => {
        const { socket } = playersStorage.getPlayerByIndex(playersIndex);
        sendResponse(socket, MESSAGE_TYPES.TURN, turnData);
        sendResponse(socket, MESSAGE_TYPES.ATTACK, attackData);

        if (isKilled) {
          cellsToSend.forEach((position) => {
            const { x, y, status } = position;
            sendResponse(
              socket,
              MESSAGE_TYPES.ATTACK,
              getAttackData(x, y, status)
            );
          });
        }

        if (isFinished) {
          const gameId = game.getGameId();
          gamesStorage.removeGame(gameId);
          sendResponse(socket, MESSAGE_TYPES.FINISH, {
            winPlayer: playerId,
          });
        }
      });

    if (isFinished) {
      playersStorage.addWin(playerId);
      handleUpdateWinners();
    }

    if (currentPlayer === BOT_ID) {
      const { x, y } = game.randomAttack();
      handleAttack(game, x, y);
    }

    return shootResult;
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
      const { name, id: index } = playersStorage.getPlayerBySocket(ws);
      const isRoomExist = roomsStorage.isRoomExistByUserId(index);
      if (isRoomExist) return;
      roomsStorage.createRoom({ name, index });
      handleUpdateRoomRequest();
      return;
    }

    if (type === MESSAGE_TYPES.ADD_USER_TO_ROOM) {
      const { name, id: index } = playersStorage.getPlayerBySocket(ws);
      const { indexRoom } = parsedData;
      handleAddPlayerToRoomRequest(indexRoom, { name, index });
      return;
    }

    if (type === MESSAGE_TYPES.ADD_SHIPS) {
      const { gameId, ships, indexPlayer } = parsedData;
      gamesStorage.addPlayerShips(gameId, indexPlayer, ships);
      const isStartGame = gamesStorage.isStartGame(gameId);
      if (!isStartGame) return;
      startGame(gameId);
      return;
    }

    if (type === MESSAGE_TYPES.ATTACK) {
      const { gameId, x, y, indexPlayer } = parsedData;
      const game: Game = gamesStorage.getGame(gameId);
      if (!game) return; // It is possible throw slow frontend.
      const activePlayer = game.getActivePlayerIndex();
      if (activePlayer !== indexPlayer) return;

      handleAttack(game, x, y);
      return;
    }

    if (type === MESSAGE_TYPES.RANDOM_ATTACK) {
      const { gameId, indexPlayer } = parsedData;
      const game: Game = gamesStorage.getGame(gameId);
      const activePlayer = game.getActivePlayerIndex();
      if (activePlayer !== indexPlayer) return;

      const { x, y } = game.randomAttack();
      handleAttack(game, x, y);
      return;
    }

    if (type === MESSAGE_TYPES.PLAY_WITH_BOT) {
      const { id } = playersStorage.getPlayerBySocket(ws);
      roomsStorage.removeRoomByUserId(id);
      const gameId = gamesStorage.playWithBot(id);
      handleUpdateRoomRequest();
      sendResponse(ws, MESSAGE_TYPES.CREATE_GAME, {
        idGame: gameId,
        idPlayer: id,
      });
      return;
    }
  };

  wss.on("connection", function connection(ws: WebSocket) {
    ws.on("error", console.error);

    ws.on("message", function message(request: string) {
      const data = JSON.parse(request);
      return handleMessage(ws, data);
    });

    ws.on("close", () => {
      const player = playersStorage.getPlayerBySocket(ws);
      if (!player) return;
      const { id, name } = player;
      roomsStorage.removeRoomByUserId(id);
      const winnerId = gamesStorage.finishGameWithUserAndReturnWinnerId(id);
      
      if (winnerId !== null && winnerId !== BOT_ID) {
        const { socket } = playersStorage.getPlayerByIndex(winnerId);
        sendResponse(socket, MESSAGE_TYPES.FINISH, {
          winPlayer: winnerId,
        });
        playersStorage.addWin(winnerId);
        handleUpdateWinners();
        handleUpdateRoomRequest();
      }

      playersStorage.removeSocket(id);
      console.warn(`Client ${name} disconnected`);
    });
  });

  console.log(`Server is started at port ${port}`);
  return wss;
};

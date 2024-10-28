import { BOT_ID } from "../constants";
import { generateShips } from "../helpers";
import { IUserShip } from "../interfaces";
import { Game, Player } from "../managers";

export class GamesStorage {
  private games: { [gameId: number]: Game } = {};
  private id: number;

  constructor() {
    this.id = 1;
  }

  getGame(id: number): Game {
    return this.games[id];
  }

  removeGame(id: number): void {
    delete this.games[id];
  }

  newGame(index1: number, index2: number): number {
    const game = new Game(index1, index2, this.id);

    this.games[this.id] = game;
    return this.id++;
  }

  playWithBot(userId: number): number {
    const gameId = this.newGame(userId, BOT_ID);
    const botShips = generateShips();

    this.addPlayerShips(gameId, BOT_ID, botShips);
    return gameId;
  }

  isStartGame(gameId: number): boolean {
    const game = this.games[gameId];
    return game.isReadyToStart();
  }

  finishGameWithUserAndReturnWinnerId(playerIndex: number): number | null {
    const games = Object.values(this.games);
    for (let i = 0; i < games.length; i += 1) {
      const game = games[i];
      const { player1, player2 } = game.getPlayers();
      const index1 = player1.getIndex();
      const index2 = player2.getIndex();
      const gameId = game.getGameId();
      if (index1 === playerIndex) {
        delete this.games[gameId];
        return index2;
      }
      if (index2 === playerIndex) {
        delete this.games[gameId];
        return index1;
      }
    }
    return null;
  }

  private getPlayer(gameId: number, playerId: number): Player {
    const game = this.games[gameId];
    const { player1, player2 } = game.getPlayers();
    return playerId === player1.getIndex() ? player1 : player2;
  }

  addPlayerShips(gameId: number, playerId: number, ships: IUserShip[]): void {
    const player = this.getPlayer(gameId, playerId);
    player.addShips(ships);
  }

  getPlayerShips(gameId: number, playerId: number): IUserShip[] {
    const player = this.getPlayer(gameId, playerId);
    return player.getShips();
  }
}

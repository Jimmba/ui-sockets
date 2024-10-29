import { BOT_ID } from "../constants";

import { Player } from "./player.manager";
export class Game {
  private player1: Player;
  private player2: Player;
  private activePlayerIndex!: number;
  private gameId: number;

  constructor(index1: number, index2: number, gameId: number) {
    this.player1 = new Player(index1);
    this.player2 = new Player(index2);
    this.gameId = gameId;
    this.selectActivePlayer(index1, index2);
  }

  getGameId(): number {
    return this.gameId;
  }

  private selectActivePlayer(index1: number, index2: number): void {
    if (index2 === BOT_ID) {
      this.activePlayerIndex = index1;
      return;
    }
    this.activePlayerIndex = Math.random() < 0.5 ? index1 : index2;
  }

  isReadyToStart(): boolean {
    return !!(this.player1.getShips().length && this.player2.getShips().length);
  }

  getActivePlayerIndex(): number {
    return this.activePlayerIndex;
  }

  changeActivePlayer(): void {
    const index1 = this.player1.getIndex();
    const index2 = this.player2.getIndex();
    this.activePlayerIndex =
      this.activePlayerIndex !== index1 ? index1 : index2;
  }

  getPlayers(): { player1: Player; player2: Player } {
    return {
      player1: this.player1,
      player2: this.player2,
    };
  }

  getEnemy(): Player {
    const index1 = this.player1.getIndex();
    return this.activePlayerIndex !== index1 ? this.player1 : this.player2;
  }

  randomAttack() {
    const player = this.getEnemy();
    return player.randomAttack();
  }
}

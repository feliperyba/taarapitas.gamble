import { Injectable, inject } from '@angular/core';
import { Application, Container } from 'pixi.js';
import { Reel } from '../model/reel';
import { GUI } from '../model/gui-module/gui';
import { PayTable } from '../model/pay-module/pay-table';
import { Char } from '../model/char-module/char';
import { DebugConfig } from '../model/interfaces';
import { GameConfig } from './game-config';
import { GameOverOverlay } from './game-over-overlay';
import { GameStateMachine } from './game-state-machine';

export enum GameStates {
	WAITING = 'WAITING',
	START = 'START',
	ROLL = 'ROLL',
	RESULTS = 'RESULTS',
	WIN = 'WIN',
	LOSE = 'LOSE'
}

@Injectable()
export class GameLogicService {
	public readonly DEFAULT_DMG = GameConfig.DEFAULT_DMG;
	public POTION_PRICE = GameConfig.INITIAL_POTION_PRICE;
	public readonly POTION_HEALTH = GameConfig.POTION_HEALTH;
	public debugConfig: DebugConfig | undefined;
	public readonly stateMachine = inject(GameStateMachine);
	private readonly _gameOverOverlay = inject(GameOverOverlay);

	constructor() {
		this._gameOverOverlay.onRestart(() => window.location.reload());
	}

	public get state(): GameStates {
		return this.stateMachine.getState();
	}

	public set state(value: GameStates) {
		this.stateMachine.transition(value);
	}

	public gameLoop(app: Application, sceneRoot: Container, reels: Reel, gui: GUI, payTable: PayTable, char: Char) {
		switch (this.stateMachine.getState()) {
			case GameStates.WAITING:
				break;
			case GameStates.START:
				if (char.credits > 0) {
					if (!char.usingSkill) {
						char.removeCredits(GameConfig.CREDIT_COST);
					}
					this.rollSlots(reels, char.usingSkill);
				} else {
					console.warn('Not enough credits to play');
					this.stateMachine.transition(GameStates.WAITING);
				}
				break;
			case GameStates.ROLL:
				break;
			case GameStates.RESULTS:
				this.checkReelResults(reels, payTable, char);
				break;
			case GameStates.WIN:
				break;
			case GameStates.LOSE:
				this._gameOverOverlay.setup(sceneRoot);
				this._gameOverOverlay.showDeath('You have survived for ' + char.roundsAlive.toString() + ' rounds');
				break;
		}
	}

	public rollSlots(reels: Reel, usingSkill: boolean) {
		if (this.stateMachine.getState() === GameStates.ROLL) return;
		this.stateMachine.transition(GameStates.ROLL);
		reels.spin(usingSkill);
	}

	public checkReelResults(reels: Reel, payTable: PayTable, char: Char) {
		payTable.checkPayStrategies(reels, char);
	}
}

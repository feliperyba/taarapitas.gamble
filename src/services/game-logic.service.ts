import { Injectable } from '@angular/core';
import { Container } from 'pixi.js';
import { Reel } from '../model/reel';
import { PayTable } from '../model/pay-module/pay-table';
import { Char } from '../model/char-module/char';
import { DebugConfig } from '../model/interfaces';
import { GameConfig } from './game-config';
import { GameOverOverlay } from './game-over-overlay';
import { GameStateMachine } from './game-state-machine';
import { GameStates } from '../model/game-states';

export { GameStates };

@Injectable({ providedIn: 'root' })
export class GameLogicService {
	public readonly DEFAULT_DMG = GameConfig.DEFAULT_DMG;
	private _potionPrice = GameConfig.INITIAL_POTION_PRICE;
	public readonly POTION_HEALTH = GameConfig.POTION_HEALTH;
	public debugConfig: DebugConfig | undefined;
	public readonly stateMachine = new GameStateMachine();
	private readonly _gameOverOverlay = new GameOverOverlay();
	private cleanupFns: (() => void)[] = [];
	private currentContext?: { sceneRoot: Container; reels: Reel; payTable: PayTable; char: Char };

	constructor() {
		this._gameOverOverlay.onRestart(() => window.location.reload());
		this.registerStateHandlers();
	}

	public get potionPrice(): number {
		return this._potionPrice;
	}

	public increasePotionPrice(): void {
		this._potionPrice *= GameConfig.POTION_PRICE_MULTIPLIER;
	}

	public get state(): GameStates {
		return this.stateMachine.getState();
	}

	public set state(value: GameStates) {
		this.stateMachine.transition(value);
	}

	public setGameContext(sceneRoot: Container, reels: Reel, payTable: PayTable, char: Char): void {
		this.currentContext = { sceneRoot, reels, payTable, char };
	}

	private registerStateHandlers(): void {
		this.cleanupFns.push(
			this.stateMachine.onEnter(GameStates.START, () => this.handleStart()),
			this.stateMachine.onEnter(GameStates.RESULTS, () => this.handleResults()),
			this.stateMachine.onEnter(GameStates.LOSE, () => this.handleLose())
		);
	}

	private handleStart(): void {
		if (!this.currentContext) return;
		const { reels, char } = this.currentContext;
		if (char.credits > 0) {
			if (!char.usingSkill) {
				char.removeCredits(GameConfig.CREDIT_COST);
			}
			this.rollSlots(reels, char.usingSkill);
		} else {
			console.warn('Not enough credits to play');
			this.stateMachine.transition(GameStates.WAITING);
		}
	}

	private handleResults(): void {
		if (!this.currentContext) return;
		this.checkReelResults(this.currentContext.reels, this.currentContext.payTable, this.currentContext.char);
	}

	private handleLose(): void {
		if (!this.currentContext) return;
		this._gameOverOverlay.setup(this.currentContext.sceneRoot);
		this._gameOverOverlay.showDeath(
			'You have survived for ' + this.currentContext.char.roundsAlive.toString() + ' rounds'
		);
	}

	public rollSlots(reels: Reel, usingSkill: boolean): void {
		if (this.stateMachine.getState() === GameStates.ROLL) return;
		this.stateMachine.transition(GameStates.ROLL);
		reels.spin(usingSkill);
	}

	public checkReelResults(reels: Reel, payTable: PayTable, char: Char): void {
		payTable.checkPayStrategies(reels, char);
	}

	public destroy(): void {
		for (const fn of this.cleanupFns) {
			fn();
		}
		
		this.cleanupFns = [];
		this._gameOverOverlay.destroy();
	}
}

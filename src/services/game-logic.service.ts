import { inject, Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { Container } from 'pixi.js';
import { Reel } from '../model/reel';
import { PayTable } from '../model/pay-module/pay-table';
import { Char } from '../model/char-module/char';
import { DebugConfig } from '../model/interfaces';
import { GameConfig } from './game-config';
import { GameStateMachine } from './game-state-machine';
import { GameStates } from '../model/game-states';
import { SKILL_CHARGE_MAX } from '../model/constants/skill';
import { clearWinHighlight } from '../model/pay-module/win-highlighter';
import type { GameReadState, GameTransitions, PotionPricing, GameDebug } from './game-state';

@Injectable({ providedIn: 'root' })
export class GameLogicService implements GameReadState, GameTransitions, PotionPricing, GameDebug {
	public readonly DEFAULT_DMG = GameConfig.DEFAULT_DMG;
	readonly potionPrice = signal<number>(GameConfig.INITIAL_POTION_PRICE);
	public readonly POTION_HEALTH = GameConfig.POTION_HEALTH;
	public debugConfig: DebugConfig | undefined;
	public readonly stateMachine = inject(GameStateMachine);
	private readonly _gameOver$ = new Subject<string>();
	public readonly gameOver$ = this._gameOver$.asObservable();
	private currentContext?: { sceneRoot: Container; reels: Reel; payTable: PayTable; char: Char };

	constructor() {
		this.stateMachine.onEnter(GameStates.LOSE, () => this.handleLose());
	}

	public increasePotionPrice(): void {
		this.potionPrice.update(p => p * GameConfig.POTION_PRICE_MULTIPLIER);
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

	public activateSkill(char: Char, reel: Reel): void {
		const canActivate = (char.specialBar() >= SKILL_CHARGE_MAX && this.state === GameStates.WAITING) ||
			this.state === GameStates.WIN;

		if (!canActivate) return;

		if (this.state === GameStates.WIN) {
			const winPos = reel.reelWinSlotPos;
			if (winPos !== undefined) { clearWinHighlight(reel, winPos); }
		}

		char.setUsingSkill(true);
		char.charContext.useClassSkill(char.charContext.target);

		if (char.charContext.target instanceof Char) {
			char.setUsingSkill(false);
			char.setSpecialBar(0);
		}
	}

	public buyPotion(char: Char): void {
		const price = this.potionPrice();
		if (char.credits() < price) return;

		char.heal(this.POTION_HEALTH);
		char.removeCredits(price);
		this.increasePotionPrice();
	}

	public handleStart(): void {
		if (!this.currentContext) return;
		const { reels, char } = this.currentContext;
		if (char.credits() > 0) {
			if (!char.usingSkill()) {
				char.removeCredits(GameConfig.CREDIT_COST);
			}
			this.rollSlots(reels, char.usingSkill());
		} else {
			console.warn('Not enough credits to play');
			this.stateMachine.transition(GameStates.WAITING);
		}
	}

	public handleResults(): void {
		if (!this.currentContext) return;
		this.checkReelResults(this.currentContext.reels, this.currentContext.payTable, this.currentContext.char);
	}

	private handleLose(): void {
		if (!this.currentContext) return;
		this._gameOver$.next(
			'You have survived for ' + this.currentContext.char.roundsAlive().toString() + ' rounds'
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
		this._gameOver$.complete();
	}
}

import { Signal } from '@angular/core';
import { GameStates } from '../model/game-states';
import { GameStateMachine } from './game-state-machine';
import { Reel } from '../model/reel';
import { PayTable } from '../model/pay-module/pay-table';
import { Char } from '../model/char-module/char';
import type { DebugConfig } from '../model/interfaces';

export interface GameReadState {
	readonly state: GameStates;
	readonly stateMachine: GameStateMachine;
}

export interface GameTransitions {
	rollSlots(reels: Reel, usingSkill: boolean): void;
	checkReelResults(reels: Reel, payTable: PayTable, char: Char): void;
	activateSkill(char: Char, reel: Reel): void;
	buyPotion(char: Char): void;
}

export interface PotionPricing {
	readonly potionPrice: Signal<number>;
	readonly POTION_HEALTH: number;
	increasePotionPrice(): void;
}

export interface GameDebug {
	debugConfig: DebugConfig | undefined;
}

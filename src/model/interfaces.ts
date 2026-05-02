import { REEL_VALUES, REEL_POSITIONS } from './reel-types';

export type PayResult = number | null;

export type BattleOutcome = 'WIN' | 'LOSE' | 'WAITING';

export enum CharTargetType {
	Char = 'Char',
	Reel = 'Reel'
}

export interface DebugSymbolValue {
	value: `${REEL_VALUES}`;
}

export interface DebugPositionValue {
	value: `${REEL_POSITIONS}`;
}

export interface DebugReel {
	symbol: DebugSymbolValue;
	position: DebugPositionValue;
}

export interface DebugConfig {
	enabledDebug: boolean;
	isFixed: boolean;
	credits: number;
	reels: DebugReel[];
}

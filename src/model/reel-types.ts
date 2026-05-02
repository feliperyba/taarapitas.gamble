import { Container, Sprite } from 'pixi.js';

export enum REEL_POSITIONS {
	TOP = 'TOP',
	CENTER = 'CENTER',
	BOTTOM = 'BOTTOM'
}

export enum REEL_VALUES {
	X3BAR = 'X3BAR',
	BAR = 'BAR',
	X2BAR = 'X2BAR',
	SEVEN = 'SEVEN',
	CHERRY = 'CHERRY',
}

export const REEL_POSITION_INDEX: Record<REEL_POSITIONS, number> = {
	[REEL_POSITIONS.TOP]: 1,
	[REEL_POSITIONS.CENTER]: 2,
	[REEL_POSITIONS.BOTTOM]: 3,
};

export interface ReelData {
	container: Container;
	symbols: Sprite[];
	symbolsPosition: REEL_VALUES[];
	position: number;
	previousPosition: number;
	randomSymbolValue: REEL_VALUES;
	randomPosValue: number;
	blur: { strengthX: number; strengthY: number };
}

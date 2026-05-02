import { Reel, REEL_POSITION_INDEX, REEL_POSITIONS, REEL_VALUES } from '../../../model/reel';
import { Texture } from 'pixi.js';
import { getTexture } from '../../../rendering/assets';

import { COMBINATIONS } from '../combinations';

const WIN_TINT = 0xff0000;
const MATCH_COUNT = 3;
const ALL_POSITIONS: REEL_POSITIONS[] = [REEL_POSITIONS.TOP, REEL_POSITIONS.CENTER, REEL_POSITIONS.BOTTOM];

export interface PayStrategy {
	readonly payIcon: Texture;
	readonly enumIndex: COMBINATIONS;
	readonly combinationDescription: string;
	readonly description: string;
	check(reel: Reel): COMBINATIONS | null;
}

export class CherryTopStrategy implements PayStrategy {
	public readonly payIcon: Texture = getTexture('assets/CherryIcon.png');
	public readonly enumIndex = COMBINATIONS.CHERRY_TOP;
	public readonly combinationDescription = 'X3 ';
	public readonly description = 'Top';

	public check(reel: Reel): COMBINATIONS | null {
		for (const r of reel.reelArr) {
			if (r.symbolsPosition[REEL_POSITION_INDEX[REEL_POSITIONS.TOP]] !== REEL_VALUES.CHERRY) {
				return null;
			}
		}
		for (const r of reel.reelArr) {
			r.container.children[REEL_POSITION_INDEX[REEL_POSITIONS.TOP]].tint = WIN_TINT;
		}
		reel.reelWinSlotPos = REEL_POSITION_INDEX[REEL_POSITIONS.TOP];
		return COMBINATIONS.CHERRY_TOP;
	}
}

export class CherryCenterStrategy implements PayStrategy {
	public readonly payIcon: Texture = getTexture('assets/CherryIcon.png');
	public readonly enumIndex = COMBINATIONS.CHERRY_CENTER;
	public readonly combinationDescription = 'X3 ';
	public readonly description = 'Center';

	public check(reel: Reel): COMBINATIONS | null {
		for (const r of reel.reelArr) {
			if (r.symbolsPosition[REEL_POSITION_INDEX[REEL_POSITIONS.CENTER]] !== REEL_VALUES.CHERRY) {
				return null;
			}
		}

		for (const r of reel.reelArr) {
			r.container.children[REEL_POSITION_INDEX[REEL_POSITIONS.CENTER]].tint = WIN_TINT;
		}
		reel.reelWinSlotPos = REEL_POSITION_INDEX[REEL_POSITIONS.CENTER];
		return COMBINATIONS.CHERRY_CENTER;
	}
}

export class CherryBottonStrategy implements PayStrategy {
	public readonly payIcon: Texture = getTexture('assets/CherryIcon.png');
	public readonly enumIndex = COMBINATIONS.CHERRY_BOTTOM;
	public readonly combinationDescription = 'X3 ';
	public readonly description = 'Botton';

	public check(reel: Reel): COMBINATIONS | null {
		for (const r of reel.reelArr) {
			if (r.symbolsPosition[REEL_POSITION_INDEX[REEL_POSITIONS.BOTTOM]] !== REEL_VALUES.CHERRY) {
				return null;
			}
		}
		for (const r of reel.reelArr) {
			r.container.children[REEL_POSITION_INDEX[REEL_POSITIONS.BOTTOM]].tint = WIN_TINT;
		}
		reel.reelWinSlotPos = REEL_POSITION_INDEX[REEL_POSITIONS.BOTTOM];
		return COMBINATIONS.CHERRY_BOTTOM;
	}
}

export class SevenStrategy implements PayStrategy {
	public readonly payIcon: Texture = getTexture('assets/7Icon.png');
	public readonly enumIndex = COMBINATIONS.SEVEN;
	public readonly combinationDescription = 'X3 ';
	public readonly description = 'Any';

	public check(reel: Reel): COMBINATIONS | null {
		let count = 0;

		for (const position of ALL_POSITIONS) {
			for (const r of reel.reelArr) {
				if (r.symbolsPosition[REEL_POSITION_INDEX[position]] === REEL_VALUES.SEVEN) {
					count++;
				}
			}
			if (count === MATCH_COUNT) {
				for (const r of reel.reelArr) {
					r.container.children[REEL_POSITION_INDEX[position]].tint = WIN_TINT;
				}
				reel.reelWinSlotPos = REEL_POSITION_INDEX[position];
				return COMBINATIONS.SEVEN;
			}
			count = 0;
		}
		return null;
	}
}

export class SevenCherryStrategy implements PayStrategy {
	public readonly payIcon: Texture = getTexture('assets/CherrySevenIcon.png');
	public readonly enumIndex = COMBINATIONS.SEVEN_CHERRY;
	public readonly combinationDescription = 'Any';
	public readonly description = 'Any';

	public check(reel: Reel): COMBINATIONS | null {
		let count = 0;

		for (const position of ALL_POSITIONS) {
			for (const r of reel.reelArr) {
				if (
					r.symbolsPosition[REEL_POSITION_INDEX[position]] === REEL_VALUES.SEVEN ||
					r.symbolsPosition[REEL_POSITION_INDEX[position]] === REEL_VALUES.CHERRY
				) {
					count++;
				}
			}
			if (count === MATCH_COUNT) {
				for (const r of reel.reelArr) {
					r.container.children[REEL_POSITION_INDEX[position]].tint = WIN_TINT;
				}
				reel.reelWinSlotPos = REEL_POSITION_INDEX[position];
				return COMBINATIONS.SEVEN_CHERRY;
			}
			count = 0;
		}
		return null;
	}
}

export class X3BarStrategy implements PayStrategy {
	public readonly payIcon: Texture = getTexture('assets/X3BarIcon.png');
	public readonly enumIndex = COMBINATIONS.X3BAR;
	public readonly combinationDescription = 'X3 ';
	public readonly description = 'Any';

	public check(reel: Reel): COMBINATIONS | null {
		let count = 0;

		for (const position of ALL_POSITIONS) {
			for (const r of reel.reelArr) {
				if (r.symbolsPosition[REEL_POSITION_INDEX[position]] === REEL_VALUES.X3BAR) {
					count++;
				}
			}
			if (count === MATCH_COUNT) {
				for (const r of reel.reelArr) {
					r.container.children[REEL_POSITION_INDEX[position]].tint = WIN_TINT;
				}
				reel.reelWinSlotPos = REEL_POSITION_INDEX[position];
				return COMBINATIONS.X3BAR;
			}
			count = 0;
		}
		return null;
	}
}

export class X2BarStrategy implements PayStrategy {
	public readonly payIcon: Texture = getTexture('assets/X2BarIcon.png');
	public readonly enumIndex = COMBINATIONS.X2BAR;
	public readonly combinationDescription = 'X3 ';
	public readonly description = 'Any';

	public check(reel: Reel): COMBINATIONS | null {
		let count = 0;

		for (const position of ALL_POSITIONS) {
			for (const r of reel.reelArr) {
				if (r.symbolsPosition[REEL_POSITION_INDEX[position]] === REEL_VALUES.X2BAR) {
					count++;
				}
			}
			if (count === MATCH_COUNT) {
				for (const r of reel.reelArr) {
					r.container.children[REEL_POSITION_INDEX[position]].tint = WIN_TINT;
				}
				reel.reelWinSlotPos = REEL_POSITION_INDEX[position];
				return COMBINATIONS.X2BAR;
			}
			count = 0;
		}
		return null;
	}
}

export class BarStrategy implements PayStrategy {
	public readonly payIcon: Texture = getTexture('assets/BarIcon.png');
	public readonly enumIndex = COMBINATIONS.BAR;
	public readonly combinationDescription = 'X3 ';
	public readonly description = 'Any';

	public check(reel: Reel): COMBINATIONS | null {
		let count = 0;

		for (const position of ALL_POSITIONS) {
			for (const r of reel.reelArr) {
				if (r.symbolsPosition[REEL_POSITION_INDEX[position]] === REEL_VALUES.BAR) {
					count++;
				}
			}
			if (count === MATCH_COUNT) {
				for (const r of reel.reelArr) {
					r.container.children[REEL_POSITION_INDEX[position]].tint = WIN_TINT;
				}
				reel.reelWinSlotPos = REEL_POSITION_INDEX[position];
				return COMBINATIONS.BAR;
			}
			count = 0;
		}
		return null;
	}
}

export class AnyBarStrategy implements PayStrategy {
	public readonly payIcon: Texture = getTexture('assets/AnyBarIcon.png');
	public readonly enumIndex = COMBINATIONS.ANY_BAR;
	public readonly combinationDescription = 'Any';
	public readonly description = 'Any';

	public check(reel: Reel): COMBINATIONS | null {
		let count = 0;

		for (const position of ALL_POSITIONS) {
			for (const r of reel.reelArr) {
				if (
					r.symbolsPosition[REEL_POSITION_INDEX[position]] === REEL_VALUES.BAR ||
					r.symbolsPosition[REEL_POSITION_INDEX[position]] === REEL_VALUES.X2BAR ||
					r.symbolsPosition[REEL_POSITION_INDEX[position]] === REEL_VALUES.X3BAR
				) {
					count++;
				}
			}
			if (count === MATCH_COUNT) {
				for (const r of reel.reelArr) {
					r.container.children[REEL_POSITION_INDEX[position]].tint = WIN_TINT;
				}
				reel.reelWinSlotPos = REEL_POSITION_INDEX[position];
				return COMBINATIONS.ANY_BAR;
			}
			count = 0;
		}
		return null;
	}
}

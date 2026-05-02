import { Reel } from '../../reel';
import { REEL_POSITION_INDEX, REEL_POSITIONS, REEL_VALUES } from '../../reel-types';
import { Texture } from 'pixi.js';
import { getTexture } from '../../../rendering/assets';
import { COMBINATIONS } from '../combinations';
import type { WinResult } from '../win-highlighter';

const MATCH_COUNT = 3;
const ALL_POSITIONS: REEL_POSITIONS[] = [REEL_POSITIONS.TOP, REEL_POSITIONS.CENTER, REEL_POSITIONS.BOTTOM];

export interface PayDisplayInfo {
	readonly payIcon: Texture;
	readonly enumIndex: COMBINATIONS;
	readonly displayLabel: string;
	readonly displayDetail: string;
}

export interface PayCheckStrategy extends PayDisplayInfo {
	check(reel: Reel): WinResult | null;
}

export function createPositionMatchStrategy(config: {
	iconPath: string;
	enumIndex: COMBINATIONS;
	position: REEL_POSITIONS;
	reelValue: REEL_VALUES;
	displayLabel: string;
	displayDetail: string;
}): PayCheckStrategy {
	return {
		payIcon: getTexture(config.iconPath),
		enumIndex: config.enumIndex,
		displayLabel: config.displayLabel,
		displayDetail: config.displayDetail,
		check(reel: Reel): WinResult | null {
			const posIndex = REEL_POSITION_INDEX[config.position];
			for (const r of reel.reelArr) {
				if (r.symbolsPosition[posIndex] !== config.reelValue) {
					return null;
				}
			}
			return { combination: config.enumIndex, positionIndex: posIndex };
		}
	};
}

export function createAnyLineMatchStrategy(config: {
	iconPath: string;
	enumIndex: COMBINATIONS;
	reelValue: REEL_VALUES;
	displayLabel: string;
	displayDetail: string;
}): PayCheckStrategy {
	return {
		payIcon: getTexture(config.iconPath),
		enumIndex: config.enumIndex,
		displayLabel: config.displayLabel,
		displayDetail: config.displayDetail,
		check(reel: Reel): WinResult | null {
			let count = 0;
			for (const position of ALL_POSITIONS) {
				for (const r of reel.reelArr) {
					if (r.symbolsPosition[REEL_POSITION_INDEX[position]] === config.reelValue) {
						count++;
					}
				}
				if (count === MATCH_COUNT) {
					return { combination: config.enumIndex, positionIndex: REEL_POSITION_INDEX[position] };
				}
				count = 0;
			}
			return null;
		}
	};
}

export function createMultiValueMatchStrategy(config: {
	iconPath: string;
	enumIndex: COMBINATIONS;
	reelValues: REEL_VALUES[];
	displayLabel: string;
	displayDetail: string;
}): PayCheckStrategy {
	return {
		payIcon: getTexture(config.iconPath),
		enumIndex: config.enumIndex,
		displayLabel: config.displayLabel,
		displayDetail: config.displayDetail,
		check(reel: Reel): WinResult | null {
			let count = 0;
			for (const position of ALL_POSITIONS) {
				for (const r of reel.reelArr) {
					if (config.reelValues.includes(r.symbolsPosition[REEL_POSITION_INDEX[position]])) {
						count++;
					}
				}
				if (count === MATCH_COUNT) {
					return { combination: config.enumIndex, positionIndex: REEL_POSITION_INDEX[position] };
				}
				count = 0;
			}
			return null;
		}
	};
}
